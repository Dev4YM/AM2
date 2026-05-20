/**
 * Smoke tests — run with API + web dev servers or CI against built apps.
 * Usage: node --test tests/smoke/am2-smoke.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const API = process.env.AM2_API_URL ?? "http://127.0.0.1:4000";
const KEY = process.env.AM2_INTERNAL_API_KEY ?? "";

function apiHeaders(userId) {
  const h = { "x-am2-internal-key": KEY };
  if (userId) h["x-user-id"] = userId;
  return h;
}

describe("AM2 API smoke", { skip: !KEY }, () => {
  it("health is public", async () => {
    const res = await fetch(`${API}/health/live`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ok");
  });

  it("geo countries is public", async () => {
    const res = await fetch(`${API}/geo/countries`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.countries));
  });

  it("search requires internal key", async () => {
    const res = await fetch(
      `${API}/search?country=US&region=us-west&province=US-CO&limit=40`,
    );
    assert.equal(res.status, 401);
  });

  it("search with key and geo params", async () => {
    const res = await fetch(
      `${API}/search?country=US&region=us-west&province=US-CO&limit=40`,
      { headers: apiHeaders("smoke-test-user") },
    );
    assert.ok(res.status === 200 || res.status === 400);
  });
});

describe("shared geo", async () => {
  const { countryHasGeoHierarchy, getRegionsForCountry } = await import(
    "@am2/shared"
  );

  it("US CA GB DE FR have hierarchy", () => {
    for (const code of ["US", "CA", "GB", "DE", "FR"]) {
      assert.ok(countryHasGeoHierarchy(code), code);
      assert.ok(getRegionsForCountry(code).length > 0, code);
    }
  });
});
