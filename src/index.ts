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

const readJson = async <T>(request: Request) => (await request.json().catch(() => null)) as T | null;

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
      const row = await env.openclaw_pos.prepare("SELECT datetime('now') as now_utc").first<{ now_utc: string }>();
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
          "GET /v1/modules",
          "GET/POST /v1/org-units",
          "GET/POST /v1/employees",
          "GET/POST /v1/channels",
          "GET/POST /v1/channel-accounts",
          "GET/POST /v1/orders",
          "GET/POST /v1/shipments",
          "GET/POST /v1/customers",
          "GET/POST /v1/inventory-items",
          "GET/POST /v1/prices",
          "GET/POST /v1/tax-rules",
          "GET/POST /v1/payment-methods",
          "GET/POST /v1/sync-outbox",
          "GET/POST /v1/sync-conflicts",
          "GET/POST /v1/app-config",
          "GET/POST /v1/sales-receipts",
          "GET/POST /v1/inventory-movements",
          "GET/POST /v1/branch-reconciliations",
          "POST /v1/seed/demo-branch",
          "POST /v1/connectors/shopify/order-webhook",
          "POST /v1/connectors/amazon/order-webhook"
        ]
      });
    }

    if (path === "/v1/health") {
      return json({ ok: true, api: "v1", service: "openclaw-pos-api", env: env.APP_ENV });
    }

    if (path === "/v1/db-check") {
      const row = await env.openclaw_pos.prepare("SELECT datetime('now') as now_utc").first<{ now_utc: string }>();
      return json({ ok: true, api: "v1", db_time: row?.now_utc ?? null });
    }

    if (path === "/v1/meta") {
      return json({
        ok: true,
        api: "v1",
        version: "0.4.0",
        deployedOn: "cloudflare-workers",
        db: "d1:openclaw_pos",
      });
    }

    if (path === "/v1/modules") {
      return json({
        ok: true,
        modules: {
          core: ["org-units", "employees", "orders", "shipments"],
          commerce: ["channels", "channel-accounts", "shopify-webhook", "amazon-webhook"],
          newToday: ["customers", "inventory", "pricing", "tax", "payments", "offline-sync"],
          financeOps: ["sales-posting", "inventory-movements", "branch-reconciliation"]
        }
      });
    }

    const writePaths = new Set([
      "/v1/org-units",
      "/v1/employees",
      "/v1/channels",
      "/v1/channel-accounts",
      "/v1/orders",
      "/v1/shipments",
      "/v1/customers",
      "/v1/inventory-items",
      "/v1/prices",
      "/v1/tax-rules",
      "/v1/payment-methods",
      "/v1/sync-outbox",
      "/v1/sync-conflicts",
      "/v1/app-config",
      "/v1/sales-receipts",
      "/v1/inventory-movements",
      "/v1/branch-reconciliations",
      "/v1/seed/demo-branch",
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
      const body = await readJson<{
        id?: string;
        parent_id?: string | null;
        unit_type?: string;
        code?: string;
        name?: string;
        country_code?: string | null;
        currency_code?: string | null;
        is_active?: number;
      }>(request);

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
      const body = await readJson<{
        id?: string;
        employee_code?: string;
        full_name?: string;
        employment_type?: string;
        country_code?: string;
        legal_entity_id?: string | null;
        branch_id?: string | null;
        is_active?: number;
      }>(request);

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
      const { results } = await env.openclaw_pos.prepare(`SELECT * FROM sales_channels ORDER BY created_at DESC LIMIT 200`).all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/channels" && method === "POST") {
      const body = await readJson<{ id?: string; code?: string; name?: string; channel_type?: string; country_code?: string | null; is_active?: number }>(request);
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
      const { results } = await env.openclaw_pos.prepare(`SELECT * FROM channel_accounts ORDER BY created_at DESC LIMIT 200`).all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/channel-accounts" && method === "POST") {
      const body = await readJson<{ id?: string; channel_id?: string; account_name?: string; external_account_id?: string | null; region_code?: string | null; credentials_ref?: string | null }>(request);
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
      const { results } = await env.openclaw_pos.prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 200`).all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/orders" && method === "POST") {
      const body = await readJson<{
        id?: string; order_code?: string; source_channel_id?: string | null; source_account_id?: string | null;
        source_order_id?: string | null; customer_ref?: string | null; currency_code?: string; country_code?: string | null;
        order_status?: string; subtotal_amount?: number; tax_amount?: number; shipping_amount?: number; discount_amount?: number; total_amount?: number;
      }>(request);
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
      const { results } = await env.openclaw_pos.prepare(`SELECT * FROM dispatch_shipments ORDER BY created_at DESC LIMIT 200`).all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/shipments" && method === "POST") {
      const body = await readJson<{ id?: string; order_id?: string; source_org_unit_id?: string | null; courier_name?: string | null; tracking_number?: string | null; shipment_status?: string }>(request);
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

    if (path === "/v1/customers" && method === "GET") {
      const { results } = await env.openclaw_pos.prepare(`SELECT * FROM customers ORDER BY created_at DESC LIMIT 200`).all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/customers" && method === "POST") {
      const body = await readJson<{ id?: string; customer_code?: string; full_name?: string; phone?: string | null; email?: string | null; loyalty_tier?: string | null; is_active?: number }>(request);
      if (!body?.id || !body.customer_code || !body.full_name) return badRequest("Required fields: id, customer_code, full_name");
      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO customers (id, customer_code, full_name, phone, email, loyalty_tier, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(body.id, body.customer_code, body.full_name, body.phone ?? null, body.email ?? null, body.loyalty_tier ?? null, body.is_active ?? 1, nowIso(), nowIso())
          .run();
        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/inventory-items" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM inventory_items ORDER BY updated_at DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/inventory-items" && method === "POST") {
      const body = await readJson<{ id?: string; sku_code?: string; item_name?: string; uom?: string; branch_id?: string | null; quantity_on_hand?: number; reorder_level?: number; is_active?: number }>(request);
      if (!body?.id || !body.sku_code || !body.item_name || !body.uom) return badRequest("Required fields: id, sku_code, item_name, uom");
      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO inventory_items (id, sku_code, item_name, uom, branch_id, quantity_on_hand, reorder_level, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(body.id, body.sku_code, body.item_name, body.uom, body.branch_id ?? null, body.quantity_on_hand ?? 0, body.reorder_level ?? 0, body.is_active ?? 1, nowIso(), nowIso())
          .run();
        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/prices" && method === "GET") {
      const { results } = await env.openclaw_pos.prepare(`SELECT * FROM pricing_rules ORDER BY created_at DESC LIMIT 200`).all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/prices" && method === "POST") {
      const body = await readJson<{ id?: string; sku_code?: string; country_code?: string | null; currency_code?: string; price_list?: string; base_price?: number; valid_from?: string | null; valid_to?: string | null; is_active?: number }>(request);
      if (!body?.id || !body.sku_code || !body.currency_code || !body.price_list) return badRequest("Required fields: id, sku_code, currency_code, price_list");
      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO pricing_rules (id, sku_code, country_code, currency_code, price_list, base_price, valid_from, valid_to, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(body.id, body.sku_code, body.country_code ?? null, body.currency_code, body.price_list, body.base_price ?? 0, body.valid_from ?? null, body.valid_to ?? null, body.is_active ?? 1, nowIso(), nowIso())
          .run();
        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/tax-rules" && method === "GET") {
      const { results } = await env.openclaw_pos.prepare(`SELECT * FROM tax_rules ORDER BY created_at DESC LIMIT 200`).all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/tax-rules" && method === "POST") {
      const body = await readJson<{ id?: string; rule_code?: string; country_code?: string; tax_name?: string; tax_rate?: number; tax_mode?: string; is_active?: number }>(request);
      if (!body?.id || !body.rule_code || !body.country_code || !body.tax_name || body.tax_rate === undefined || !body.tax_mode) {
        return badRequest("Required fields: id, rule_code, country_code, tax_name, tax_rate, tax_mode");
      }
      if (!["inclusive", "exclusive"].includes(body.tax_mode)) {
        return badRequest("tax_mode must be inclusive or exclusive");
      }
      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO tax_rules (id, rule_code, country_code, tax_name, tax_rate, tax_mode, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(body.id, body.rule_code, body.country_code, body.tax_name, body.tax_rate, body.tax_mode, body.is_active ?? 1, nowIso(), nowIso())
          .run();
        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/payment-methods" && method === "GET") {
      const { results } = await env.openclaw_pos.prepare(`SELECT * FROM payment_methods ORDER BY created_at DESC LIMIT 200`).all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/payment-methods" && method === "POST") {
      const body = await readJson<{ id?: string; method_code?: string; display_name?: string; settlement_mode?: string; is_active?: number }>(request);
      if (!body?.id || !body.method_code || !body.display_name || !body.settlement_mode) {
        return badRequest("Required fields: id, method_code, display_name, settlement_mode");
      }
      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO payment_methods (id, method_code, display_name, settlement_mode, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .bind(body.id, body.method_code, body.display_name, body.settlement_mode, body.is_active ?? 1, nowIso(), nowIso())
          .run();
        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/sync-outbox" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM sync_outbox ORDER BY created_at ASC LIMIT 500`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/sync-outbox" && method === "POST") {
      const body = await readJson<{ id?: string; source_node?: string; entity_type?: string; entity_id?: string; operation_type?: string; payload_json?: string; idempotency_key?: string; status?: string }>(request);
      if (!body?.id || !body.source_node || !body.entity_type || !body.entity_id || !body.operation_type || !body.payload_json || !body.idempotency_key) {
        return badRequest("Required fields: id, source_node, entity_type, entity_id, operation_type, payload_json, idempotency_key");
      }
      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO sync_outbox (id, source_node, entity_type, entity_id, operation_type, payload_json, idempotency_key, status, retry_count, next_retry_at, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)`)
          .bind(body.id, body.source_node, body.entity_type, body.entity_id, body.operation_type, body.payload_json, body.idempotency_key, body.status ?? "queued", nowIso(), nowIso())
          .run();
        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/sync-conflicts" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM sync_conflicts ORDER BY created_at DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/sync-conflicts" && method === "POST") {
      const body = await readJson<{ id?: string; outbox_id?: string | null; entity_type?: string; entity_id?: string; conflict_reason?: string; local_payload_json?: string; remote_payload_json?: string; resolution_strategy?: string }>(request);
      if (!body?.id || !body.entity_type || !body.entity_id || !body.conflict_reason || !body.local_payload_json || !body.remote_payload_json || !body.resolution_strategy) {
        return badRequest("Required fields: id, entity_type, entity_id, conflict_reason, local_payload_json, remote_payload_json, resolution_strategy");
      }
      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO sync_conflicts (id, outbox_id, entity_type, entity_id, conflict_reason, local_payload_json, remote_payload_json, resolution_strategy, resolved_at, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`)
          .bind(body.id, body.outbox_id ?? null, body.entity_type, body.entity_id, body.conflict_reason, body.local_payload_json, body.remote_payload_json, body.resolution_strategy, nowIso())
          .run();
        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/app-config" && method === "GET") {
      const { results } = await env.openclaw_pos.prepare(`SELECT * FROM app_config ORDER BY key_name ASC LIMIT 500`).all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/app-config" && method === "POST") {
      const body = await readJson<{ key_name?: string; value_json?: string; scope?: string }>(request);
      if (!body?.key_name || !body.value_json) return badRequest("Required fields: key_name, value_json");

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO app_config (key_name, value_json, scope, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(key_name) DO UPDATE SET value_json=excluded.value_json, scope=excluded.scope, updated_at=excluded.updated_at`)
          .bind(body.key_name, body.value_json, body.scope ?? "global", nowIso(), nowIso())
          .run();
        return json({ ok: true, key_name: body.key_name }, 201);
      } catch (e) {
        return json({ ok: false, error: "Upsert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/sales-receipts" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM sales_receipts ORDER BY created_at DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/sales-receipts" && method === "POST") {
      const body = await readJson<{
        id?: string; receipt_no?: string; branch_id?: string; till_id?: string | null; cashier_employee_id?: string | null;
        customer_id?: string | null; currency_code?: string; subtotal_amount?: number; tax_amount?: number;
        discount_amount?: number; total_amount?: number; payment_status?: string; business_date?: string;
      }>(request);

      if (!body?.id || !body.receipt_no || !body.branch_id || !body.currency_code || !body.business_date) {
        return badRequest("Required fields: id, receipt_no, branch_id, currency_code, business_date");
      }

      try {
        await env.openclaw_pos.batch([
          env.openclaw_pos
            .prepare(`INSERT INTO sales_receipts (id, receipt_no, branch_id, till_id, cashier_employee_id, customer_id, currency_code, subtotal_amount, tax_amount, discount_amount, total_amount, payment_status, posted_to_ledger, posted_at, business_date, created_at, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`)
            .bind(
              body.id,
              body.receipt_no,
              body.branch_id,
              body.till_id ?? null,
              body.cashier_employee_id ?? null,
              body.customer_id ?? null,
              body.currency_code,
              body.subtotal_amount ?? 0,
              body.tax_amount ?? 0,
              body.discount_amount ?? 0,
              body.total_amount ?? 0,
              body.payment_status ?? "captured",
              nowIso(),
              body.business_date,
              nowIso(),
              nowIso()
            ),
          env.openclaw_pos
            .prepare(`INSERT INTO sync_outbox (id, source_node, entity_type, entity_id, operation_type, payload_json, idempotency_key, status, retry_count, next_retry_at, created_at, updated_at)
                      VALUES (?, 'api-main', 'sales_receipts', ?, 'create', ?, ?, 'queued', 0, NULL, ?, ?)`)
            .bind(
              crypto.randomUUID(),
              body.id,
              JSON.stringify(body),
              `sales-receipt-${body.id}`,
              nowIso(),
              nowIso()
            )
        ]);

        return json({ ok: true, id: body.id, posted_to_ledger: true, queued_for_sync: true }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/inventory-movements" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM inventory_movements ORDER BY created_at DESC LIMIT 300`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/inventory-movements" && method === "POST") {
      const body = await readJson<{
        id?: string; movement_code?: string; sku_code?: string; branch_id?: string; movement_type?: string;
        quantity_delta?: number; unit_cost?: number | null; reference_type?: string | null; reference_id?: string | null;
        business_date?: string;
      }>(request);

      if (!body?.id || !body.movement_code || !body.sku_code || !body.branch_id || !body.movement_type || body.quantity_delta === undefined || !body.business_date) {
        return badRequest("Required fields: id, movement_code, sku_code, branch_id, movement_type, quantity_delta, business_date");
      }

      try {
        await env.openclaw_pos.batch([
          env.openclaw_pos
            .prepare(`INSERT INTO inventory_movements (id, movement_code, sku_code, branch_id, movement_type, quantity_delta, unit_cost, reference_type, reference_id, business_date, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(
              body.id,
              body.movement_code,
              body.sku_code,
              body.branch_id,
              body.movement_type,
              body.quantity_delta,
              body.unit_cost ?? null,
              body.reference_type ?? null,
              body.reference_id ?? null,
              body.business_date,
              nowIso()
            ),
          env.openclaw_pos
            .prepare(`UPDATE inventory_items SET quantity_on_hand = quantity_on_hand + ?, updated_at = ? WHERE sku_code = ? AND branch_id = ?`)
            .bind(body.quantity_delta, nowIso(), body.sku_code, body.branch_id),
        ]);

        return json({ ok: true, id: body.id, stock_adjusted: true }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/branch-reconciliations" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM branch_reconciliations ORDER BY business_date DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/branch-reconciliations" && method === "POST") {
      const body = await readJson<{
        id?: string; branch_id?: string; business_date?: string; expected_sales_amount?: number; counted_cash_amount?: number; notes?: string | null;
      }>(request);

      if (!body?.id || !body.branch_id || !body.business_date || body.expected_sales_amount === undefined || body.counted_cash_amount === undefined) {
        return badRequest("Required fields: id, branch_id, business_date, expected_sales_amount, counted_cash_amount");
      }

      const variance = Number(body.counted_cash_amount) - Number(body.expected_sales_amount);
      const status = variance === 0 ? "matched" : "investigate";

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO branch_reconciliations (id, branch_id, business_date, expected_sales_amount, counted_cash_amount, variance_amount, status, notes, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(body.id, body.branch_id, body.business_date, body.expected_sales_amount, body.counted_cash_amount, variance, status, body.notes ?? null, nowIso(), nowIso())
          .run();

        return json({ ok: true, id: body.id, variance_amount: variance, status }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/seed/demo-branch" && method === "POST") {
      const rootId = "demo-ho-pk";
      const branchId = "demo-branch-khi-01";
      const tillId = "demo-till-khi-01";
      const employeeId = "demo-emp-khi-01";
      const customerId = "demo-cus-cash-01";
      const itemId = "demo-item-chai-01";
      const priceId = "demo-price-chai-pkr";

      try {
        await env.openclaw_pos.batch([
          env.openclaw_pos.prepare(`INSERT OR IGNORE INTO org_units (id, parent_id, unit_type, code, name, country_code, currency_code, is_active, created_at, updated_at) VALUES (?, NULL, 'country', 'PK-HO', 'Pakistan HO', 'PK', 'PKR', 1, ?, ?)`)
            .bind(rootId, nowIso(), nowIso()),
          env.openclaw_pos.prepare(`INSERT OR IGNORE INTO org_units (id, parent_id, unit_type, code, name, country_code, currency_code, is_active, created_at, updated_at) VALUES (?, ?, 'branch', 'KHI-01', 'Karachi Branch 01', 'PK', 'PKR', 1, ?, ?)`)
            .bind(branchId, rootId, nowIso(), nowIso()),
          env.openclaw_pos.prepare(`INSERT OR IGNORE INTO org_units (id, parent_id, unit_type, code, name, country_code, currency_code, is_active, created_at, updated_at) VALUES (?, ?, 'till', 'KHI-01-T1', 'Karachi Till 1', 'PK', 'PKR', 1, ?, ?)`)
            .bind(tillId, branchId, nowIso(), nowIso()),
          env.openclaw_pos.prepare(`INSERT OR IGNORE INTO employees (id, employee_code, full_name, employment_type, country_code, legal_entity_id, branch_id, is_active, created_at, updated_at) VALUES (?, 'EMP-KHI-001', 'Demo Cashier', 'permanent', 'PK', NULL, ?, 1, ?, ?)`)
            .bind(employeeId, branchId, nowIso(), nowIso()),
          env.openclaw_pos.prepare(`INSERT OR IGNORE INTO customers (id, customer_code, full_name, phone, email, loyalty_tier, is_active, created_at, updated_at) VALUES (?, 'CASH-001', 'Walk-in Customer', NULL, NULL, 'standard', 1, ?, ?)`)
            .bind(customerId, nowIso(), nowIso()),
          env.openclaw_pos.prepare(`INSERT OR IGNORE INTO inventory_items (id, sku_code, item_name, uom, branch_id, quantity_on_hand, reorder_level, is_active, created_at, updated_at) VALUES (?, 'TEA-CHAI-001', 'Tea / Chai Cup', 'ea', ?, 250, 40, 1, ?, ?)`)
            .bind(itemId, branchId, nowIso(), nowIso()),
          env.openclaw_pos.prepare(`INSERT OR IGNORE INTO pricing_rules (id, sku_code, country_code, currency_code, price_list, base_price, valid_from, valid_to, is_active, created_at, updated_at) VALUES (?, 'TEA-CHAI-001', 'PK', 'PKR', 'retail-default', 120, NULL, NULL, 1, ?, ?)`)
            .bind(priceId, nowIso(), nowIso()),
          env.openclaw_pos.prepare(`INSERT OR IGNORE INTO payment_methods (id, method_code, display_name, settlement_mode, is_active, created_at, updated_at) VALUES ('demo-pay-cash', 'cash', 'Cash', 'instant', 1, ?, ?)`)
            .bind(nowIso(), nowIso()),
          env.openclaw_pos.prepare(`INSERT OR IGNORE INTO tax_rules (id, rule_code, country_code, tax_name, tax_rate, tax_mode, is_active, created_at, updated_at) VALUES ('demo-tax-pk-sales', 'PK-SALES-DEFAULT', 'PK', 'Sales Tax', 0.18, 'inclusive', 1, ?, ?)`)
            .bind(nowIso(), nowIso()),
          env.openclaw_pos.prepare(`INSERT INTO app_config (key_name, value_json, scope, created_at, updated_at) VALUES ('tax.default_mode', '"inclusive"', 'country:PK', ?, ?) ON CONFLICT(key_name) DO UPDATE SET value_json='"inclusive"', scope='country:PK', updated_at=excluded.updated_at`)
            .bind(nowIso(), nowIso()),
          env.openclaw_pos.prepare(`INSERT INTO app_config (key_name, value_json, scope, created_at, updated_at) VALUES ('currency.operational', '"PKR"', 'country:PK', ?, ?) ON CONFLICT(key_name) DO UPDATE SET value_json='"PKR"', scope='country:PK', updated_at=excluded.updated_at`)
            .bind(nowIso(), nowIso()),
          env.openclaw_pos.prepare(`INSERT INTO app_config (key_name, value_json, scope, created_at, updated_at) VALUES ('currency.reporting', '"USD"', 'global', ?, ?) ON CONFLICT(key_name) DO UPDATE SET value_json='"USD"', scope='global', updated_at=excluded.updated_at`)
            .bind(nowIso(), nowIso()),
        ]);

        return json({ ok: true, seeded: true, branch: "KHI-01", tills: 1, currency: "PKR", tax_mode: "inclusive" }, 201);
      } catch (e) {
        return json({ ok: false, error: "Seed failed", detail: String(e) }, 400);
      }
    }

    // Shopify/Amazon webhook ingest (minimal canonical order creation)
    if ((path === "/v1/connectors/shopify/order-webhook" || path === "/v1/connectors/amazon/order-webhook") && method === "POST") {
      const body = await readJson<Record<string, unknown>>(request);
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
