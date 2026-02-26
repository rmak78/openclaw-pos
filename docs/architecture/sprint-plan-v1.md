# Sprint Plan v1 — Domain Expansion (Cloudflare Workers + D1)

## Scope
Build the next `/v1` slice after `org-units` and `employees`, focused on pilot-ready store operations:
- Sales capture
- Till lifecycle
- Shift lifecycle
- Attendance capture
- Offline sync events (push/pull)

---

## 1) API Contract Map (Next 10 Endpoints)

Base: `/v1` (JSON only, UTC timestamps, UUID/ULID ids as text)

| # | Method + Path | Purpose | Request (minimum) | Response (minimum) |
|---|---|---|---|---|
| 1 | `GET /v1/tills` | List tills (filter by `branch_id`, `is_active`) | query: `branch_id?` | `{ ok, items:[{ id, branch_id, code, name, status, is_active }] }` |
| 2 | `POST /v1/tills` | Register till | `{ id, branch_id, code, name }` | `201 { ok, id }` |
| 3 | `GET /v1/shifts` | List shifts (filter by `branch_id`, `till_id`, `business_date`) | query filters | `{ ok, items:[{ id, till_id, cashier_employee_id, opened_at, closed_at, status }] }` |
| 4 | `POST /v1/shifts` | Open shift | `{ id, till_id, cashier_employee_id, opening_float_minor, business_date }` | `201 { ok, id, status:"open" }` |
| 5 | `POST /v1/shifts/:id/close` | Close shift | `{ closed_by_employee_id, closing_balance_minor }` | `{ ok, id, status:"closed", variance_minor }` |
| 6 | `GET /v1/sales` | List sales (filter by `branch_id`, `business_date`, `shift_id`) | query filters | `{ ok, items:[{ id, receipt_no, total_minor, status, sold_at }] }` |
| 7 | `POST /v1/sales` | Create sale (header+lines+payments) | `{ id, branch_id, till_id, shift_id, cashier_employee_id, sold_at, currency_code, lines:[...], payments:[...] }` | `201 { ok, id, receipt_no, total_minor }` |
| 8 | `POST /v1/sales/:id/void` | Void finalized sale with reason | `{ reason_code, reason_note?, voided_by_employee_id }` | `{ ok, id, status:"voided" }` |
| 9 | `POST /v1/attendance/events` | Check-in/check-out/presence event | `{ id, employee_id, branch_id, event_type, event_at, source }` | `201 { ok, id }` |
| 10 | `POST /v1/sync-events/batch` | Offline client push + optional pull watermark | `{ source_node, idempotency_key, events:[{ event_id, event_type, occurred_at, payload_json }], pull_since? }` | `{ ok, accepted, duplicates, rejected, next_cursor?, outbound_events? }` |

### Contract conventions
- All mutating endpoints support `Idempotency-Key` header (or body fallback in `sync-events/batch`).
- Business money fields use integer minor units (`*_minor`) to avoid floating-point errors.
- `status` enums are strict; unknown enum => `400`.
- Soft constraints for pilot: max 200 rows/list call, max 500 events per sync batch.

---

## 2) Data Model Deltas + Migration Files List

Current schema already has: `org_units`, `employees`, `sync_events`.

### New tables
1. **`tills`**
   - `id PK`, `branch_id FK(org_units.id)`, `code UNIQUE`, `name`, `status` (`active|maintenance|retired`), `is_active`, timestamps.
2. **`shifts`**
   - `id PK`, `till_id FK`, `branch_id FK`, `cashier_employee_id FK`, `business_date`, `opening_float_minor`, `closing_balance_minor`, `variance_minor`, `status` (`open|closed|cancelled`), `opened_at`, `closed_at`.
3. **`sales`**
   - `id PK`, `receipt_no UNIQUE`, `branch_id FK`, `till_id FK`, `shift_id FK`, `cashier_employee_id FK`, `business_date`, `sold_at`, `currency_code`, `subtotal_minor`, `discount_minor`, `tax_minor`, `total_minor`, `status` (`completed|voided`), `void_reason_code`, `voided_at`.
4. **`sale_lines`**
   - `id PK`, `sale_id FK(sales.id)`, `line_no`, `sku`, `description`, `qty`, `unit_price_minor`, `discount_minor`, `tax_minor`, `line_total_minor`.
5. **`sale_payments`**
   - `id PK`, `sale_id FK`, `method` (`cash|card|wallet|bank_transfer`), `amount_minor`, `reference_no`, `provider`.
6. **`attendance_events`**
   - `id PK`, `employee_id FK`, `branch_id FK`, `event_type` (`check_in|check_out|break_start|break_end`), `event_at`, `source` (`mobile|till|manual`), `notes`.
7. **`idempotency_keys`**
   - `scope` (endpoint/resource), `idempotency_key`, `request_hash`, `response_json`, `status_code`, `created_at`; unique `(scope, idempotency_key)`.
8. **`sync_offsets`**
   - per node cursor tracking: `source_node PK`, `last_event_created_at`, `last_event_id`, `updated_at`.

