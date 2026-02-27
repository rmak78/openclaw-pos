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
          "GET/POST /v1/sales-receipt-lines",
          "GET/POST /v1/sales-receipt-payments",
          "GET/POST /v1/sales-returns",
          "GET/POST /v1/sales-return-lines",
          "GET/POST /v1/sales-refunds",
          "GET /v1/day-close-summary",
          "GET/POST /v1/till-sessions",
          "POST /v1/till-sessions/close",
          "GET/POST /v1/cash-drops",
          "GET/POST /v1/variance-reasons",
          "GET/POST /v1/inventory-movements",
          "GET/POST /v1/branch-reconciliations",
          "GET/POST /v1/suppliers",
          "GET/POST /v1/purchase-orders",
          "GET/POST /v1/goods-receipts",
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
        version: "0.5.0",
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
          financeOps: ["sales-posting", "inventory-movements", "branch-reconciliation", "payment-split", "day-close-summary", "till-session", "cash-drop", "variance-reason-codes", "sales-returns", "refunds"],
          procurement: ["suppliers", "purchase-orders", "goods-receipts", "grn"]
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
      "/v1/sales-receipt-lines",
      "/v1/sales-receipt-payments",
      "/v1/sales-returns",
      "/v1/sales-return-lines",
      "/v1/sales-refunds",
      "/v1/till-sessions",
      "/v1/till-sessions/close",
      "/v1/cash-drops",
      "/v1/variance-reasons",
      "/v1/inventory-movements",
      "/v1/branch-reconciliations",
      "/v1/suppliers",
      "/v1/purchase-orders",
      "/v1/goods-receipts",
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

    if (path === "/v1/sales-receipt-lines" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM sales_receipt_lines ORDER BY created_at DESC LIMIT 500`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/sales-receipt-lines" && method === "POST") {
      const body = await readJson<{
        id?: string; sales_receipt_id?: string; sku_code?: string; item_name?: string | null;
        quantity?: number; unit_price?: number; tax_amount?: number; discount_amount?: number; line_total?: number;
      }>(request);

      if (!body?.id || !body.sales_receipt_id || !body.sku_code || body.quantity === undefined || body.unit_price === undefined || body.line_total === undefined) {
        return badRequest("Required fields: id, sales_receipt_id, sku_code, quantity, unit_price, line_total");
      }

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO sales_receipt_lines (id, sales_receipt_id, sku_code, item_name, quantity, unit_price, tax_amount, discount_amount, line_total, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            body.id,
            body.sales_receipt_id,
            body.sku_code,
            body.item_name ?? null,
            body.quantity,
            body.unit_price,
            body.tax_amount ?? 0,
            body.discount_amount ?? 0,
            body.line_total,
            nowIso()
          )
          .run();
        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/sales-receipt-payments" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM sales_receipt_payments ORDER BY created_at DESC LIMIT 500`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/sales-receipt-payments" && method === "POST") {
      const body = await readJson<{
        id?: string; sales_receipt_id?: string; payment_method_id?: string; amount?: number; reference_no?: string | null; settlement_status?: string;
      }>(request);

      if (!body?.id || !body.sales_receipt_id || !body.payment_method_id || body.amount === undefined) {
        return badRequest("Required fields: id, sales_receipt_id, payment_method_id, amount");
      }

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO sales_receipt_payments (id, sales_receipt_id, payment_method_id, amount, reference_no, settlement_status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .bind(body.id, body.sales_receipt_id, body.payment_method_id, body.amount, body.reference_no ?? null, body.settlement_status ?? "captured", nowIso())
          .run();
        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/sales-returns" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM sales_returns ORDER BY created_at DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/sales-returns" && method === "POST") {
      const body = await readJson<{
        id?: string; return_no?: string; original_sales_receipt_id?: string | null; branch_id?: string; till_session_id?: string | null;
        cashier_employee_id?: string | null; customer_id?: string | null; return_reason?: string | null; return_status?: string;
        currency_code?: string; subtotal_amount?: number; tax_amount?: number; discount_amount?: number; total_amount?: number; business_date?: string;
      }>(request);

      if (!body?.id || !body.return_no || !body.branch_id || !body.currency_code || !body.business_date) {
        return badRequest("Required fields: id, return_no, branch_id, currency_code, business_date");
      }

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO sales_returns (id, return_no, original_sales_receipt_id, branch_id, till_session_id, cashier_employee_id, customer_id, return_reason, return_status, currency_code, subtotal_amount, tax_amount, discount_amount, total_amount, business_date, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            body.id,
            body.return_no,
            body.original_sales_receipt_id ?? null,
            body.branch_id,
            body.till_session_id ?? null,
            body.cashier_employee_id ?? null,
            body.customer_id ?? null,
            body.return_reason ?? null,
            body.return_status ?? "initiated",
            body.currency_code,
            body.subtotal_amount ?? 0,
            body.tax_amount ?? 0,
            body.discount_amount ?? 0,
            body.total_amount ?? 0,
            body.business_date,
            nowIso(),
            nowIso()
          )
          .run();

        return json({ ok: true, id: body.id, status: body.return_status ?? "initiated" }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/sales-return-lines" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM sales_return_lines ORDER BY created_at DESC LIMIT 500`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/sales-return-lines" && method === "POST") {
      const body = await readJson<{
        id?: string; sales_return_id?: string; original_sales_receipt_line_id?: string | null; sku_code?: string; item_name?: string | null;
        quantity?: number; unit_price?: number; tax_amount?: number; discount_amount?: number; line_total?: number; restock_to_inventory?: number;
      }>(request);

      if (!body?.id || !body.sales_return_id || !body.sku_code || body.quantity === undefined || body.unit_price === undefined || body.line_total === undefined) {
        return badRequest("Required fields: id, sales_return_id, sku_code, quantity, unit_price, line_total");
      }

      const ret = await env.openclaw_pos
        .prepare(`SELECT branch_id, business_date FROM sales_returns WHERE id = ? LIMIT 1`)
        .bind(body.sales_return_id)
        .first<{ branch_id: string; business_date: string }>();

      if (!ret?.branch_id || !ret?.business_date) {
        return badRequest("sales_return_id not found");
      }

      const shouldRestock = (body.restock_to_inventory ?? 1) === 1;
      const restockQty = Math.abs(Number(body.quantity));

      try {
        const statements = [
          env.openclaw_pos
            .prepare(`INSERT INTO sales_return_lines (id, sales_return_id, original_sales_receipt_line_id, sku_code, item_name, quantity, unit_price, tax_amount, discount_amount, line_total, restock_to_inventory, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(
              body.id,
              body.sales_return_id,
              body.original_sales_receipt_line_id ?? null,
              body.sku_code,
              body.item_name ?? null,
              restockQty,
              body.unit_price,
              body.tax_amount ?? 0,
              body.discount_amount ?? 0,
              body.line_total,
              shouldRestock ? 1 : 0,
              nowIso()
            ),
        ];

        if (shouldRestock) {
          statements.push(
            env.openclaw_pos
              .prepare(`INSERT INTO inventory_movements (id, movement_code, sku_code, branch_id, movement_type, quantity_delta, unit_cost, reference_type, reference_id, business_date, created_at)
                        VALUES (?, ?, ?, ?, 'sale_return', ?, NULL, 'sales_return', ?, ?, ?)`)
              .bind(
                crypto.randomUUID(),
                `RET-${Date.now()}`,
                body.sku_code,
                ret.branch_id,
                restockQty,
                body.sales_return_id,
                ret.business_date,
                nowIso()
              )
          );
          statements.push(
            env.openclaw_pos
              .prepare(`UPDATE inventory_items SET quantity_on_hand = quantity_on_hand + ?, updated_at = ? WHERE sku_code = ? AND branch_id = ?`)
              .bind(restockQty, nowIso(), body.sku_code, ret.branch_id)
          );
        }

        await env.openclaw_pos.batch(statements);

        return json({ ok: true, id: body.id, inventory_reversed: shouldRestock, quantity_restocked: shouldRestock ? restockQty : 0 }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/sales-refunds" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM sales_refunds ORDER BY refunded_at DESC LIMIT 500`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/sales-refunds" && method === "POST") {
      const body = await readJson<{
        id?: string; sales_return_id?: string; payment_method_id?: string; amount?: number; reference_no?: string | null; refund_status?: string;
      }>(request);

      if (!body?.id || !body.sales_return_id || !body.payment_method_id || body.amount === undefined) {
        return badRequest("Required fields: id, sales_return_id, payment_method_id, amount");
      }

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO sales_refunds (id, sales_return_id, payment_method_id, amount, reference_no, refund_status, refunded_at, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            body.id,
            body.sales_return_id,
            body.payment_method_id,
            body.amount,
            body.reference_no ?? null,
            body.refund_status ?? "processed",
            nowIso(),
            nowIso()
          )
          .run();

        return json({ ok: true, id: body.id, status: body.refund_status ?? "processed" }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/day-close-summary" && method === "GET") {
      const branchId = url.searchParams.get("branch_id");
      const businessDate = url.searchParams.get("business_date");
      if (!branchId || !businessDate) {
        return badRequest("Query params required: branch_id, business_date");
      }

      const totals = await env.openclaw_pos
        .prepare(`SELECT
                    COUNT(*) as receipt_count,
                    COALESCE(SUM(total_amount), 0) as gross_sales,
                    COALESCE(SUM(tax_amount), 0) as total_tax,
                    COALESCE(SUM(discount_amount), 0) as total_discount
                  FROM sales_receipts
                  WHERE branch_id = ? AND business_date = ?`)
        .bind(branchId, businessDate)
        .first<{ receipt_count: number; gross_sales: number; total_tax: number; total_discount: number }>();

      const payments = await env.openclaw_pos
        .prepare(`SELECT pm.method_code, pm.display_name, COALESCE(SUM(rp.amount), 0) as amount
                  FROM sales_receipt_payments rp
                  JOIN payment_methods pm ON pm.id = rp.payment_method_id
                  JOIN sales_receipts sr ON sr.id = rp.sales_receipt_id
                  WHERE sr.branch_id = ? AND sr.business_date = ?
                  GROUP BY pm.method_code, pm.display_name
                  ORDER BY amount DESC`)
        .bind(branchId, businessDate)
        .all();

      const reconciliation = await env.openclaw_pos
        .prepare(`SELECT id, expected_sales_amount, counted_cash_amount, variance_amount, status
                  FROM branch_reconciliations
                  WHERE branch_id = ? AND business_date = ?
                  LIMIT 1`)
        .bind(branchId, businessDate)
        .first();

      return json({
        ok: true,
        branch_id: branchId,
        business_date: businessDate,
        totals: totals ?? { receipt_count: 0, gross_sales: 0, total_tax: 0, total_discount: 0 },
        payments: payments.results ?? [],
        reconciliation: reconciliation ?? null,
      });
    }

    if (path === "/v1/till-sessions" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM till_sessions ORDER BY opened_at DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/till-sessions" && method === "POST") {
      const body = await readJson<{
        id?: string; till_id?: string; branch_id?: string; opened_by_employee_id?: string | null; opening_float_amount?: number; notes?: string | null;
      }>(request);

      if (!body?.id || !body.till_id || !body.branch_id) {
        return badRequest("Required fields: id, till_id, branch_id");
      }

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO till_sessions (id, till_id, branch_id, opened_by_employee_id, opening_float_amount, opened_at, status, notes, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`)
          .bind(body.id, body.till_id, body.branch_id, body.opened_by_employee_id ?? null, body.opening_float_amount ?? 0, nowIso(), body.notes ?? null, nowIso(), nowIso())
          .run();
        return json({ ok: true, id: body.id, status: "open" }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/till-sessions/close" && method === "POST") {
      const body = await readJson<{
        till_session_id?: string; expected_cash_amount?: number; counted_cash_amount?: number; notes?: string | null;
      }>(request);

      if (!body?.till_session_id || body.expected_cash_amount === undefined || body.counted_cash_amount === undefined) {
        return badRequest("Required fields: till_session_id, expected_cash_amount, counted_cash_amount");
      }

      const variance = Number(body.counted_cash_amount) - Number(body.expected_cash_amount);

      try {
        await env.openclaw_pos
          .prepare(`UPDATE till_sessions
                    SET expected_cash_amount = ?, counted_cash_amount = ?, variance_amount = ?, status = 'closed', closed_at = ?, notes = COALESCE(?, notes), updated_at = ?
                    WHERE id = ?`)
          .bind(body.expected_cash_amount, body.counted_cash_amount, variance, nowIso(), body.notes ?? null, nowIso(), body.till_session_id)
          .run();

        return json({ ok: true, till_session_id: body.till_session_id, status: "closed", variance_amount: variance }, 200);
      } catch (e) {
        return json({ ok: false, error: "Close failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/cash-drops" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM cash_drops ORDER BY dropped_at DESC LIMIT 300`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/cash-drops" && method === "POST") {
      const body = await readJson<{
        id?: string; till_session_id?: string; branch_id?: string; amount?: number; drop_reason?: string; reference_no?: string | null;
      }>(request);

      if (!body?.id || !body.till_session_id || !body.branch_id || body.amount === undefined || !body.drop_reason) {
        return badRequest("Required fields: id, till_session_id, branch_id, amount, drop_reason");
      }

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO cash_drops (id, till_session_id, branch_id, amount, drop_reason, reference_no, dropped_at, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(body.id, body.till_session_id, body.branch_id, body.amount, body.drop_reason, body.reference_no ?? null, nowIso(), nowIso())
          .run();

        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/variance-reasons" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM variance_reasons ORDER BY created_at DESC LIMIT 300`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/variance-reasons" && method === "POST") {
      const body = await readJson<{
        id?: string; till_session_id?: string | null; branch_reconciliation_id?: string | null; reason_code?: string; reason_note?: string | null; created_by_employee_id?: string | null;
      }>(request);

      if (!body?.id || !body.reason_code) {
        return badRequest("Required fields: id, reason_code");
      }

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO variance_reasons (id, till_session_id, branch_reconciliation_id, reason_code, reason_note, created_by_employee_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .bind(body.id, body.till_session_id ?? null, body.branch_reconciliation_id ?? null, body.reason_code, body.reason_note ?? null, body.created_by_employee_id ?? null, nowIso())
          .run();

        return json({ ok: true, id: body.id }, 201);
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

    if (path === "/v1/pay-cycles" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM pay_cycles ORDER BY cycle_start DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/pay-cycles" && method === "POST") {
      const body = await readJson<{
        id?: string; cycle_code?: string; country_code?: string; legal_entity_id?: string | null;
        cycle_type?: string; cycle_start?: string; cycle_end?: string; payday?: string; status?: string;
      }>(request);

      if (!body?.id || !body.cycle_code || !body.country_code || !body.cycle_type || !body.cycle_start || !body.cycle_end || !body.payday) {
        return badRequest("Required fields: id, cycle_code, country_code, cycle_type, cycle_start, cycle_end, payday");
      }

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO pay_cycles (id, cycle_code, country_code, legal_entity_id, cycle_type, cycle_start, cycle_end, payday, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            body.id,
            body.cycle_code,
            body.country_code,
            body.legal_entity_id ?? null,
            body.cycle_type,
            body.cycle_start,
            body.cycle_end,
            body.payday,
            body.status ?? "draft",
            nowIso(),
            nowIso()
          )
          .run();

        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/pay-components" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM pay_components ORDER BY created_at DESC LIMIT 300`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/pay-components" && method === "POST") {
      const body = await readJson<{
        id?: string; component_code?: string; component_name?: string; component_type?: string;
        calc_mode?: string; taxable_default?: number; pensionable_default?: number; is_active?: number;
      }>(request);

      if (!body?.id || !body.component_code || !body.component_name || !body.component_type || !body.calc_mode) {
        return badRequest("Required fields: id, component_code, component_name, component_type, calc_mode");
      }

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO pay_components (id, component_code, component_name, component_type, calc_mode, taxable_default, pensionable_default, is_active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            body.id,
            body.component_code,
            body.component_name,
            body.component_type,
            body.calc_mode,
            body.taxable_default ?? 1,
            body.pensionable_default ?? 0,
            body.is_active ?? 1,
            nowIso(),
            nowIso()
          )
          .run();

        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/payroll-runs" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM payroll_runs ORDER BY created_at DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/payroll-runs" && method === "POST") {
      const body = await readJson<{
        id?: string; pay_cycle_id?: string; branch_id?: string | null; run_code?: string;
        run_type?: string; status?: string; notes?: string | null;
      }>(request);

      if (!body?.id || !body.pay_cycle_id || !body.run_code || !body.run_type) {
        return badRequest("Required fields: id, pay_cycle_id, run_code, run_type");
      }

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO payroll_runs (id, pay_cycle_id, branch_id, run_code, run_type, status, notes, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            body.id,
            body.pay_cycle_id,
            body.branch_id ?? null,
            body.run_code,
            body.run_type,
            body.status ?? "draft",
            body.notes ?? null,
            nowIso(),
            nowIso()
          )
          .run();

        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/suppliers" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM suppliers ORDER BY created_at DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/suppliers" && method === "POST") {
      const body = await readJson<{
        id?: string; supplier_code?: string; supplier_name?: string; contact_name?: string | null; phone?: string | null;
        email?: string | null; country_code?: string | null; payment_terms_days?: number; status?: string;
      }>(request);

      if (!body?.id || !body.supplier_code || !body.supplier_name) {
        return badRequest("Required fields: id, supplier_code, supplier_name");
      }

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO suppliers (id, supplier_code, supplier_name, contact_name, phone, email, country_code, payment_terms_days, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            body.id,
            body.supplier_code,
            body.supplier_name,
            body.contact_name ?? null,
            body.phone ?? null,
            body.email ?? null,
            body.country_code ?? null,
            body.payment_terms_days ?? 0,
            body.status ?? "active",
            nowIso(),
            nowIso()
          )
          .run();

        return json({ ok: true, id: body.id }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/purchase-orders" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM purchase_orders ORDER BY order_date DESC, created_at DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/purchase-orders" && method === "POST") {
      const body = await readJson<{
        id?: string; po_number?: string; supplier_id?: string; branch_id?: string; order_date?: string;
        expected_date?: string | null; currency_code?: string; status?: string; notes?: string | null;
        created_by_employee_id?: string | null;
        lines?: Array<{ id?: string; sku_code?: string; item_name?: string | null; ordered_qty?: number; unit_cost?: number; tax_rate?: number }>;
      }>(request);

      if (!body?.id || !body.po_number || !body.supplier_id || !body.branch_id || !body.order_date || !body.currency_code) {
        return badRequest("Required fields: id, po_number, supplier_id, branch_id, order_date, currency_code");
      }

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO purchase_orders (id, po_number, supplier_id, branch_id, order_date, expected_date, currency_code, status, notes, created_by_employee_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            body.id,
            body.po_number,
            body.supplier_id,
            body.branch_id,
            body.order_date,
            body.expected_date ?? null,
            body.currency_code,
            body.status ?? "draft",
            body.notes ?? null,
            body.created_by_employee_id ?? null,
            nowIso(),
            nowIso()
          )
          .run();

        if (body.lines?.length) {
          for (const line of body.lines) {
            if (!line?.id || !line.sku_code || line.ordered_qty === undefined || line.unit_cost === undefined) {
              return badRequest("Each line requires: id, sku_code, ordered_qty, unit_cost");
            }

            const taxRate = line.tax_rate ?? 0;
            const lineTotal = Number(line.ordered_qty) * Number(line.unit_cost) * (1 + Number(taxRate));

            await env.openclaw_pos
              .prepare(`INSERT INTO purchase_order_lines (id, purchase_order_id, sku_code, item_name, ordered_qty, unit_cost, tax_rate, line_total, received_qty, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`)
              .bind(
                line.id,
                body.id,
                line.sku_code,
                line.item_name ?? null,
                line.ordered_qty,
                line.unit_cost,
                taxRate,
                lineTotal,
                nowIso(),
                nowIso()
              )
              .run();
          }
        }

        return json({ ok: true, id: body.id, lines_created: body.lines?.length ?? 0 }, 201);
      } catch (e) {
        return json({ ok: false, error: "Insert failed", detail: String(e) }, 400);
      }
    }

    if (path === "/v1/goods-receipts" && method === "GET") {
      const { results } = await env.openclaw_pos
        .prepare(`SELECT * FROM goods_receipts ORDER BY received_at DESC, created_at DESC LIMIT 200`)
        .all();
      return json({ ok: true, items: results ?? [] });
    }

    if (path === "/v1/goods-receipts" && method === "POST") {
      const body = await readJson<{
        id?: string; grn_number?: string; purchase_order_id?: string; supplier_id?: string; branch_id?: string;
        received_at?: string; status?: string; notes?: string | null; received_by_employee_id?: string | null;
        lines?: Array<{
          id?: string; purchase_order_line_id?: string | null; sku_code?: string; received_qty?: number; accepted_qty?: number;
          rejected_qty?: number; unit_cost?: number;
        }>;
      }>(request);

      if (!body?.id || !body.grn_number || !body.purchase_order_id || !body.supplier_id || !body.branch_id || !body.received_at) {
        return badRequest("Required fields: id, grn_number, purchase_order_id, supplier_id, branch_id, received_at");
      }

      try {
        await env.openclaw_pos
          .prepare(`INSERT INTO goods_receipts (id, grn_number, purchase_order_id, supplier_id, branch_id, received_at, status, notes, received_by_employee_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            body.id,
            body.grn_number,
            body.purchase_order_id,
            body.supplier_id,
            body.branch_id,
            body.received_at,
            body.status ?? "posted",
            body.notes ?? null,
            body.received_by_employee_id ?? null,
            nowIso(),
            nowIso()
          )
          .run();

        if (body.lines?.length) {
          for (const line of body.lines) {
            if (!line?.id || !line.sku_code || line.received_qty === undefined || line.accepted_qty === undefined || line.unit_cost === undefined) {
              return badRequest("Each line requires: id, sku_code, received_qty, accepted_qty, unit_cost");
            }

            const rejectedQty = line.rejected_qty ?? Math.max(0, Number(line.received_qty) - Number(line.accepted_qty));
            const lineTotal = Number(line.accepted_qty) * Number(line.unit_cost);

            await env.openclaw_pos.batch([
              env.openclaw_pos
                .prepare(`INSERT INTO goods_receipt_lines (id, goods_receipt_id, purchase_order_line_id, sku_code, received_qty, accepted_qty, rejected_qty, unit_cost, line_total, created_at, updated_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                .bind(
                  line.id,
                  body.id,
                  line.purchase_order_line_id ?? null,
                  line.sku_code,
                  line.received_qty,
                  line.accepted_qty,
                  rejectedQty,
                  line.unit_cost,
                  lineTotal,
                  nowIso(),
                  nowIso()
                ),
              env.openclaw_pos
                .prepare(`UPDATE inventory_items SET quantity_on_hand = quantity_on_hand + ?, updated_at = ? WHERE sku_code = ? AND branch_id = ?`)
                .bind(line.accepted_qty, nowIso(), line.sku_code, body.branch_id),
              env.openclaw_pos
                .prepare(`UPDATE purchase_order_lines SET received_qty = received_qty + ?, updated_at = ? WHERE id = ?`)
                .bind(line.accepted_qty, nowIso(), line.purchase_order_line_id ?? ""),
            ]);
          }
        }

        await env.openclaw_pos
          .prepare(`UPDATE purchase_orders
                    SET status = CASE
                      WHEN (SELECT COUNT(*) FROM purchase_order_lines WHERE purchase_order_id = ? AND received_qty < ordered_qty) = 0 THEN 'received'
                      WHEN (SELECT COUNT(*) FROM purchase_order_lines WHERE purchase_order_id = ? AND received_qty > 0) > 0 THEN 'partially_received'
                      ELSE status
                    END,
                    updated_at = ?
                    WHERE id = ?`)
          .bind(body.purchase_order_id, body.purchase_order_id, nowIso(), body.purchase_order_id)
          .run();

        return json({ ok: true, id: body.id, lines_created: body.lines?.length ?? 0, inventory_posted: true }, 201);
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
