# HRIS Sprint Plan v1 (PK Pilot)

**Product:** openclaw-pos  
**Module:** HR (Pilot Scope)  
**Pilot Country:** Pakistan (PK)  
**Sprint Horizon:** 2 weeks (10 working days)  
**Owner:** HRIS / Platform API  
**Status:** Draft for implementation

---

## 0) Sprint Outcome (Definition of Done)

By end of sprint, pilot branches can:

1. onboard employees with a complete PK-ready data checklist,
2. capture attendance from **POS login/logout + biometric punches**,
3. apply a baseline shift-roster policy (day/night/general with grace + overtime rules),
4. use stable v1 HR endpoints and DB tables to support next sprint (leave/payroll integration).

---

## 1) Employee Onboarding Data Checklist (PK Pilot)

Use as required payload baseline for HR create/update flows and branch onboarding SOP.

### 1.1 Identity & Employment Core

- [ ] Employee UUID (`id`)
- [ ] Employee code (`employee_code`) — unique
- [ ] Full legal name (English)
- [ ] Optional local-language name (Urdu)
- [ ] Date of birth
- [ ] Gender (for statutory reporting where required)
- [ ] CNIC number (13 digits, masked in UI)
- [ ] CNIC issue date / expiry date (if available)
- [ ] Employment type (`permanent | contract | daily_wager | intern`)
- [ ] Hire date (joining date)
- [ ] Probation end date (if applicable)
- [ ] Confirmation date (nullable)
- [ ] Status (`active | suspended | exited`)

### 1.2 Org & Role Assignment

- [ ] Country code = `PK`
- [ ] Legal entity ID
- [ ] Branch ID (mapped to `org_units`)
- [ ] Department ID/name
- [ ] Designation / job title
- [ ] Reports-to employee ID (nullable)
- [ ] Default shift template ID
- [ ] Attendance mode (`biometric_required | pos_allowed | hybrid`)

### 1.3 Contact & Address

- [ ] Mobile number (PK format)
- [ ] Emergency contact name + relation + phone
- [ ] Current address (city, district)
- [ ] Permanent address (optional if same)

### 1.4 Payroll/Compliance Minimum (for next sprint readiness)

- [ ] Salary model (`monthly | hourly | daily`)
- [ ] Base salary / rate
- [ ] Bank account title
- [ ] IBAN
- [ ] Tax status category (placeholder enum)
- [ ] EOBI applicable (bool)
- [ ] Provincial social security applicable (bool)

### 1.5 Biometric + Device Mapping

- [ ] Biometric enrollment ID / machine user ID
- [ ] Primary biometric device ID
- [ ] Fallback biometric device IDs (optional)
- [ ] POS user ID mapping (for attendance fusion)

### 1.6 Documents (metadata only in sprint v1)

- [ ] CNIC front/back uploaded flag
- [ ] Offer/appointment letter uploaded flag
- [ ] Contract uploaded flag (if contractor)
- [ ] Photo uploaded flag

### 1.7 Validation Rules (must implement)

- CNIC: numeric 13 digits, unique per legal entity.
- `employee_code`: unique globally (or unique by country + legal entity if policy requires).
- `branch_id` must exist in `org_units` with `unit_type='branch'`.
- `attendance_mode='biometric_required'` requires biometric enrollment ID.
- Soft-delete only (no hard delete in pilot).

---

## 2) Attendance Fusion Rules (POS + Biometric)

Goal: generate one authoritative daily attendance record per employee per business date.

## 2.1 Event Inputs

1. **Biometric punches**: `IN/OUT` from machine imports.
2. **POS session events**: login/logout per till.
3. **Roster data**: assigned shift start/end and grace settings.

## 2.2 Canonical Attendance Window

- Business date window for PK pilot: `00:00:00-23:59:59` local branch time.
- Cross-midnight shifts use scheduled shift start date as attendance date.

## 2.3 Fusion Priority

1. If biometric IN+OUT valid => biometric is source of truth.
2. If only one biometric event exists, supplement missing side from POS session nearest to shift bounds.
3. If no biometric events:
   - for `attendance_mode=hybrid|pos_allowed`, use POS login/logout;
   - for `biometric_required`, mark as `incomplete_biometric` and require supervisor reason.

## 2.4 Pairing & Matching Rules

