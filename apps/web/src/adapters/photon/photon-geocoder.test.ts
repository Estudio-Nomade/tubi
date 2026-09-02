import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { createPhotonGeocoder } from "./photon-geocoder";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetch(features: unknown[]) {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ features }),
      { status: 200, headers: { "content-type": "application/json" } },
    )) as typeof fetch;
}

function mockStatus(status: number, body: string) {
  globalThis.fetch = (async () =>
    new Response(body, {
      status,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
}

function captureFetch() {
  const calls: { url: string; headers?: Record<string, string> }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      headers: init?.headers as Record<string, string> | undefined,
    });
    return new Response(JSON.stringify({ features: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  return calls;
}

describe("photon geocoder reverse", () => {
  it("mantiene el name de un POI cuando no hay calle", async () => {
    mockFetch([
      {
        geometry: { coordinates: [-59.1332, -37.3217] },
        properties: {
          name: "Terminal de Ómnibus",
          city: "Tandil",
          osm_id: 42,
          osm_type: "N",
        },
      },
    ]);

    const suggestion = await createPhotonGeocoder().reverse({
      lat: -37.3217,
      lng: -59.1332,
    });

    assert.ok(suggestion);
    assert.equal(suggestion.lat, -37.3217);
    assert.equal(suggestion.lng, -59.1332);
    assert.equal(suggestion.label, "Terminal de Ómnibus, Tandil");
    assert.equal(suggestion.placeId, "N/42");
  });

  it("prioriza calle + altura antes que el name", async () => {
    mockFetch([
      {
        geometry: { coordinates: [-59.1386, -37.327] },
        properties: {
          name: "Terminal de Ómnibus",
          street: "Av. Colón",
          housenumber: "1100",
          city: "Tandil",
          state: "Buenos Aires",
          country: "Argentina",
          osm_id: 42,
          osm_type: "N",
        },
      },
    ]);

    const suggestion = await createPhotonGeocoder().reverse({
      lat: -37.3217,
      lng: -59.1332,
    });

    assert.ok(suggestion);
    assert.equal(
      suggestion.label,
      "Av. Colón 1100, Tandil, Buenos Aires, Argentina",
    );
  });

  it("devuelve null si no hay features", async () => {
    mockFetch([]);
    const suggestion = await createPhotonGeocoder().reverse({
      lat: -37.3217,
      lng: -59.1332,
    });
    assert.equal(suggestion, null);
  });

  it("devuelve null si la red falla", async () => {
    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as typeof fetch;

    const suggestion = await createPhotonGeocoder().reverse({
      lat: -37.3217,
      lng: -59.1332,
    });
    assert.equal(suggestion, null);
  });

  it("devuelve null si las coords no son finitas", async () => {
    const suggestion = await createPhotonGeocoder().reverse({
      lat: Number.NaN,
      lng: -59.1332,
    });
    assert.equal(suggestion, null);
  });
});

describe("photon geocoder search", () => {
  it("usa lang=default y User-Agent (nunca lang=es)", async () => {
    const calls = captureFetch();

    await createPhotonGeocoder().search({
      query: "San Martin 454",
      bias: {
        lat: -37.3217,
        lon: -59.1332,
        bbox: { minLng: -59.8, minLat: -37.7, maxLng: -58.8, maxLat: -36.9 },
      },
    });

    assert.equal(calls.length, 1);
    const url = new URL(calls[0].url);
    assert.equal(url.searchParams.get("lang"), "default");
    assert.equal(url.searchParams.get("q"), "San Martin 454");
    assert.equal(url.searchParams.get("lat"), "-37.3217");
    assert.equal(url.searchParams.get("bbox"), "-59.8,-37.7,-58.8,-36.9");
    assert.match(calls[0].headers?.["user-agent"] ?? "", /Tubi\/1\.0/);
  });

  it("devuelve [] ante un 400 de Photon (ej. lang inválido)", async () => {
    mockStatus(400, JSON.stringify({ lang: [{ message: "unsupported" }] }));

    const results = await createPhotonGeocoder().search({
      query: "San Martin 454",
    });

    assert.deepEqual(results, []);
  });

  it("devuelve [] si la query está vacía", async () => {
    const results = await createPhotonGeocoder().search({ query: "   " });
    assert.deepEqual(results, []);
  });
});
