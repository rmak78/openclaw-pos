# Country Pack: Qatar (QA)

> **Status:** Draft for implementation planning  
> **Last updated:** 2026-02-26  
> **Scope:** Payroll + HR + finance/tax localization requirements for `openclaw-pos` rollout in Qatar.

---

## 1) Country Profile (QA)

- **ISO country code:** QA
- **Currency:** QAR (Qatari Riyal)
- **Currency precision:** 2 decimals
- **Week start (typical):** Sunday
- **Weekend (common private sector):** Friday/Saturday (confirm per employer policy)
- **Time zone:** Asia/Qatar (UTC+3)
- **Official language for legal docs:** Arabic (English bilingual copies often used operationally)

### Implementation checklist

- [ ] QA country entity created in master data.
- [ ] QAR configured as base currency for QA entities.
- [ ] Locale/date/number formats validated for QA users.
- [ ] Arabic/English template strategy agreed (legal-first Arabic).

---

## 2) Payroll Cadence Norms (Qatar)

## Recommended default setup

- **Primary payroll frequency:** Monthly
- **Suggested pay date:** Last working day of month (or fixed day, e.g., 28th)
- **Payroll period:** Calendar month
- **Overtime cut-off:** Configurable (e.g., 25th to month-end lock)
- **Final settlement cycle:** Off-cycle payroll run (upon termination/resignation)

## Wage Protection System (WPS) handling

- Salary payments are generally expected through bank/WPS-compatible process.
- Payroll file output should support **bank/WPS transfer format mapping**.

### System fields to enable

- [ ] Payroll calendar profile: `QA_MONTHLY`
- [ ] Pay cycle lock date + approval workflow
- [ ] WPS export profile (bank format version placeholder)
- [ ] Final settlement run type (`QA_FINAL_SETTLEMENT`)

### Open legal confirmations

- [ ] Confirm exact pay deadline rule (day-of-month tolerance and grace period).
- [ ] Confirm WPS file schema per bank/provider used by client.
- [ ] Confirm penalties/escalation workflow for late salary transfers.

---

## 3) Statutory Payroll / Tax / Social Contribution Placeholders

> Qatar has no broad personal income tax withholding for standard employment payroll in most cases; however, statutory obligations vary by worker category, nationality, and sponsor setup. Keep values configurable and confirm with local advisor.

## Statutory components matrix (configure as parameterized rules)

| Component | Default placeholder | Employee share | Employer share | Basis | Frequency | Notes |
|---|---:|---:|---:|---|---|---|
| Personal income tax withholding | 0% | 0% | 0% | Taxable wage | Monthly | Confirm edge cases for non-standard arrangements. |
| Social insurance (Qatari nationals) | `TBD_QA_GOSI_EMP` | `TBD` | `TBD` | Basic/Gross (TBD) | Monthly | Confirm applicability and rate splits by law updates. |
| Social insurance (non-Qatari) | 0% (typical) | 0% | 0% | N/A | Monthly | Confirm if any sector-specific mandatory schemes apply. |
| End-of-service benefit (EOSB) accrual | `TBD_QA_EOSB_RATE` | 0% | `TBD` | Eligible wage | Monthly accrual / exit payout | Not a tax; statutory labor liability. |
| Work injury / mandatory insurance | `TBD_QA_WORK_INJ` | 0% | `TBD` | Payroll/gross (TBD) | Monthly/annual | Confirm insurance policy + accounting method. |
| Other statutory deductions | `TBD` | `TBD` | `TBD` | Rule-based | Monthly | Placeholder for sector/employer-specific obligations. |

### Required payroll engine configuration

- [ ] Rule set `QA_PAYROLL_V1` created.
- [ ] Statutory parameters stored in effective-dated config (not hardcoded).
- [ ] Nationality-based contribution logic supported.
- [ ] EOSB accrual ledger and payout logic enabled.
- [ ] Off-cycle adjustments + retro payroll supported.

### Open legal confirmations

- [ ] Confirm social insurance authority/rates and wage caps (if any).
- [ ] Confirm EOSB formula details (base wage definition, service bands, exclusions).
- [ ] Confirm treatment of unpaid leave/absence on statutory calculations.