- Earliest valid `IN` within window: shift_start - 180 min to shift_end + 120 min.
- Latest valid `OUT` within window: after selected `IN` and before shift_end + 360 min.
- Multiple punches: keep earliest IN + latest OUT; persist raw events for audit.
- Duplicate events within 60 seconds: deduplicate.
- Device clock skew tolerance: ±5 minutes before flagging anomaly.

## 2.5 Status Calculation

Per attendance day compute:

- `present`: IN and OUT resolved.
- `late`: IN > shift_start + grace_minutes.
- `early_exit`: OUT < shift_end - early_exit_grace_minutes.
- `half_day`: worked minutes below threshold (default < 50% scheduled).
- `absent`: no valid IN/OUT and no approved leave.
- `missing_out`: IN present but OUT unresolved.

## 2.6 Overtime Baseline

- Overtime eligible after shift_end + overtime_buffer_minutes (default 30).
- Round OT to nearest 30 minutes (configurable by legal entity).
- Daily OT cap for pilot: 4 hours unless approved override.

## 2.7 Manual Regularization Controls

- Allowed actors: Supervisor, Branch Manager, HR Ops.
- Must capture: reason code + note + actor + timestamp.
- Original derived record immutable; adjustments logged as versioned corrections.

## 2.8 Conflict Scenarios

- Biometric says absent, POS shows sales activity: flag `source_conflict` for review.
- Punches on wrong device/branch: allow if employee has temporary assignment entry.
- Missing branch timezone config: block finalization and alert Ops.

---

## 3) Shift Roster Policy Baseline (PK Pilot)

## 3.1 Shift Templates (minimum)

- **General**: 09:00-18:00 (1h break)
- **Morning**: 08:00-16:00 (45m break)
- **Evening**: 14:00-22:00 (45m break)
- **Night**: 22:00-06:00 (1h break; cross-midnight)

All templates store: start, end, break_minutes, grace_minutes, early_exit_grace, OT buffer, weekly-off mapping.

## 3.2 Roster Assignment Rules

- Publish weekly roster by **Thursday 18:00** for following week.
- Roster change cutoff: 12 hours before shift start (else supervisor+manager approval).
- One employee cannot hold overlapping shifts.
- Temporary branch transfer requires effective date range and approval.

## 3.3 Attendance Policy Constants (pilot defaults)

- Late grace: 10 minutes.
- Early-exit grace: 10 minutes.
- Half-day threshold: < 4 hours worked on 8-hour shift.
- Weekly off: 1 day/week (configurable per contract).
- Consecutive workday warning: > 6 days.

## 3.4 Leave/Public Holiday Interaction

- Approved leave supersedes absent computation.
- Public holiday shift marked `holiday_worked` if present.
- Leave module not in sprint v1; consume placeholder `approved_leave_days` feed/manual upload.

## 3.5 Approvals Matrix

- Shift swap: Supervisor
- Short-notice roster edit (<12h): Supervisor + Branch Manager
- OT override beyond cap: Branch Manager + HR Ops
- Attendance regularization: Supervisor (same day), HR Ops (retroactive)

---

## 4) Required API Endpoints (v1 HR Module Next)

> Build under `/v1/hr/*` (or `/v1/*` if existing router remains flat). JSON only, idempotent create/update where possible.

## 4.1 Employee Master

- `POST /v1/hr/employees` — create employee profile
- `GET /v1/hr/employees` — list/filter (`branch_id`, `status`, `q`)
- `GET /v1/hr/employees/{id}` — details
- `PATCH /v1/hr/employees/{id}` — update mutable fields
- `POST /v1/hr/employees/{id}/activate`
- `POST /v1/hr/employees/{id}/suspend`
- `POST /v1/hr/employees/{id}/exit`

## 4.2 Biometric & POS Mapping

- `POST /v1/hr/employees/{id}/biometric-map`
- `POST /v1/hr/employees/{id}/pos-map`
- `GET /v1/hr/biometric-devices`
- `POST /v1/hr/biometric-events/import` (bulk, idempotency key required)

## 4.3 Shift & Roster

- `POST /v1/hr/shifts/templates`
- `GET /v1/hr/shifts/templates`
- `POST /v1/hr/rosters/publish` (week range + assignments)
- `GET /v1/hr/rosters` (by date range/branch/employee)
- `POST /v1/hr/rosters/swap-request`
- `POST /v1/hr/rosters/{id}/approve`

