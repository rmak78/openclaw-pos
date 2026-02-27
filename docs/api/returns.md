# Returns & Refunds Flow (v1)

This doc covers the practical contract for:
- `sales-returns`
- `sales-return-lines`
- `sales-refunds`

All `POST` calls require `x-api-key` when write auth is enabled.

## 1) Create return header

`POST /v1/sales-returns`

Required fields:
- `id`
- `return_no`
- `branch_id`
- `currency_code`
- `business_date`

Example request:

```json
{
  "id": "ret-001",
  "return_no": "RET-KHI-0001",
  "original_sales_receipt_id": "sr-001",
  "branch_id": "demo-branch-khi-01",
  "cashier_employee_id": "demo-emp-khi-01",
  "customer_id": "demo-cus-cash-01",
  "return_reason": "damaged item",
  "currency_code": "PKR",
  "subtotal_amount": 120,
  "tax_amount": 0,
  "discount_amount": 0,
  "total_amount": 120,
  "business_date": "2026-02-27"
}
```

Success response (`201`):

```json
{
  "ok": true,
  "id": "ret-001",
  "status": "initiated"
}
```

## 2) Add return line(s)

`POST /v1/sales-return-lines`

Required fields:
- `id`
- `sales_return_id`
- `sku_code`
- `quantity`
- `unit_price`
- `line_total`

Behavior:
- API verifies `sales_return_id` exists; if not, returns `400` with `sales_return_id not found`
- `restock_to_inventory` defaults to `1` (true)
- When restocking, API:
  - inserts an `inventory_movements` row (`movement_type = sale_return`)
  - increments `inventory_items.quantity_on_hand`

Example request:

```json
{
  "id": "ret-line-001",
  "sales_return_id": "ret-001",
  "sku_code": "TEA-CHAI-001",
  "item_name": "Tea / Chai Cup",
  "quantity": 1,
  "unit_price": 120,
  "line_total": 120,
  "restock_to_inventory": 1
}
```

Success response (`201`):

```json
{
  "ok": true,
  "id": "ret-line-001",
  "inventory_reversed": true,
  "quantity_restocked": 1
}
```

## 3) Record refund

`POST /v1/sales-refunds`

Required fields:
- `id`
- `sales_return_id`
- `payment_method_id`
- `amount`

Example request:

```json
{
  "id": "refund-001",
  "sales_return_id": "ret-001",
  "payment_method_id": "demo-pay-cash",
  "amount": 120,
  "reference_no": "REF-0001"
}
```

Success response (`201`):

```json
{
  "ok": true,
  "id": "refund-001",
  "status": "processed"
}
```

## Read endpoints

- `GET /v1/sales-returns` → latest 200 returns
- `GET /v1/sales-return-lines` → latest 500 return lines
- `GET /v1/sales-refunds` → latest 500 refunds

All return:

```json
{ "ok": true, "items": [] }
```

## Status codes summary

- `200` — successful GET
- `201` — successful create
- `400` — validation failure, unknown return id, or DB insert failure
- `401` — unauthorized write
