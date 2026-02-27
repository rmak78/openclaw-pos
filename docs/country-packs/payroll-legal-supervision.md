# Payroll & Legal Supervision Pack (Pakistan-first, Expansion-ready)

> **Purpose:** Supervision checklist and control framework to assess whether `openclaw-pos` payroll is legally/compliance-ready for Pakistan go-live, while preserving architecture for multi-country rollout.
>
> **Scope:** Payroll engine, HR master, attendance inputs, approvals, posting, payment, statutory reporting, and audit evidence.
>
> **Status:** Supervisory baseline (implementation + legal validation required before production).

---

## 1) Canonical baseline reviewed

The following current documents establish the existing payroll baseline:

- `docs/operations/hris-sprint-v1.md` (PK onboarding + attendance fusion foundations)
- `docs/operations/finops-sprint-v1.md` (PayrollJournal posting baseline)
- `docs/design/key-user-flows.md` (Start run → Validate → Approve → Finalize → Post journal)
- `docs/design/mockups/payroll-run-screen.html` (UI mockup with validation/exceptions)

### 1.1 What is already strong

- PK-first orientation exists in HRIS sprint doc.
- Attendance fusion design is audit-friendly (biometric/POS source hierarchy + exception flags).
- FinOps posting model enforces idempotent event-driven journals.
- Payroll flow includes explicit validation and approval before posting.

---

## 2) Statutory and control gaps (Pakistan-first)

## 2.1 Statutory/legal coverage gaps

1. **No Pakistan payroll country pack** with effective-dated statutory rules and filing calendar.
2. **Income tax withholding (salary)** is modeled as a generic payable account only; no confirmed slab/version governance.
3. **EOBI + Provincial Social Security** applicability exists as booleans in HRIS, but rate tables, wage bases, ceilings, and province-wise authority mapping are missing.
4. **Minimum wage and overtime legal guardrails** are not codified as hard checks by province/legal entity.
5. **Final settlement rules** (notice, leave encashment, gratuity/provident-fund policy mapping, recovery caps) are not defined.
6. **Statutory filing obligations** (monthly/annual payroll tax statements, contribution submissions, payment deadlines, challan/evidence retention) are not mapped to workflow SLAs.
7. **Documented legal interpretations** (counsel-approved memos for ambiguous rules) are not linked to config versions.

## 2.2 Internal-control gaps

1. **Maker-checker segregation** is not explicit for payroll preparation vs approval vs bank release.
2. **Payroll change controls** (cutoff lock, retro controls, reason codes, approval thresholds) are partial.
3. **Exception governance** exists in UI concept, but no risk-ranked triage SLA matrix.
4. **Master data control** lacks enforced dual control for sensitive fields (bank account, salary, tax category, statutory applicability).
5. **Payment reconciliation** is incomplete (accrual journal exists, but settlement/payment event and payroll clearing controls are still open).
6. **Evidence pack per payroll run** is not standardized (inputs snapshot, calc version, approval trail, payment proof, filing proof).
7. **Compliance monitoring KPIs** and escalation thresholds are not defined.

---

## 3) Supervision checklist (go-live gate)

Use this as a mandatory gate before first production payroll in Pakistan.

## A) Governance & legal signoff

- [ ] Appoint named owners: Payroll Ops, Finance Controller, HR Lead, Legal/Tax Counsel.
- [ ] Maintain legal-interpretation register with owner + date + expiry/review date.
- [ ] All statutory parameters are effective-dated and linked to legal memo references.
- [ ] RACI approved for prepare/review/approve/pay/file activities.

## B) Statutory configuration (PK)

- [ ] Salary withholding tax framework configured with slab versioning and effective dates.
- [ ] EOBI contribution rules configured (eligibility, bases, caps, employer/employee splits where applicable).
- [ ] Provincial social security rules configured per branch province and legal entity.
- [ ] Minimum wage validations enabled by worker category/province.
- [ ] Overtime policy configured to legal minimum baseline + company policy uplift rules.
- [ ] Final settlement components configured (earned salary, leave, deductions/recoveries, statutory outputs).

## C) Master data integrity

- [ ] CNIC uniqueness and masking controls active.
- [ ] Bank account and IBAN validation rules active.
- [ ] Mandatory payroll identifiers complete before employee is payable.
- [ ] Sensitive field changes require maker-checker and are fully audited.

## D) Time/attendance to payroll controls

- [ ] Attendance cut-off and payroll cut-off calendars published per legal entity.
- [ ] Attendance exceptions (missing out/source conflict/manual override) resolved or approved before finalization.
- [ ] OT override approvals beyond cap are enforced.
- [ ] Locking prevents attendance edits after payroll lock unless approved retro workflow.

