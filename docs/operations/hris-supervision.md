# HRIS Supervision Review — Rollout Readiness (Attendance, Shifts, Onboarding, Role Controls)

Date: 2026-02-27
Scope reviewed:
- API implementation: `src/index.ts`
- DB migrations: `data-model/migrations/*.sql`
- Existing HR/ops docs: `docs/operations/hris-sprint-v1.md`, `README.md`

## Executive Summary

Current HRIS scope is **not rollout-ready** for practical operations.

What exists now is a useful base:
- employee master create/list (`/v1/employees`)
- payroll master stubs (`/v1/pay-cycles`, `/v1/pay-components`, `/v1/payroll-runs`)

But critical operational tracks for HRIS are missing or inconsistent:
- no attendance ingestion/rebuild/regularization APIs
- no shift templates/roster APIs
- onboarding data model far below documented checklist
- role controls are API-key level only (no role claim enforcement)
- payroll endpoints exist in API code but corresponding migration tables are not present

## Readiness by Domain

### 1) Employee onboarding readiness — **Partial / Not sufficient for rollout**

**Implemented now**
- `GET/POST /v1/employees`
- fields currently persisted: `id, employee_code, full_name, employment_type, country_code, legal_entity_id, branch_id, is_active`

**Key gaps vs practical rollout**
- Missing onboarding-critical fields from HRIS spec (examples):
  - join/exit lifecycle dates and status transitions
  - department/designation/manager hierarchy
  - attendance mode and default shift template
  - biometric/POS mapping references
  - mandatory compliance identity/contact set for country-level operations
- No employee lifecycle APIs (`activate/suspend/exit`) as defined in `docs/operations/hris-sprint-v1.md`.

### 2) Attendance readiness — **Not implemented**

**Implemented now**
- No `/v1/hr/attendance/*` routes in `src/index.ts`.
- No attendance-specific compute/rebuild logic.

**Key gaps**
- Missing raw attendance event ingestion (biometric/POS fusion).
- Missing daily attendance materialization table and regularization workflow.
- Missing exception reporting endpoints.
- Missing idempotent import controls and actor-stamped audit trail for regularization.

### 3) Shift & roster readiness — **Not implemented (HRIS scope)**

**Implemented now**
- POS till sessions exist, but these are not HR shift templates/rosters.
- No `/v1/hr/shifts/templates` or `/v1/hr/rosters/*` routes.

**Key gaps**
- No shift template master, no roster publication, no overlap-prevention checks.
- No swap request/approval flow.
- No cross-midnight handling policy implemented in API layer.

### 4) Payroll track readiness — **Foundation only, with schema risk**

**Implemented now**
- API handlers for:
  - `GET/POST /v1/pay-cycles`
  - `GET/POST /v1/pay-components`
  - `GET/POST /v1/payroll-runs`

**Critical gap**
- Corresponding table DDL is not found in current migrations (`data-model/migrations/` currently includes `0001..0008, 0011`; no payroll migration file defining `pay_cycles`, `pay_components`, `payroll_runs`).
- This creates deployment risk: endpoints may fail against environments built strictly from current migration set.

### 5) Role controls / authorization readiness — **Insufficient**

**Implemented now**
- write authorization is API key gate (`x-api-key`) for selected paths.

**Critical gaps**
- No RBAC claim enforcement by role/action (HR admin, supervisor, payroll approver, etc.).
- No maker-checker for sensitive HR/payroll actions.
- Payroll write routes are not listed in `writePaths` despite being POST handlers, which can bypass intended API-key protection.
- Route discoverability mismatch: `/v1` route list omits pay endpoints while README lists them.

## Consolidated Gap List (Actionable)

1. **Schema drift**: payroll endpoint tables absent from migrations.
2. **API drift**: `/v1` advertised route list and auth write-path list out of sync with implemented endpoints.
3. **Attendance missing**: no ingestion, rebuild, daily materialization, regularization, exceptions APIs.
4. **Shift/roster missing**: no HR shift template and roster domain implementation.
5. **Onboarding depth missing**: employee model too thin for branch/country rollout controls.
6. **RBAC missing**: no role claim checks, no approval lanes, no actor-bound audit model in runtime APIs.
7. **Doc-to-code mismatch**: `hris-sprint-v1.md` defines a larger `/v1/hr/*` contract not yet reflected in implementation or migrations.

## Recommended Milestones

### Milestone 0 (Stability Hotfix, 1–2 days)
- Add/verify payroll table migrations for `pay_cycles`, `pay_components`, `payroll_runs`.
- Align `/v1` route registry with implemented payroll endpoints.
- Add payroll write endpoints to write-auth set.
- Add smoke tests to confirm endpoint + table availability parity.

### Milestone 1 (HR Core Data, 3–5 days)
- Extend employee schema with minimum onboarding/lifecycle fields.
- Add `GET detail`, `PATCH`, `activate/suspend/exit` endpoints.
- Enforce basic validation policy from onboarding checklist.

### Milestone 2 (Shifts & Rosters, 4–6 days)
- Implement shift template and roster tables/endpoints.
- Add overlap prevention and cutoff policy checks.
- Add roster publish audit events.

### Milestone 3 (Attendance Engine v1, 5–8 days)
- Add biometric/POS attendance event ingestion tables + APIs.
- Build daily attendance consolidation (`rebuild` + incremental mode).
- Add regularization + exception endpoints with reason and actor capture.

### Milestone 4 (Role Controls + Approvals, 3–5 days)
- Introduce role-claim middleware (at minimum: HR_ADMIN, HR_SUPERVISOR, PAYROLL_ADMIN, PAYROLL_APPROVER).
- Enforce maker-checker on payroll finalization and attendance regularization overrides.
- Add immutable audit log endpoint for HR sensitive actions.

### Milestone 5 (Rollout Readiness Gate, 2–3 days)
- Publish UAT matrix for onboarding/roster/attendance/payroll.
- Add synthetic branch pilot dataset + repeatable smoke scripts.
- Signoff checklist: schema parity, API parity, auth parity, audit parity.

## Immediate Go/No-Go Recommendation

- **Go for controlled engineering completion only** (internal build/test).
- **No-go for pilot rollout** until Milestone 0 + at least Milestones 1–3 are complete and validated.