### Existing table changes
- `sync_events` add columns:
  - `idempotency_key TEXT`
  - `occurred_at TEXT`
  - `server_status TEXT DEFAULT 'accepted'` (`accepted|duplicate|rejected|applied`)
  - `error_code TEXT`
- Add indexes:
  - `idx_sync_events_source_created(source_node, created_at)`
  - `idx_sales_branch_date(branch_id, business_date)`
  - `idx_shifts_till_date(till_id, business_date)`
  - `idx_attendance_employee_time(employee_id, event_at)`

### Migration files (planned)
1. `data-model/migrations/0002_tills_and_shifts.sql`
2. `data-model/migrations/0003_sales_core.sql`
3. `data-model/migrations/0004_sales_lines_and_payments.sql`
4. `data-model/migrations/0005_attendance_events.sql`
5. `data-model/migrations/0006_sync_protocol_v1.sql`
6. `data-model/migrations/0007_indexes_and_constraints.sql`

---

## 3) Offline Sync Protocol v1 (Tills)

## Objective
Guarantee at-least-once delivery from tills with server-side idempotent apply, deterministic ordering, and resumable pull.

### Client queue model (till)
- Local append-only queue item:
  - `local_seq` (monotonic integer)
  - `event_id` (UUID/ULID)
  - `event_type` (e.g., `sale.created`, `sale.voided`, `attendance.check_in`)
  - `aggregate_id` (sale/shift/etc)
  - `payload_json`
  - `occurred_at` (device UTC)
  - `attempt_count`, `next_retry_at`, `last_error`
- Queue order for send: `(next_retry_at asc, local_seq asc)`.

### Push flow (`POST /v1/sync-events/batch`)
1. Client sends up to 500 events with one `idempotency_key` per batch.
2. Server checks batch idempotency (`scope=sync.batch`).
3. For each event:
   - If `event_id` exists => mark duplicate.
   - Else validate schema + business preconditions.
   - Persist raw event in `sync_events`.
   - Apply projection/transaction to domain tables (sale/shift/etc).
4. Return per-batch summary + `next_cursor`.

### Idempotency rules
- **Batch idempotency**: same `(scope, idempotency_key)` returns exact prior response.
- **Event idempotency**: unique `event_id` in `sync_events` prevents re-apply.
- **Domain idempotency**: sale/shifts inserts use deterministic IDs from client; duplicates become no-op.

### Retry/backoff policy (client)
- Retry on network/5xx/429.
- Exponential backoff with jitter:
  - `delay = min(60s, 2^attempt_count + random(0..1000ms))`
- Do not retry validation/business rejections (`4xx` except `409` duplicate).
- Dead-letter after 20 failed attempts or explicit terminal rejection.

### Pull/ack model (v1-lite)
- Batch response may include `outbound_events` and `next_cursor`.
- Till stores `next_cursor`; next sync sends it as `pull_since`.
- Cursor format: opaque server token derived from `(created_at,event_id)`.

### Conflict handling
- Authority for monetary finalization is server apply transaction.
- Duplicate/late events: accept as duplicate/no-op.
- Invalid sequence (e.g., void unknown sale): reject with `error_code`, keep in client dead-letter for manual review.

---

## 4) Phase-1 Pilot Acceptance Criteria

### Functional
- [ ] Can register till, open shift, post sales, close shift for one pilot branch.
- [ ] Attendance check-in/check-out recorded for pilot cashiers.
- [ ] Sale void flow works with reason capture and audit trail.

### Offline + Sync
- [ ] Till can operate offline for at least 8 hours and queue events locally.
- [ ] After reconnection, queued events sync successfully with no duplicate sales.
- [ ] Replay of same batch returns same idempotent response.
- [ ] Out-of-order/invalid events are rejected with actionable error codes.

### Data integrity
- [ ] Monetary totals (`sales` vs sum(lines/payments)) validated in transaction.
- [ ] One open shift max per till at a time (enforced by constraint/app logic).
- [ ] All write endpoints persist audit timestamps + actor IDs where applicable.

### Performance/SLO (pilot scale)
- [ ] `POST /v1/sales` p95 < 500ms under 20 req/s synthetic branch load.
- [ ] `POST /v1/sync-events/batch` (200 events) p95 < 1.5s.
- [ ] No failed migrations on fresh and upgrade paths.

### Operational readiness
- [ ] Migrations are reversible or have documented rollback procedure.
- [ ] API error catalog documented for cashier app/till client handling.
- [ ] Pilot runbook includes sync failure triage and dead-letter replay steps.

---

## Suggested delivery sequence (implementation order)
1. Migrations `0002` + `0003` + `0007` (tills, shifts, sales header, constraints/indexes)
2. Endpoints: tills + shifts open/close
3. Sales create/list/void (+ lines/payments persistence)
4. Attendance events endpoint
5. Sync batch endpoint + idempotency store + retry/error code matrix
6. Pilot dry run with seeded branch/till/cashier data
