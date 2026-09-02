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

function captureFetchUrl() {
  const urls: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    urls.push(String(input));
    return new Response(
      JSON.stringify({ features: [] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;
  return urls;
}

describe("photon geocoder reverse", () => {
  it("mapea la feature de reverse a una suggestion con label legible", async () => {
    mockFetch([
      {
        geometry: { coordinates: [-59.1332, -37.3217] },
        properties: {
          name: "Terminal de Ómnibus",
          street: "Av. Colón",
          housenumber: "1100",
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
    assert.match(suggestion.label, /Terminal de Ómnibus/);
    assert.match(suggestion.label, /Tandil/);
    assert.equal(suggestion.placeId, "N/42");
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

describe("photon geocoder params", () => {
  it("search no envía lang=es (Photon rechaza 'es' con 400)", async () => {
    const urls = captureFetchUrl();
    await createPhotonGeocoder().search({
      query: "colón",
      bias: { lat: -37.3217, lon: -59.1332 },
    });
    assert.equal(urls.length, 1);
    assert.match(urls[0], /\/api\/\?/);
    assert.match(urls[0], /q=col%C3%B3n/);
    assert.doesNotMatch(urls[0], /lang=/);
  });

  it("reverse no envía lang=es", async () => {
    const urls = captureFetchUrl();
    await createPhotonGeocoder().reverse({ lat: -37.3217, lng: -59.1332 });
    assert.equal(urls.length, 1);
    assert.match(urls[0], /\/reverse\?/);
    assert.match(urls[0], /lat=-37\.3217/);
    assert.match(urls[0], /lon=-59\.1332/);
    assert.doesNotMatch(urls[0], /lang=/);
  });
});