## E) Payroll run controls

- [ ] Draft run snapshot is immutable and reproducible (same inputs -> same outputs).
- [ ] Variance dashboard compares current run vs prior cycle by branch/cost center.
- [ ] Outlier thresholds (e.g., net pay delta %, negative net, large deduction %) trigger hard stop.
- [ ] Final approval requires explicit attestation by authorized role.

## F) Posting, payment, and reconciliation

- [ ] Payroll accrual posting balances and is traceable to run ID.
- [ ] Payment file generation/release uses separate approver from run preparer.
- [ ] Bank confirmation reconciles exactly to net-pay total and employee-level disbursement file.
- [ ] Unpaid/rejected transfers route to exception queue with reissue controls.
- [ ] Payroll payable, withholding payable, EOBI/social-security payable reconciled monthly.

## G) Statutory filing & evidence

- [ ] Filing calendar exists (monthly + annual obligations) with owner and due dates.
- [ ] Return/challan artifacts stored with run linkage and immutable timestamps.
- [ ] Late filing/payment alerts and escalation matrix active.
- [ ] Period-close compliance checklist signed and archived.

## H) Security, privacy, and retention

- [ ] RBAC limits payroll data access to least privilege.
- [ ] Salary and national-ID fields encrypted/masked in UI/log exports.
- [ ] Audit logs immutable and retained per policy.
- [ ] Record-retention schedule defined for payroll, tax, and social-security evidence.

---

## 4) Recommended control design (implementation-ready)

## 4.1 Hard controls (preventive)

- **SoD policy engine:** block same user from prepare + approve + payment release in same run.
- **Effective-dated statutory tables:** block run if no active statutory config for business date.
- **Payroll lock + controlled reopen:** reopen requires reason, approver, and full audit trail.
- **Critical field change approval:** salary, tax category, bank account, statutory flags require second approver.
- **Compliance blocker rules:** if unresolved high-risk exceptions > threshold, prevent finalization.

## 4.2 Detective controls

- **Run-to-run anomaly report:** net pay shifts, headcount drift, deduction spikes.
- **Statutory payable tie-out:** run totals vs GL vs filed amounts.
- **Aging dashboard:** unpaid payroll, pending filings, unresolved exceptions.
- **Access review:** monthly payroll role review and dormant privileged account cleanup.

## 4.3 Corrective controls

- **Controlled off-cycle run process** for reversals/adjustments with explicit reason taxonomy.
- **Restatement protocol:** amendment journal + superseding payslip + employee notification log.
- **Incident playbook:** missed payroll, wrong deduction, late filing escalation paths.

---

## 5) Expansion readiness (multi-country architecture)

Adopt a country-pack pattern for payroll controls:

- `config/countries/<CC>/payroll-rules.vX.json` for statutory parameters
- `config/countries/<CC>/filing-calendar.vX.json` for deadlines and owners
- `docs/country-packs/<CC>.md` for legal assumptions and open confirmations

Required platform behavior:

- Country/legal-entity scoping for all policies
- Effective-dated config versioning
- Feature flags per country (`pit_enabled`, `social_security_enabled`, `eos_enabled`, etc.)
- Country-specific templates for payslip, final settlement, and statutory exports

---

## 6) 30-60-90 day supervision plan

## First 30 days (pre-go-live PK)

- Close all statutory `TBD`s for PK with counsel signoff.
- Implement SoD and payroll-lock controls.
- Implement payment event + bank reconciliation flow.
- Publish filing calendar and escalation matrix.

## Day 31-60 (stabilization)

- Run parallel payroll cycles and variance analytics.
- Validate statutory returns/challan evidence chain end-to-end.
- Tune exception thresholds and SLA ownership.

## Day 61-90 (expansion-ready baseline)

- Extract reusable country-pack schema and templates.
- Pilot second-country dry-run config in non-production.
- Implement regression suite for country-specific payroll rule changes.

---

## 7) Minimum go-live evidence pack (per payroll cycle)

- Input snapshot hash (attendance, master data, config version)
- Calculation result bundle (gross/net/deductions by employee)
- Approval log (who/when/role)
- GL posting proof (journal IDs, balanced status)
- Payment proof (bank file hash + confirmation)
- Statutory filing proof (submission ID/challan/reference)
- Exception register with closure notes

---

## 8) Final supervisory note

This document is a compliance supervision blueprint, not legal advice. Pakistan payroll/tax/labor obligations must be validated by qualified local legal/tax/payroll professionals before production use.