## 4.4 Attendance Processing

- `POST /v1/hr/attendance/rebuild` (date range + branch)
- `GET /v1/hr/attendance/daily` (filters)
- `GET /v1/hr/attendance/{employee_id}/{business_date}`
- `POST /v1/hr/attendance/{id}/regularize`
- `GET /v1/hr/attendance/exceptions`

## 4.5 Audit & Reports

- `GET /v1/hr/audit-log`
- `GET /v1/hr/reports/attendance-summary` (daily/weekly)
- `GET /v1/hr/reports/late-coming`
- `GET /v1/hr/reports/overtime`

## 4.6 Endpoint Acceptance Notes

- All writes require actor context (`x-actor-id`, role claims).
- Write endpoints return `{ok, id, version}`.
- Bulk imports support idempotency key and per-row error reporting.
- Pagination: cursor or `limit/offset` (choose one consistently).

---

## 5) Required DB Tables (Next Migration Set)

> Existing: `employees`, `org_units`, `sync_events`. Extend instead of replacing.

## 5.1 Extend Existing `employees`

Add columns:
- `cnic_hash` TEXT
- `mobile` TEXT
- `employment_status` TEXT
- `hire_date` TEXT
- `probation_end_date` TEXT
- `default_shift_template_id` TEXT
- `attendance_mode` TEXT DEFAULT 'hybrid'
- `biometric_enrollment_id` TEXT
- `pos_user_id` TEXT
- `updated_by` TEXT

Indexes:
- `(country_code, branch_id, employment_status)`
- unique `(country_code, biometric_enrollment_id)` where not null
- unique `(country_code, pos_user_id)` where not null

## 5.2 New Tables

### `hr_shift_templates`
- `id` TEXT PK
- `legal_entity_id` TEXT
- `name` TEXT
- `start_time_local` TEXT
- `end_time_local` TEXT
- `break_minutes` INTEGER
- `grace_minutes` INTEGER
- `early_exit_grace_minutes` INTEGER
- `ot_buffer_minutes` INTEGER
- `cross_midnight` INTEGER
- `is_active` INTEGER
- `created_at`, `updated_at`

### `hr_rosters`
- `id` TEXT PK
- `employee_id` TEXT FK -> employees.id
- `branch_id` TEXT FK -> org_units.id
- `business_date` TEXT
- `shift_template_id` TEXT FK -> hr_shift_templates.id
- `status` TEXT (`draft|published|changed|cancelled`)
- `published_batch_id` TEXT
- `created_by`, `approved_by`
- `created_at`, `updated_at`

Unique index: `(employee_id, business_date)`

### `hr_biometric_devices`
- `id` TEXT PK
- `branch_id` TEXT FK
- `device_code` TEXT UNIQUE
- `vendor` TEXT
- `timezone` TEXT
- `is_active` INTEGER
- `last_seen_at` TEXT

### `hr_biometric_events`
- `id` TEXT PK
- `device_id` TEXT FK -> hr_biometric_devices.id
- `employee_id` TEXT FK -> employees.id (nullable until mapping resolved)
- `enrollment_id` TEXT
- `event_type` TEXT (`in|out|unknown`)
- `event_time_local` TEXT
- `event_time_utc` TEXT
- `raw_payload_json` TEXT
- `source_hash` TEXT UNIQUE
- `created_at` TEXT

Index: `(employee_id, event_time_local)`

### `hr_pos_attendance_events`
- `id` TEXT PK
- `employee_id` TEXT FK
- `branch_id` TEXT FK
- `till_id` TEXT
- `session_id` TEXT
- `event_type` TEXT (`login|logout`)
- `event_time_local` TEXT
- `event_time_utc` TEXT
- `source_hash` TEXT UNIQUE
- `created_at` TEXT

### `hr_attendance_daily`
- `id` TEXT PK
- `employee_id` TEXT FK
- `branch_id` TEXT FK
- `business_date` TEXT
- `shift_template_id` TEXT FK
- `scheduled_start_local` TEXT
- `scheduled_end_local` TEXT
- `actual_in_local` TEXT
- `actual_out_local` TEXT
- `worked_minutes` INTEGER
- `late_minutes` INTEGER
- `early_exit_minutes` INTEGER
- `ot_minutes` INTEGER
- `status` TEXT
- `source_mode` TEXT (`biometric|pos|hybrid|manual`)
- `exception_flags_json` TEXT
- `version_no` INTEGER DEFAULT 1
- `finalized` INTEGER DEFAULT 0
- `finalized_at` TEXT
- `created_at`, `updated_at`

