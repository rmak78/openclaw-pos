const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export default {
  async fetch(request: Request, env: { openclaw_pos: D1Database; APP_ENV: string }) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/health") {
      return json({ ok: true, service: "openclaw-pos-api", env: env.APP_ENV });
    }

    if (path === "/db-check") {
      const row = await env.openclaw_pos
        .prepare("SELECT datetime('now') as now_utc")
        .first<{ now_utc: string }>();
      return json({ ok: true, db_time: row?.now_utc ?? null });
    }

    // v1 root
    if (path === "/v1" || path === "/v1/") {
      return json({
        ok: true,
        api: "v1",
        routes: [
          "GET /v1/health",
          "GET /v1/db-check",
          "GET /v1/meta",
        ],
      });
    }

    if (path === "/v1/health") {
      return json({ ok: true, api: "v1", service: "openclaw-pos-api", env: env.APP_ENV });
    }

    if (path === "/v1/db-check") {
      const row = await env.openclaw_pos
        .prepare("SELECT datetime('now') as now_utc")
        .first<{ now_utc: string }>();
      return json({ ok: true, api: "v1", db_time: row?.now_utc ?? null });
    }

    if (path === "/v1/meta") {
      return json({
        ok: true,
        api: "v1",
        version: "0.1.0",
        deployedOn: "cloudflare-workers",
        db: "d1:openclaw_pos",
      });
    }

    return json(
      {
        ok: false,
        error: "Not Found",
        message: "Use /v1 for versioned endpoints",
      },
      404
    );
  },
};