---

## 4) Labor / Overtime / Holiday Policy Matrix (Qatar)

> Use this as implementation matrix; final values must be approved by local labor counsel and client HR policy.

| Policy area | Baseline configuration in system | Placeholder parameter(s) | Compliance status |
|---|---|---|---|
| Standard working hours | `QA_STD_HOURS_PER_WEEK = 48` (common baseline) | `QA_STD_HOURS_PER_DAY`, `QA_STD_HOURS_PER_WEEK` | ⚠ Confirm |
| Ramadan working hours | Reduced schedule profile enabled | `QA_RAMADAN_HOURS_RULE` | ⚠ Confirm |
| Weekly rest day | 1 rest day minimum profile | `QA_WEEKLY_REST_DAY` | ⚠ Confirm |
| Overtime multiplier (normal day) | OT engine enabled | `QA_OT_RATE_NORMAL` | ⚠ Confirm |
| Overtime multiplier (rest day) | OT type `REST_DAY_OT` | `QA_OT_RATE_RESTDAY` | ⚠ Confirm |
| Overtime multiplier (public holiday) | OT type `HOLIDAY_OT` | `QA_OT_RATE_HOLIDAY` | ⚠ Confirm |
| Public holidays calendar | QA holiday calendar source | `QA_HOLIDAY_CALENDAR_ID` | ⚠ Confirm |
| Annual leave entitlement | Leave policy by grade/tenure | `QA_ANNUAL_LEAVE_DAYS` | ⚠ Confirm |
| Sick leave policy | Multi-stage paid/unpaid bands | `QA_SICK_LEAVE_BANDS` | ⚠ Confirm |
| Maternity/paternity leave | Leave types configured | `QA_MATERNITY_RULE`, `QA_PATERNITY_RULE` | ⚠ Confirm |
| Wage during leave | Payroll leave earning rules | `QA_LEAVE_PAY_METHOD` | ⚠ Confirm |
| Termination notice/pay in lieu | Separation workflow fields | `QA_NOTICE_RULES` | ⚠ Confirm |

### Implementation checklist

- [ ] Attendance-to-payroll mapping includes regular, OT, rest-day OT, holiday OT.
- [ ] Ramadan calendar period supports automatic hours rule switch.
- [ ] Leave accrual and encashment rules linked to payroll items.
- [ ] Final settlement includes EOSB + leave balance + deductions.

### Open legal confirmations

- [ ] Validate current legal max daily/weekly hours and exceptions.
- [ ] Validate overtime multipliers for each day type and time window.
- [ ] Validate public holiday eligibility/pay treatment for shift workers.
- [ ] Validate leave carry-forward/forfeiture constraints.

---

## 5) Invoice / Tax Report Requirements (Qatar)

> Qatar does not currently operate broad VAT in the same way as VAT-enabled GCC countries (subject to future policy changes). Keep tax engine modular and versioned.

## Invoice requirements baseline

- Sequential invoice numbering (immutable once posted)
- Issue date/time, seller legal name, address, registration identifiers
- Customer details per B2B/B2C policy
- Line-level amounts, discounts, net totals
- Tax section with explicit rate and amount (including zero-rated/non-taxable explanation code)
- Currency shown in QAR
- Credit note/debit note linkage to original invoice

### Tax reporting packs (placeholder)

- **If no VAT active:**
  - Sales register
  - Credit/debit note register
  - Daily summary by branch/till/payment method
- **If VAT or similar indirect tax activates in future:**
  - Taxable supplies by rate bucket
  - Output tax summary
  - Adjustments and corrections log
  - Exportable statutory return schema (`QA_TAX_RETURN_Vx`)

### Implementation checklist

- [ ] Tax code set includes `QA_TAX_EXEMPT`, `QA_ZERO`, `QA_STANDARD_TBD` (future-proof).
- [ ] Invoice template supports Arabic + English bilingual output option.
- [ ] Credit note reversal logic validated in GL and reports.
- [ ] Posted invoice audit trail is immutable and timestamped.

