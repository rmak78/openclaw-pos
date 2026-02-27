# OpenClaw POS API Contracts (v1)

This folder documents the **current API contract implemented in `src/index.ts`**.

Scope:
- Versioned endpoints under `/v1/*`
- Request/response shapes used today
- Required fields and status codes
- Practical flow docs for:
  - Payroll
  - Procurement
  - Sales returns + refunds

## Base URL

- Local/preview: your Worker URL
- All examples use: `{{BASE_URL}}`

## Authentication

Write endpoints (`POST`) require `x-api-key` **when** `API_WRITE_KEY` is configured in the Worker environment.

```http
x-api-key: {{API_WRITE_KEY}}
```

If missing/invalid:

```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

Status: `401`

## Common Response Patterns

Success:

```json
{ "ok": true }
```

Validation errors (`400`):

```json
{
  "ok": false,
  "error": "Required fields: id, ..."
}
```

Insert/update failures (`400`):

```json
{
  "ok": false,
  "error": "Insert failed",
  "detail": "...driver/database error..."
}
```

Not found (`404`):

```json
{
  "ok": false,
  "error": "Not Found",
  "message": "Use /v1 for versioned endpoints"
}
```

## Service / Utility Endpoints

### `GET /health`
- Status: `200`
- Response: `{ ok, service, env }`

### `GET /db-check`
- Status: `200`
- Response: `{ ok, db_time }`

### `GET /v1`
- Status: `200`
- Returns route listing and API marker

### `GET /v1/health`
- Status: `200`
- Response: `{ ok, api: "v1", service, env }`

### `GET /v1/db-check`
- Status: `200`
- Response: `{ ok, api: "v1", db_time }`

### `GET /v1/meta`
- Status: `200`
- Response includes `{ version, deployedOn, db }`

### `GET /v1/modules`
- Status: `200`
- Response includes module groupings (`core`, `commerce`, `financeOps`, `procurement`, etc.)

## Resource Endpoint Contracts (v1)

For most resources:
- `GET /v1/<resource>` returns `{ ok: true, items: [...] }` (`200`)
- `POST /v1/<resource>` creates row and returns `{ ok: true, id: ... }` (`201`)
- Validation/database errors return `400`

### Core master + commerce

- `/v1/org-units` (POST required: `id, unit_type, code, name`)
- `/v1/employees` (required: `id, employee_code, full_name, employment_type, country_code`)
- `/v1/channels` (required: `id, code, name, channel_type`)
- `/v1/channel-accounts` (required: `id, channel_id, account_name`)
- `/v1/orders` (required: `id, order_code, currency_code, order_status`)
- `/v1/shipments` (required: `id, order_id, shipment_status`)

### Customer, inventory, pricing, tax, payments

- `/v1/customers` (required: `id, customer_code, full_name`)
- `/v1/inventory-items` (required: `id, sku_code, item_name, uom`)
- `/v1/prices` (required: `id, sku_code, currency_code, price_list`)
- `/v1/tax-rules` (required: `id, rule_code, country_code, tax_name, tax_rate, tax_mode`)
  - `tax_mode` must be `inclusive` or `exclusive`
- `/v1/payment-methods` (required: `id, method_code, display_name, settlement_mode`)

### Sync + app config

- `/v1/sync-outbox` (required: `id, source_node, entity_type, entity_id, operation_type, payload_json, idempotency_key`)
- `/v1/sync-conflicts` (required: `id, entity_type, entity_id, conflict_reason, local_payload_json, remote_payload_json, resolution_strategy`)
- `/v1/app-config`
  - POST required: `key_name, value_json`
  - Upsert behavior on `key_name` conflict

### POS sales + cash operations

- `/v1/sales-receipts` (required: `id, receipt_no, branch_id, currency_code, business_date`)
  - On create also writes to `sync_outbox`
  - Response includes `posted_to_ledger`, `queued_for_sync`
- `/v1/sales-receipt-lines` (required: `id, sales_receipt_id, sku_code, quantity, unit_price, line_total`)
- `/v1/sales-receipt-payments` (required: `id, sales_receipt_id, payment_method_id, amount`)
- `/v1/sales-returns` (required: `id, return_no, branch_id, currency_code, business_date`)
- `/v1/sales-return-lines` (required: `id, sales_return_id, sku_code, quantity, unit_price, line_total`)
  - Rejects unknown `sales_return_id`
  - Can auto-restock inventory (`restock_to_inventory`, default `1`)
- `/v1/sales-refunds` (required: `id, sales_return_id, payment_method_id, amount`)
- `/v1/day-close-summary` (`GET`) requires query params: `branch_id`, `business_date`
- `/v1/till-sessions` (POST required: `id, till_id, branch_id`)
- `/v1/till-sessions/close` (POST required: `till_session_id, expected_cash_amount, counted_cash_amount`)
- `/v1/cash-drops` (required: `id, till_session_id, branch_id, amount, drop_reason`)
- `/v1/variance-reasons` (required: `id, reason_code`)
- `/v1/inventory-movements` (required: `id, movement_code, sku_code, branch_id, movement_type, quantity_delta, business_date`)
  - Also updates `inventory_items.quantity_on_hand`
- `/v1/branch-reconciliations` (required: `id, branch_id, business_date, expected_sales_amount, counted_cash_amount`)

### Payroll

- `/v1/pay-cycles` (required: `id, cycle_code, country_code, cycle_type, cycle_start, cycle_end, payday`)
- `/v1/pay-components` (required: `id, component_code, component_name, component_type, calc_mode`)
- `/v1/payroll-runs` (required: `id, pay_cycle_id, run_code, run_type`)

Detailed flow: [payroll.md](./payroll.md)

### Procurement

- `/v1/suppliers` (required: `id, supplier_code, supplier_name`)
- `/v1/purchase-orders` (required: `id, po_number, supplier_id, branch_id, order_date, currency_code`)
  - Optional embedded lines; each line requires `id, sku_code, ordered_qty, unit_cost`
- `/v1/purchase-orders/transition` (required: `purchase_order_id, to_status`)
  - Transition validation enforced
- `/v1/purchase-orders/summary` (`GET`) aggregated status counts
- `/v1/goods-receipts` (required: `id, grn_number, purchase_order_id, supplier_id, branch_id, received_at`)
  - Optional embedded lines; each line requires `id, sku_code, received_qty, accepted_qty, unit_cost`
  - Posts accepted qty into inventory and updates PO lines/status

Detailed flow: [procurement.md](./procurement.md)

### Connectors + seed

- `POST /v1/connectors/shopify/order-webhook`
- `POST /v1/connectors/amazon/order-webhook`
  - Minimal canonical order ingest
  - Success status: `202`
- `POST /v1/seed/demo-branch`
  - Demo bootstrap; returns `201`

## Flow-specific contracts

- [returns.md](./returns.md) — returns + refund + inventory reversal sequence
- [payroll.md](./payroll.md) — pay cycle → components → payroll run
- [procurement.md](./procurement.md) — supplier → PO → transition → GRN → stock update

## Notes

- This contract is **implementation-first** and should be updated with `src/index.ts` changes.
- The route list returned by `GET /v1` currently does not include payroll endpoints, but payroll routes are implemented and documented here.
