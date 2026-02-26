export default {
  async fetch(request: Request, env: { openclaw_pos: D1Database; APP_ENV: string }) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "openclaw-pos-api", env: env.APP_ENV });
    }

    if (url.pathname === "/db-check") {
      const row = await env.openclaw_pos
        .prepare("SELECT datetime('now') as now_utc")
        .first<{ now_utc: string }>();
      return Response.json({ ok: true, db_time: row?.now_utc ?? null });
    }

    return Response.json(
      {
        ok: true,
        message: "openclaw-pos API online",
        routes: ["/health", "/db-check"],
      },
      { status: 200 }
    );
  },
};
