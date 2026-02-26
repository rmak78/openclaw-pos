const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const badRequest = (message: string) => json({ ok: false, error: message }, 400);

export default {
  async fetch(request: Request, env: { openclaw_pos: D1Database; APP_ENV: string }) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (path === "/health") {
      return json({ ok: true, service: "openclaw-pos-api", env: env.APP_ENV });
    }

    if (path === "/db-check") {
      const row = await env.openclaw_pos
        .prepare("SELECT datetime('now') as now_utc")
        .first<{ now_utc: string }>();
      return json({ ok: true, db_time: row?.now_utc ?? null });
    }

    if (path === "/v1" || path === "/v1/") {
      return json({
        ok: true,
        api: "v1",
        routes: [
          "GET /v1/health",
          "GET /v1/db-check",
          "GET /v1/meta",
          "GET /v1/org-units",
          "POST /v1/org-units",
          "GET /v1/employees",
          "POST /v1/employees"
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
        version: "0.2.0",
        deployedOn: "cloudflare-workers",
        db: "d1:openclaw_pos",
      });
    }

    if (path === "/v1/org-units" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(
          `SELECT id, parent_id, unit_type, code, name, country_code, currency_code, is_active, created_at, updated_at
           FROM org_units
           ORDER BY created_at DESC
           LIMIT 200`
        )
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/org-units" && method === "POST") {
      const body = (await request.json().catch(() => null)) as
        | {
            id?: string;
            parent_id?: string | null;
            unit_type?: string;
            code?: string;
            name?: string;
            country_code?: string | null;
            currency_code?: string | null;
            is_active?: number;
          }
        | null;

      if (!body?.id || !body?.unit_type || !body?.code || !body?.name) {
        return badRequest("Required fields: id, unit_type, code, name");
      }

      try {
        await env.openclaw_pos
          .prepare(
            `INSERT INTO org_units (id, parent_id, unit_type, code, name, country_code, currency_code, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            body.id,
            body.parent_id ?? null,
            body.unit_type,
            body.code,
            body.name,
            body.country_code ?? null,
            body.currency_code ?? null,
            body.is_active ?? 1
          )
          .run();

        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/employees" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(
          `SELECT id, employee_code, full_name, employment_type, country_code, legal_entity_id, branch_id, is_active, created_at, updated_at
           FROM employees
           ORDER BY created_at DESC
           LIMIT 200`
        )
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/employees" && method === "POST") {
      const body = (await request.json().catch(() => null)) as
        | {
            id?: string;
            employee_code?: string;
            full_name?: string;
            employment_type?: string;
            country_code?: string;
            legal_entity_id?: string | null;
            branch_id?: string | null;
            is_active?: number;
          }
        | null;

      if (!body?.id || !body?.employee_code || !body?.full_name || !body?.employment_type || !body?.country_code) {
        return badRequest("Required fields: id, employee_code, full_name, employment_type, country_code");
      }

      try {
        await env.openclaw_pos
          .prepare(
            `INSERT INTO employees (id, employee_code, full_name, employment_type, country_code, legal_entity_id, branch_id, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            body.id,
            body.employee_code,
            body.full_name,
            body.employment_type,
            body.country_code,
            body.legal_entity_id ?? null,
            body.branch_id ?? null,
            body.is_active ?? 1
          )
          .run();

        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
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