### Open legal confirmations

- [ ] Confirm mandatory invoice fields for current regime and sector.
- [ ] Confirm e-invoicing/QR or digital signature obligations (if any by sector).
- [ ] Confirm archival/retention duration and acceptable storage format.

---

## 6) Required Legal / HR Document Templates

> Store under `docs/templates/legal/qa/` and map each to an approval owner.

## Core templates (minimum)

1. **Employment Offer Letter (QA)**
2. **Employment Contract (Arabic/English bilingual)**
3. **Employee Data Consent / Privacy Notice**
4. **Job Description / Role Assignment Letter**
5. **Compensation & Benefits Annex**
6. **Overtime Approval Form**
7. **Leave Request & Approval Form**
8. **Disciplinary Notice Template**
9. **Termination / Resignation Acceptance Letter**
10. **Final Settlement Statement (EOSB + balances)**
11. **Salary Certificate / No Objection Certificate (as needed)**
12. **WPS Bank Transfer Authorization / Payroll Release Approval**

### Template control checklist

- [ ] Each template has version, owner, and legal approval date.
- [ ] Arabic legal text validated against English operational translation.
- [ ] E-signature or wet-sign process defined per document class.
- [ ] Retention policy tagged on each template.

### Open legal confirmations

- [ ] Confirm mandatory clauses required in contract for enforceability.
- [ ] Confirm whether Arabic text must prevail clause is required.
- [ ] Confirm notarization/attestation requirements for specific documents.

---

## 7) GL Mapping Deltas for QA Localization

> Extend existing global chart-of-accounts mapping with QA-specific statutory and settlement buckets.

## New/adjusted account mappings (proposed)

| Domain | Suggested account key | Type | Direction | Notes |
|---|---|---|---|---|
| Payroll gross expense | `6100-QA-PAYROLL-GROSS` | P&L Expense | Dr | Base salary + allowances |
| Overtime expense | `6110-QA-OT-EXP` | P&L Expense | Dr | Split normal/rest/holiday if needed |
| Leave salary expense | `6120-QA-LEAVE-EXP` | P&L Expense | Dr | Paid leave accrual/use |
| EOSB expense | `6130-QA-EOSB-EXP` | P&L Expense | Dr | Periodic accrual |
| EOSB liability | `2130-QA-EOSB-LIAB` | Balance Sheet Liability | Cr | Settlement on exit |
| Social contribution expense (employer) | `6140-QA-SOC-ER-EXP` | P&L Expense | Dr | If applicable |
| Social contribution payable | `2140-QA-SOC-PAYABLE` | Balance Sheet Liability | Cr | If applicable |
| Employee deductions payable | `2150-QA-EMP-DED-PAY` | Balance Sheet Liability | Cr | Loans/fines/other legal deductions |
| Wages payable | `2160-QA-WAGES-PAYABLE` | Balance Sheet Liability | Cr | Payroll net payable pre-disbursement |
| Bank payroll clearing | `1115-QA-PAYROLL-CLEARING` | Balance Sheet Asset | Dr/Cr | For WPS file reconciliation |
| Payroll variance/suspense | `2190-QA-PAYROLL-SUSPENSE` | Balance Sheet Liability | Cr | Temporary unresolved differences |

### Mapping checklist

- [ ] Branch/entity-level default GL map assigned for QA.
- [ ] Payroll journal posting tested for regular + off-cycle + reversal.
- [ ] WPS clearing reconciliation report tied to bank statement import.
- [ ] EOSB accrual roll-forward report agrees to GL.

### Open finance confirmations

- [ ] Confirm account numbering conventions with group finance.
- [ ] Confirm whether EOSB is booked monthly or actuarial/annual adjustment.
- [ ] Confirm dimension tags (branch, department, cost center, project).

---

## 8) Rollout Checklist (Implementation-Ready)

## Phase A — Discovery & Legal Sign-off

- [ ] Assign local legal counsel + payroll provider + finance owner.
- [ ] Validate all **Open legal confirmations** in this document.
- [ ] Freeze `QA_PAYROLL_V1` statutory parameter set with effective date.
- [ ] Approve QA document template pack (legal + HR + finance).

