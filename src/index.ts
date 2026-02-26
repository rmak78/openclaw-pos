const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const badRequest = (message: string) => json({ ok: false, error: message }, 400);

const unauthorized = () => json({ ok: false, error: "Unauthorized" }, 401);

const nowIso = () => new Date().toISOString();

const requireApiKey = (request: Request, env: { API_WRITE_KEY?: string }) => {
  if (!env.API_WRITE_KEY) return false;
  const key = request.headers.get("x-api-key");
  return key === env.API_WRITE_KEY;
};

export default {
  async fetch(
    request: Request,
    env: { openclaw_pos: D1Database; APP_ENV: string; API_WRITE_KEY?: string }
  ) {
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
          "GET/POST /v1/org-units",
          "GET/POST /v1/employees",
          "GET/POST /v1/channels",
          "GET/POST /v1/channel-accounts",
          "GET/POST /v1/orders",
          "GET/POST /v1/shipments",
          "POST /v1/connectors/shopify/order-webhook",
          "POST /v1/connectors/amazon/order-webhook",
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
        version: "0.3.0",
        deployedOn: "cloudflare-workers",
        db: "d1:openclaw_pos",
      });
    }

    const writePaths = new Set([
      "/v1/org-units",
      "/v1/employees",
      "/v1/channels",
      "/v1/channel-accounts",
      "/v1/orders",
      "/v1/shipments",
      "/v1/connectors/shopify/order-webhook",
      "/v1/connectors/amazon/order-webhook",
    ]);

    if (method !== "GET" && writePaths.has(path) && !requireApiKey(request, env)) {
      return unauthorized();
    }

    if (path === "/v1/org-units" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(
          `SELECT id, parent_id, unit_type, code, name, country_code, currency_code, is_active, created_at, updated_at
           FROM org_units ORDER BY created_at DESC LIMIT 200`
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
           FROM employees ORDER BY created_at DESC LIMIT 200`
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

    if (path === "/v1/channels" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM sales_channels ORDER BY created_at DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/channels" && method === "POST") {
      const body = (await request.json().catch(() => null)) as
        | { id?: string; code?: string; name?: string; channel_type?: string; country_code?: string | null; is_active?: number }
        | null;
      if (!body?.id || !body.code || !body.name || !body.channel_type) {
        return badRequest("Required fields: id, code, name, channel_type");
      }
      try {
        await env.openclaw_pos
          .prepare(
            `INSERT INTO sales_channels (id, code, name, channel_type, country_code, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(body.id, body.code, body.name, body.channel_type, body.country_code ?? null, body.is_active ?? 1, nowIso(), nowIso())
          .run();
        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/channel-accounts" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM channel_accounts ORDER BY created_at DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/channel-accounts" && method === "POST") {
      const body = (await request.json().catch(() => null)) as
        | { id?: string; channel_id?: string; account_name?: string; external_account_id?: string | null; region_code?: string | null; credentials_ref?: string | null }
        | null;
      if (!body?.id || !body.channel_id || !body.account_name) {
        return badRequest("Required fields: id, channel_id, account_name");
      }
      try {
        await env.openclaw_pos
          .prepare(
            `INSERT INTO channel_accounts (id, channel_id, account_name, external_account_id, region_code, credentials_ref, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
          )
          .bind(body.id, body.channel_id, body.account_name, body.external_account_id ?? null, body.region_code ?? null, body.credentials_ref ?? null, nowIso(), nowIso())
          .run();
        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/orders" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/orders" && method === "POST") {
      const body = (await request.json().catch(() => null)) as
        | {
            id?: string; order_code?: string; source_channel_id?: string | null; source_account_id?: string | null;
            source_order_id?: string | null; customer_ref?: string | null; currency_code?: string; country_code?: string | null;
            order_status?: string; subtotal_amount?: number; tax_amount?: number; shipping_amount?: number; discount_amount?: number; total_amount?: number;
          }
        | null;
      if (!body?.id || !body.order_code || !body.currency_code || !body.order_status) {
        return badRequest("Required fields: id, order_code, currency_code, order_status");
      }
      try {
        await env.openclaw_pos
          .prepare(
            `INSERT INTO orders (id, order_code, source_channel_id, source_account_id, source_order_id, customer_ref, currency_code, country_code, order_status,
             subtotal_amount, tax_amount, shipping_amount, discount_amount, total_amount, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            body.id, body.order_code, body.source_channel_id ?? null, body.source_account_id ?? null, body.source_order_id ?? null,
            body.customer_ref ?? null, body.currency_code, body.country_code ?? null, body.order_status,
            body.subtotal_amount ?? 0, body.tax_amount ?? 0, body.shipping_amount ?? 0, body.discount_amount ?? 0, body.total_amount ?? 0,
            nowIso(), nowIso()
          )
          .run();
        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/shipments" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM dispatch_shipments ORDER BY created_at DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/shipments" && method === "POST") {
      const body = (await request.json().catch(() => null)) as
        | { id?: string; order_id?: string; source_org_unit_id?: string | null; courier_name?: string | null; tracking_number?: string | null; shipment_status?: string }
        | null;
      if (!body?.id || !body.order_id || !body.shipment_status) {
        return badRequest("Required fields: id, order_id, shipment_status");
      }
      try {
        await env.openclaw_pos
          .prepare(
            `INSERT INTO dispatch_shipments (id, order_id, source_org_unit_id, courier_name, tracking_number, shipment_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(body.id, body.order_id, body.source_org_unit_id ?? null, body.courier_name ?? null, body.tracking_number ?? null, body.shipment_status, nowIso(), nowIso())
          .run();
        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    // Shopify/Amazon webhook ingest (minimal canonical order creation)
    if ((path === "/v1/connectors/shopify/order-webhook" || path === "/v1/connectors/amazon/order-webhook") && method === "POST") {
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (!body) return badRequest("Invalid JSON body");

      const connector = path.includes("shopify") ? "shopify" : "amazon";
      const orderId = String(body.id ?? body.order_id ?? crypto.randomUUID());
      const orderCode = `${connector.toUpperCase()}-${orderId}`;

      try {
        await env.openclaw_pos
          .prepare(
            `INSERT OR IGNORE INTO orders (id, order_code, source_order_id, currency_code, order_status, total_amount, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            `${connector}-${orderId}`,
            orderCode,
            orderId,
            String(body.currency ?? "USD"),
            String(body.financial_status ?? body.order_status ?? "received"),
            Number(body.total_price ?? body.total_amount ?? 0),
            nowIso(),
            nowIso()
          )
          .run();

        return json({ ok: true, connector, ingested_order: orderCode, mode: "minimal-v1" }, 202);
      } catch (e) {
        return json({ ok: false, error: "Webhook ingest failed", detail: String(e) }, 400);
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
