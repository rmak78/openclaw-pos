# Payroll Flow (v1)

This doc covers:
- Pay cycles
- Pay components
- Payroll runs

> Note: these endpoints are implemented in `src/index.ts` even though they are not currently listed in the `GET /v1` route array.

## 1) Create pay cycle

`POST /v1/pay-cycles`

Required fields:
- `id`
- `cycle_code`
- `country_code`
- `cycle_type`
- `cycle_start`
- `cycle_end`
- `payday`

Example request:

```json
{
  "id": "pc-2026-02-pk",
  "cycle_code": "PK-MONTHLY-2026-02",
  "country_code": "PK",
  "cycle_type": "monthly",
  "cycle_start": "2026-02-01",
  "cycle_end": "2026-02-28",
  "payday": "2026-03-05",
  "status": "draft"
}
```

Success (`201`):

```json
{ "ok": true, "id": "pc-2026-02-pk" }
```

## 2) Create pay components

`POST /v1/pay-components`

Required fields:
- `id`
- `component_code`
- `component_name`
- `component_type`
- `calc_mode`

Example request:

```json
{
  "id": "comp-basic",
  "component_code": "BASIC",
  "component_name": "Basic Salary",
  "component_type": "earning",
  "calc_mode": "fixed",
  "taxable_default": 1,
  "pensionable_default": 1
}
```

Success (`201`):

```json
{ "ok": true, "id": "comp-basic" }
```

## 3) Create payroll run

`POST /v1/payroll-runs`

Required fields:
- `id`
- `pay_cycle_id`
- `run_code`
- `run_type`

Example request:

```json
{
  "id": "pr-2026-02-main",
  "pay_cycle_id": "pc-2026-02-pk",
  "branch_id": "demo-branch-khi-01",
  "run_code": "PR-PK-2026-02",
  "run_type": "regular",
  "status": "draft",
  "notes": "Main monthly payroll"
}
```

Success (`201`):

```json
{ "ok": true, "id": "pr-2026-02-main" }
```

## Read endpoints

- `GET /v1/pay-cycles`
- `GET /v1/pay-components`
- `GET /v1/payroll-runs`

All return:

```json
{ "ok": true, "items": [] }
```

## Status codes summary

- `200` — successful GET
- `201` — successful create
- `400` — validation/database failure
- `401` — unauthorized write

## Practical sequence

1. Create pay cycle for period
2. Seed/update pay components for local policy
3. Create payroll run referencing pay cycle
4. (Downstream processing/approval/posting is not yet exposed in current v1 endpoints)
