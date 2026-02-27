import test from "node:test";
import assert from "node:assert/strict";
import workerModule from "../src/index.ts";

const worker = workerModule.default;

const env = {
  APP_ENV: "test",
  API_WRITE_KEY: undefined,
  openclaw_pos: {
    prepare() {
      throw new Error("DB should not be used in these smoke tests");
    },
  },
};

const call = async (path, { method = "GET", body, headers = {}, overrideEnv } = {}) => {
  const req = new Request(`https://example.com${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const res = await worker.fetch(req, overrideEnv ?? env);
  const json = await res.json();
  return { res, json };
};

test("health + modules endpoints are reachable", async () => {
  const health = await call("/v1/health");
  assert.equal(health.res.status, 200);
  assert.equal(health.json.ok, true);

  const modules = await call("/v1/modules");
  assert.equal(modules.res.status, 200);
  assert.equal(modules.json.ok, true);
  assert.ok(modules.json.modules.procurement);
});

test("returns route exists and validates payload", async () => {
  const envWithKey = { ...env, API_WRITE_KEY: "secret-key" };
  const { res, json } = await call("/v1/sales-returns", {
    method: "POST",
    headers: { "x-api-key": "secret-key" },
    body: {},
    overrideEnv: envWithKey,
  });
  assert.equal(res.status, 400);
  assert.match(json.error, /Required fields/i);
});

test("procurement lifecycle transition route validates required fields", async () => {
  const envWithKey = { ...env, API_WRITE_KEY: "secret-key" };
  const { res, json } = await call("/v1/purchase-orders/transition", {
    method: "POST",
    headers: { "x-api-key": "secret-key" },
    body: {},
    overrideEnv: envWithKey,
  });
  assert.equal(res.status, 400);
  assert.match(json.error, /Required fields/i);
});

test("payroll basics route validates pay cycle payload", async () => {
  const envWithKey = { ...env, API_WRITE_KEY: "secret-key" };
  const { res, json } = await call("/v1/pay-cycles", {
    method: "POST",
    headers: { "x-api-key": "secret-key" },
    body: {},
    overrideEnv: envWithKey,
  });
  assert.equal(res.status, 400);
  assert.match(json.error, /Required fields/i);
});

test("day close summary enforces query params", async () => {
  const { res, json } = await call("/v1/day-close-summary");
  assert.equal(res.status, 400);
  assert.match(json.error, /Query params required/i);
});

test("write routes require x-api-key when API_WRITE_KEY is configured", async () => {
  const envWithKey = {
    ...env,
    API_WRITE_KEY: "secret-key",
  };

  const unauthorized = await call("/v1/sales-returns", {
    method: "POST",
    body: { id: "ret-1" },
    overrideEnv: envWithKey,
  });
  assert.equal(unauthorized.res.status, 401);
  assert.equal(unauthorized.json.error, "Unauthorized");

  const authorized = await call("/v1/sales-returns", {
    method: "POST",
    headers: { "x-api-key": "secret-key" },
    body: {},
    overrideEnv: envWithKey,
  });
  assert.equal(authorized.res.status, 400);
});