## Phase B — Product Configuration

- [ ] Configure QA locale/currency/calendar/holidays.
- [ ] Configure payroll items, earnings, deductions, EOSB, and contributions.
- [ ] Configure attendance and OT policy matrix.
- [ ] Configure invoice templates and tax code placeholders.
- [ ] Configure QA GL mapping and journal posting rules.

## Phase C — Integration & Data

- [ ] Employee master fields include IDs required for payroll/WPS.
- [ ] Bank/WPS export connector implemented and UAT-tested.
- [ ] Accounting export/import mapping tested in finance sandbox.
- [ ] Historical opening balances (EOSB, leave liabilities) loaded.

## Phase D — UAT

- [ ] Test scenarios: regular payroll, OT, leave, unpaid leave, deduction, final settlement.
- [ ] Test invoice lifecycle: issue, void (if allowed), credit note, report extraction.
- [ ] Test month-close: payroll posting, reconciliation, variance handling.
- [ ] Run parallel payroll for at least 1 cycle against incumbent process.

## Phase E — Go-live & Hypercare

- [ ] Go-live decision signed (HR, Legal, Finance, Operations).
- [ ] Cutover runbook executed with rollback criteria documented.
- [ ] Hypercare dashboard active (first 2 payroll cycles minimum).
- [ ] Defect triage SLA agreed with owners.

## Exit criteria

- [ ] Zero critical compliance gaps open.
- [ ] Payroll-to-bank reconciliation variance = 0 (or approved documented residual).
- [ ] GL postings balanced and finance signed off.
- [ ] Statutory reports generated successfully from production data.

---

## 9) Open Legal Confirmations Register (Must Close Before Production)

| ID | Topic | Owner | Due date | Status | Evidence link |
|---|---|---|---|---|---|
| QA-LC-01 | Payroll payment deadline and WPS obligations | Legal + Payroll | TBD | Open | TBD |
| QA-LC-02 | Social insurance applicability/rates/caps by employee type | Legal + Payroll | TBD | Open | TBD |
| QA-LC-03 | EOSB formula, accrual method, and payout triggers | Legal + HR | TBD | Open | TBD |
| QA-LC-04 | Overtime multipliers + Ramadan work-hour adjustments | Legal + HR Ops | TBD | Open | TBD |
| QA-LC-05 | Public holiday pay/comp-off treatment | Legal + HR Ops | TBD | Open | TBD |
| QA-LC-06 | Invoice mandatory fields + bilingual/legal format | Tax/Legal + Finance | TBD | Open | TBD |
| QA-LC-07 | Indirect tax regime applicability (current + future-proofing) | Tax + Finance | TBD | Open | TBD |
| QA-LC-08 | Document retention, archival, and evidentiary requirements | Legal + IT | TBD | Open | TBD |
| QA-LC-09 | Contract language precedence and attestation requirements | Legal + HR | TBD | Open | TBD |
| QA-LC-10 | Payroll journal/account treatment policy (EOSB, provisions, clearing) | Finance Controller | TBD | Open | TBD |

---

## 10) Engineering Notes (for `openclaw-pos`)

- Keep country logic in **config tables + rule engine**, not code constants.
- Use effective-dated versioning (`QA_PAYROLL_V1`, `QA_PAYROLL_V2`) for legal changes.
- Implement nationality/contract-type conditional rules via policy matrix.
- Ensure all statutory outputs are reproducible with audit metadata (rule version + timestamp + approver).
- Add automated test suite for QA payroll regression scenarios before go-live.

### Suggested artifacts

- `config/countries/QA/payroll-rules.v1.json`
- `config/countries/QA/leave-policy.v1.json`
- `config/countries/QA/tax-codes.v1.json`
- `config/countries/QA/gl-mapping.v1.json`
- `docs/templates/legal/qa/*`

---

## Disclaimer

This pack is an implementation blueprint, **not legal advice**. All `TBD` and open legal confirmations must be closed with qualified Qatar labor/tax counsel and the client’s appointed payroll/tax providers before production use.
