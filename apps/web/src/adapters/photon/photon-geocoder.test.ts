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

function captureFetch(responses?: Array<{ features?: unknown[]; status?: number; body?: string }>) {
  const calls: { url: string; headers?: Record<string, string> }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const idx = calls.length;
    calls.push({
      url: String(input),
      headers: init?.headers as Record<string, string> | undefined,
    });
    const r = responses?.[idx] ?? { features: [] };
    return new Response(
      JSON.stringify(r.features !== undefined ? { features: r.features } : r.body),
      {
        status: r.status ?? 200,
        headers: { "content-type": "application/json" },
      },
    );
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
  const bias = {
    lat: -37.3217,
    lon: -59.1332,
    bbox: { minLng: -59.8, minLat: -37.7, maxLng: -58.8, maxLat: -36.9 },
  };

  it("usa lang=default y User-Agent (nunca lang=es)", async () => {
    const calls = captureFetch([
      { features: [] },
      { features: [] },
      { features: [] },
    ]);

    await createPhotonGeocoder().search({
      query: "San Martin 454",
      bias,
    });

    assert.ok(calls.length >= 1);
    for (const call of calls) {
      const url = new URL(call.url);
      assert.equal(url.searchParams.get("lang"), "default");
      assert.match(call.headers?.["user-agent"] ?? "", /Tubi\/1\.0/);
    }
  });

  it("primer intento usa bbox y devuelve hits sin reintentar", async () => {
    const calls = captureFetch([
      {
        features: [
          {
            geometry: { coordinates: [-59.1386, -37.327] },
            properties: {
              street: "San Martín",
              housenumber: "454",
              city: "Tandil",
              osm_id: 1,
              osm_type: "W",
            },
          },
        ],
      },
    ]);

    const result = await createPhotonGeocoder().search({
      query: "San Martin 454",
      bias,
    });

    assert.equal(calls.length, 1);
    const url = new URL(calls[0].url);
    assert.equal(url.searchParams.get("bbox"), "-59.8,-37.7,-58.8,-36.9");
    assert.equal(result.error, null);
    assert.equal(result.results.length, 1);
  });

  it("reintenta sin bbox cuando el bbox devuelve vacío", async () => {
    const calls = captureFetch([
      { features: [] },
      {
        features: [
          {
            geometry: { coordinates: [-59.1386, -37.327] },
            properties: { street: "San Martín", city: "Tandil", osm_id: 1, osm_type: "W" },
          },
        ],
      },
    ]);

    const result = await createPhotonGeocoder().search({
      query: "San Martin 454",
      bias,
    });

    assert.equal(calls.length, 2);
    const url = new URL(calls[1].url);
    assert.equal(url.searchParams.get("bbox"), null);
    assert.equal(url.searchParams.get("lat"), "-37.3217");
    assert.equal(result.results.length, 1);
  });

  it("agrega sufijo Tandil cuando bbox y sin-bbox devuelven vacío", async () => {
    const calls = captureFetch([
      { features: [] },
      { features: [] },
      {
        features: [
          {
            geometry: { coordinates: [-59.1386, -37.327] },
            properties: { street: "San Martín", city: "Tandil", osm_id: 1, osm_type: "W" },
          },
        ],
      },
    ]);

    const result = await createPhotonGeocoder().search({
      query: "San Martin 454",
      bias,
    });

    assert.equal(calls.length, 3);
    const url = new URL(calls[2].url);
    assert.equal(url.searchParams.get("q"), "San Martin 454 Tandil");
    assert.equal(result.results.length, 1);
  });

  it("no agrega sufijo Tandil si la query ya lo menciona", async () => {
    const calls = captureFetch([{ features: [] }, { features: [] }]);

    await createPhotonGeocoder().search({
      query: "San Martin 454 Tandil",
      bias,
    });

    assert.equal(calls.length, 2);
    assert.equal(new URL(calls[1].url).searchParams.get("q"), "San Martin 454 Tandil");
  });

  it("devuelve error GEOCODER_UPSTREAM ante un 400 de Photon", async () => {
    mockStatus(400, JSON.stringify({ lang: [{ message: "unsupported" }] }));

    const result = await createPhotonGeocoder().search({
      query: "San Martin 454",
    });

    assert.deepEqual(result, { results: [], error: "GEOCODER_UPSTREAM" });
  });

  it("devuelve vacío sin error si todos los intentos responden OK vacíos", async () => {
    const calls = captureFetch([
      { features: [] },
      { features: [] },
      { features: [] },
    ]);

    const result = await createPhotonGeocoder().search({
      query: "Calle inexistente 999",
      bias,
    });

    assert.equal(calls.length, 3);
    assert.deepEqual(result, { results: [], error: null });
  });

  it("devuelve vacío sin error si la query está vacía", async () => {
    const result = await createPhotonGeocoder().search({ query: "   " });
    assert.deepEqual(result, { results: [], error: null });
  });
});