Unique index: `(employee_id, business_date)`

### `hr_attendance_adjustments`
- `id` TEXT PK
- `attendance_daily_id` TEXT FK -> hr_attendance_daily.id
- `adjustment_type` TEXT
- `old_value_json` TEXT
- `new_value_json` TEXT
- `reason_code` TEXT
- `reason_note` TEXT
- `requested_by` TEXT
- `approved_by` TEXT
- `created_at` TEXT

### `hr_policy_configs`
- `id` TEXT PK
- `scope_type` TEXT (`country|legal_entity|branch`)
- `scope_id` TEXT
- `policy_key` TEXT
- `policy_value_json` TEXT
- `effective_from` TEXT
- `effective_to` TEXT
- `is_active` INTEGER
- `created_at`, `updated_at`

### `hr_audit_log`
- `id` TEXT PK
- `entity_type` TEXT
- `entity_id` TEXT
- `action` TEXT
- `actor_id` TEXT
- `actor_role` TEXT
- `before_json` TEXT
- `after_json` TEXT
- `created_at` TEXT

---

## 6) Sprint Backlog (Implementation-Ready)

## Story A — Onboarding Data Model + APIs

**Tasks**
- Add employee extension columns + validations.
- Implement create/update/detail/list endpoints for HR employees.
- Add CNIC masking in response DTO.

**Acceptance**
- Employee create rejects invalid CNIC and missing required fields.
- Duplicate biometric/pos mapping prevented by unique constraints.

## Story B — Attendance Event Ingestion

**Tasks**
- Create biometric devices + biometric events + POS attendance events tables.
- Implement bulk biometric import endpoint with idempotency.
- Implement POS event ingestion hook (from till login/logout).

**Acceptance**
- Re-import same file/events does not duplicate records.
- Unknown enrollment IDs are stored and reported in error summary.

## Story C — Fusion Engine v1

**Tasks**
- Implement deterministic fusion job for date/branch range.
- Persist `hr_attendance_daily` and exception flags.
- Build exception listing endpoint.

**Acceptance**
- Biometric-first priority enforced.
- Missing out / source conflict flags generated correctly.

## Story D — Shift Templates + Weekly Rosters

**Tasks**
- Implement shift template CRUD (create/list minimum for sprint).
- Implement weekly roster publish endpoint.
- Enforce overlap and cutoff validation.

**Acceptance**
- No employee gets overlapping shifts.
- Published roster retrievable by branch/date range.

## Story E — Audit + Regularization

**Tasks**
- Implement attendance regularization endpoint.
- Store immutable adjustment records and audit logs.

**Acceptance**
- Every adjustment captures actor, reason, timestamp.
- Old/new values traceable for compliance review.

---

## 7) Non-Functional Guardrails (Pilot)

- Timezone-safe handling using branch timezone (Asia/Karachi default for PK pilot).
- Idempotent imports for biometric/POS source events.
- PII protection: mask CNIC/mobile in list responses; hash CNIC in storage where feasible.
- Soft-delete / status transitions only; no destructive deletion.
- Daily reconciliation job cutoff: finalize D-1 by 10:00 local.

---

## 8) Risks & Mitigations

- **Biometric device time drift** → drift monitor + anomaly flags.
- **Shared POS credentials** → enforce individual login policy + manager alerts.
- **Roster discipline gaps** → roster publish deadline + cutoff approvals.
- **Data quality at onboarding** → required-field checklist + branch HR validation gate.

---

## 9) Deliverables Checklist (End of Sprint)

- [ ] Migration SQL for HR tables and employee extensions.
- [ ] API routes for employees, shifts, rosters, attendance ingestion/rebuild, regularization.
- [ ] Attendance fusion rule implementation with tests.
- [ ] Pilot configuration entries for PK policy constants.
- [ ] Ops runbook update with exception handling flow.

---

## 10) Next Sprint Preview (Out of Current Scope)

- Leave management module integration.
- Payroll export and statutory reports.
- Geo-fencing for field/mobile staff attendance.
- Employee self-service attendance correction requests.
