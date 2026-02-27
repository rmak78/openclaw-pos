# Procurement Flow (v1)

This doc covers:
- Suppliers
- Purchase orders (header + lines)
- Purchase order status transitions
- Goods receipts (GRN) and stock posting

## 1) Create supplier

`POST /v1/suppliers`

Required fields:
- `id`
- `supplier_code`
- `supplier_name`

Example request:

```json
{
  "id": "sup-001",
  "supplier_code": "SUP-ALPHA",
  "supplier_name": "Alpha Distributors",
  "payment_terms_days": 30,
  "status": "active"
}
```

Success (`201`):

```json
{ "ok": true, "id": "sup-001" }
```

## 2) Create purchase order

`POST /v1/purchase-orders`

Required fields:
- `id`
- `po_number`
- `supplier_id`
- `branch_id`
- `order_date`
- `currency_code`

Optional `lines[]`; each line requires:
- `id`
- `sku_code`
- `ordered_qty`
- `unit_cost`

Example request:

```json
{
  "id": "po-001",
  "po_number": "PO-KHI-0001",
  "supplier_id": "sup-001",
  "branch_id": "demo-branch-khi-01",
  "order_date": "2026-02-27",
  "currency_code": "PKR",
  "lines": [
    {
      "id": "pol-001",
      "sku_code": "TEA-CHAI-001",
      "ordered_qty": 100,
      "unit_cost": 70,
      "tax_rate": 0.18
    }
  ]
}
```

Success (`201`):

```json
{
  "ok": true,
  "id": "po-001",
  "status": "draft",
  "lines_created": 1
}
```

Notes:
- API logs initial status event in `purchase_order_status_events`
- Line totals are computed as `ordered_qty * unit_cost * (1 + tax_rate)`

## 3) Transition PO status

`POST /v1/purchase-orders/transition`

Required fields:
- `purchase_order_id`
- `to_status`

Allowed transitions:
- `draft` → `submitted | cancelled`
- `submitted` → `partially_received | received | cancelled`
- `partially_received` → `received | cancelled`
- `received` → `closed`
- `closed` and `cancelled` are terminal

Example request:

```json
{
  "purchase_order_id": "po-001",
  "to_status": "submitted",
  "transition_note": "Approved by procurement lead"
}
```

Success (`200`):

```json
{
  "ok": true,
  "purchase_order_id": "po-001",
  "from_status": "draft",
  "status": "submitted"
}
```

Possible errors:
- `404` PO not found
- `400` invalid transition

## 4) Post goods receipt (GRN)

`POST /v1/goods-receipts`

Required fields:
- `id`
- `grn_number`
- `purchase_order_id`
- `supplier_id`
- `branch_id`
- `received_at`

Optional `lines[]`; each line requires:
- `id`
- `sku_code`
- `received_qty`
- `accepted_qty`
- `unit_cost`

Example request:

```json
{
  "id": "grn-001",
  "grn_number": "GRN-KHI-0001",
  "purchase_order_id": "po-001",
  "supplier_id": "sup-001",
  "branch_id": "demo-branch-khi-01",
  "received_at": "2026-02-28T09:00:00.000Z",
  "lines": [
    {
      "id": "grnl-001",
      "purchase_order_line_id": "pol-001",
      "sku_code": "TEA-CHAI-001",
      "received_qty": 100,
      "accepted_qty": 98,
      "rejected_qty": 2,
      "unit_cost": 70
    }
  ]
}
```

Success (`201`):

```json
{
  "ok": true,
  "id": "grn-001",
  "lines_created": 1,
  "inventory_posted": true
}
```

GRN side-effects:
- Inserts `goods_receipt_lines`
- Increments `inventory_items.quantity_on_hand` by `accepted_qty`
- Increments `purchase_order_lines.received_qty`
- Recomputes PO status (`partially_received` / `received`)

## Read endpoints

- `GET /v1/suppliers`
- `GET /v1/purchase-orders` (includes supplier fields via join)
- `GET /v1/purchase-orders/summary`
- `GET /v1/goods-receipts`

## Status codes summary

- `200` — successful GET + status transition
- `201` — successful create
- `400` — validation/transition/database failure
- `401` — unauthorized write
- `404` — purchase order not found (transition endpoint)
