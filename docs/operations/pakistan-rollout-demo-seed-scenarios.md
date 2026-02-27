# Pakistan Rollout Demo Seed Scenarios (Multi-Branch + Returns + Procurement + Payroll)

This guide seeds a realistic Pakistan pilot/rollout narrative on top of the v1 API.

It includes:
- Multiple branches and tills (Karachi baseline + Lahore + Islamabad)
- Sales return and refund with inventory reversal
- Procurement flow (supplier → PO → submitted → GRN)
- Payroll sample cycle and branch-level payroll runs

---

## Script location

- `scripts/seed-pk-rollout-demo.sh`

---

## Prerequisites

1. API is reachable (local `wrangler dev` or deployed endpoint)
2. If write-protection is enabled, provide API key via env:
   - `API_KEY=<key>` or `OPENCLAW_API_KEY=<key>`
3. `curl` installed (and optionally `jq` for pretty output)

---

## Usage

### 1) Against deployed API

```bash
cd /home/rmak78/.openclaw/workspace/openclaw-pos
chmod +x scripts/seed-pk-rollout-demo.sh
BASE_URL="https://pos-api.bixisoft.com/v1" API_KEY="<your-write-key>" ./scripts/seed-pk-rollout-demo.sh
```

### 2) Against local dev API

```bash
cd /home/rmak78/.openclaw/workspace/openclaw-pos
npx wrangler dev
```

In another terminal:

```bash
BASE_URL="http://127.0.0.1:8787/v1" API_KEY="<your-write-key-if-set>" ./scripts/seed-pk-rollout-demo.sh
```

### 3) Optional run tag override (for deterministic IDs)

```bash
RUN_TAG="20260227A" BASE_URL="http://127.0.0.1:8787/v1" ./scripts/seed-pk-rollout-demo.sh
```

---

## What the script creates

### A) Branch and till expansion

- Baseline: `POST /v1/seed/demo-branch` (Karachi HO/branch/till baseline)
- New branches:
  - `LHE-01` (Lahore Gulberg)
  - `ISB-01` (Islamabad F-7)
- New tills:
  - Lahore Till 1 + Till 2
  - Islamabad Till 1

### B) Returns and refund scenario

- Creates a Karachi sales receipt and line for `TEA-CHAI-001`
- Captures cash payment
- Creates return header + return line
- Posts refund
- Return line with `restock_to_inventory=1` triggers:
  - `inventory_movements` insert (movement type `sale_return`)
  - stock increment in `inventory_items`

### C) Procurement scenario

- Creates supplier `Punjab Chai Processors`
- Creates PO with one line
- Transitions PO from `draft` → `submitted`
- Posts GRN with accepted/rejected quantities
- GRN updates:
  - branch stock (`inventory_items.quantity_on_hand`)
  - `purchase_order_lines.received_qty`
  - PO status (`partially_received` or `received`)

### D) Payroll scenario

- Creates monthly PK pay cycle
- Creates two pay components (basic + allowance)
- Creates payroll runs for Karachi and Lahore branches

---

## Expected output snippets

The script prints each API response. Typical success responses:

- Create records:

```json
{
  "ok": true,
  "id": "demo-branch-lhe-<RUN_TAG>"
}
```

- Return line inventory reversal:

```json
{
  "ok": true,
  "id": "demo-return-line-khi-<RUN_TAG>",
  "inventory_reversed": true,
  "quantity_restocked": 1
}
```

- Goods receipt posting:

```json
{
  "ok": true,
  "id": "demo-grn-lhe-<RUN_TAG>",
  "lines_created": 1,
  "inventory_posted": true
}
```

- Final completion marker:

```text
✅ Pakistan rollout demo seed completed
Scenarios covered: multi-branch+tills, returns/refunds, procurement, payroll runs
Run tag: <RUN_TAG>
```

---

## Quick verification endpoints

After running, these checks should show seeded activity:

```bash
curl -sS "$BASE_URL/org-units" | jq '.items[] | {id, unit_type, code, name}'
curl -sS "$BASE_URL/sales-returns" | jq '.items[:3]'
curl -sS "$BASE_URL/sales-refunds" | jq '.items[:3]'
curl -sS "$BASE_URL/purchase-orders/summary" | jq .
curl -sS "$BASE_URL/payroll-runs" | jq '.items[:5]'
```

And Karachi day close summary:

```bash
curl -sS "$BASE_URL/day-close-summary?branch_id=demo-branch-khi-01&business_date=2026-02-27" | jq .
```

---

## Notes

- The script uses a default `RUN_TAG` timestamp for unique IDs, so it is safely re-runnable.
- If API key auth is disabled in your environment, `API_KEY` can be omitted.
- If `jq` is unavailable, raw JSON is still printed.
