# Malaysia (MY) Country Pack — openclaw-pos

> Status: Draft for implementation with legal/tax validation required before production use.
> 
> Scope: Payroll, statutory deductions, labor-policy controls, invoicing/tax reporting, HR/legal templates, GL deltas, and rollout checklist for Malaysia.

---

## 1) Country Profile & Defaults

- **Country code:** `MY`
- **Currency:** `MYR` (RM)
- **Timezone:** `Asia/Kuala_Lumpur` (UTC+8, no DST)
- **Locale:** `ms-MY` (primary), `en-MY` (secondary)
- **Week start:** Monday
- **Common payroll cycle:** Monthly (most common)
- **Recommended default payroll payment date:** Last calendar day of month (or last working day if weekend/public holiday)

### System defaults (proposed)

- Rounding:
  - Payroll: 2 decimals
  - Tax/deductions: per authority rule; default banker’s rounding unless statutory method specifies otherwise
- Date format: `DD/MM/YYYY`
- Working week baseline: `45` hours/week
- Overtime eligibility flag required per employee contract + legal category

---

## 2) Payroll Cadence Norms (Implementation)

## Standard practice

- **Monthly payroll** is dominant in Malaysia.
- Semi-monthly/bi-weekly may be used for specific worker groups but is less common for salaried staff.

## Recommended product configuration

- Support payroll frequencies:
  - `MONTHLY` (default)
  - `SEMI_MONTHLY` (optional)
  - `WEEKLY` (optional for operational/shift workers)
- Mandatory cutoffs per payroll run:
  - Attendance close date
  - Overtime close date
  - Allowance/claim close date
  - New joiner/leaver finalization date
- Payment file output:
  - Bank GIRO transfer file format configurable by bank
  - Payslip generated on pay date

## Cutoff pattern (example)

- Attendance/OT cutoff: 25th
- Payroll calculation: 26th–28th
- Statutory validation: 28th–30th
- Pay date: last day of month

---

## 3) Statutory Payroll / Tax / Social Contribution Placeholders

> Keep rates table-driven and effective-date versioned. Do not hardcode rates in logic.

## 3.1 Core statutory components

1. **PCB/MTD (Potongan Cukai Bulanan)** — monthly tax deduction (LHDN)
2. **EPF/KWSP** — retirement fund contribution (employee + employer)
3. **SOCSO/PERKESO** — social security contribution
4. **EIS/SIP** — employment insurance scheme
5. **HRD Corp Levy** (where applicable by employer category/threshold)
6. **Zakat payroll deduction** (optional, employee-elected and coordination with tax relief)

## 3.2 Data model placeholders

```yaml
statutory_profiles:
  - code: MY_PCB
    authority: LHDN
    calc_basis: progressive_monthly_schedule
    frequency: monthly
    due_day_next_month: 15
    config:
      schedule_version: "TODO"
      category_rules: [resident_status, marital_status, spouse_working_status, children_count]

  - code: MY_EPF
    authority: KWSP
    calc_basis: contribution_table
    frequency: monthly
    due_day_next_month: 15
    config:
      employee_rate_table_version: "TODO"
      employer_rate_table_version: "TODO"
      age_bands: true
      wage_ceiling_rules: "TODO"

  - code: MY_SOCSO
    authority: PERKESO
    calc_basis: contribution_table
    frequency: monthly
    due_day_next_month: 15
    config:
      category: [employment_injury_scheme, invalidity_scheme]
      wage_class_table_version: "TODO"

  - code: MY_EIS
    authority: PERKESO
    calc_basis: contribution_table
    frequency: monthly
    due_day_next_month: 15
    config:
      wage_class_table_version: "TODO"

  - code: MY_HRD_LEVY
    authority: HRD_CORP
    calc_basis: percent_of_wages
    frequency: monthly
    due_day_next_month: 15
    config:
      employer_eligibility_rule: "TODO"
      levy_rate_version: "TODO"
```

## 3.3 Monthly statutory filing checklist (per legal entity)

- [ ] PCB remittance prepared and submitted to LHDN by statutory deadline
- [ ] EPF contribution file generated, reconciled, and paid
- [ ] SOCSO contribution file generated, reconciled, and paid
- [ ] EIS contribution reconciled and paid
- [ ] HRD levy assessed (if applicable) and paid
- [ ] Statutory payment proofs archived
- [ ] Variance report (current vs prior month) reviewed and approved

## 3.4 Annual employer obligations placeholders

- [ ] **Form E** employer annual return prepared/submitted (LHDN) — confirm exact statutory due date each year
- [ ] **EA forms** issued to employees by required deadline
- [ ] Annual payroll reconciliation (gross-to-taxable-to-deducted) completed
- [ ] Year-end archive locked (payslips, filings, proofs)

---

## 4) Labor / Overtime / Holiday Policy Matrix (Configurable Controls)

> Policies vary by Employment Act coverage, contract terms, role seniority, and sector rules. Keep matrix configurable by employee class.

## 4.1 Baseline labor standards (default assumptions)

- Normal hours: up to **45 hours/week**
- Rest day: at least one rest day per week
- Public holiday entitlement: national + state/territory applicable gazetted holidays
- Overtime controls:
  - OT eligibility by employee classification
  - Daily/weekly cap warnings
  - Pre-approval flow for OT claims

## 4.2 Overtime / rest day / public holiday matrix (template)

| Scenario | Default multiplier / pay treatment (template) | System rule |
|---|---:|---|
| OT on normal working day | `1.5x` hourly rate | OT hours > normal daily hours |
| Work on rest day (within normal hours) | Special rest-day day-rate rule | Apply day-rate logic by hours band |
| OT beyond normal hours on rest day | `2.0x` hourly rate | Requires rest-day shift flag |
| Work on public holiday (within normal hours) | Public-holiday day-rate rule (commonly enhanced pay) | Requires holiday calendar tag |
| OT beyond normal hours on public holiday | `3.0x` hourly rate (template) | Holiday + OT condition |

> **Important:** Rest-day and public-holiday pay in Malaysia uses specific day-rate constructs under labor law and may differ by covered employee category/contract. Implement as policy engine rules, not fixed constants.

## 4.3 Leave policy placeholders

- Annual leave entitlement table by years of service
- Sick leave entitlement table by years of service / hospitalization provisions
- Maternity, paternity, and other statutory leaves per latest law
- Unpaid leave types (admin configurable)

## 4.4 Holiday calendar controls

- National holidays (federal)
- State-level holidays by work location
- Replacement holiday rules where applicable
- Holiday versioning by year

---

## 5) Invoice & Tax Report Requirements (POS + Finance)

## 5.1 Indirect tax landscape (implementation notes)

- Malaysia uses **SST** (Sales Tax and Service Tax), not GST/VAT.
- Determine whether entity is:
  - Not registered for SST
  - Registered for Sales Tax
  - Registered for Service Tax
  - Both, where applicable

## 5.2 POS invoice/receipt fields (minimum template)

- Legal entity name + registration number
- Outlet name/address
- Invoice/receipt number (sequential, unique)
- Transaction date/time
- Item lines: description, qty, unit price, discount
- Taxable value and tax amount by tax type/rate
- Grand total
- Payment method(s)
- Cashier/device identifier
- Refund reference (if applicable)

## 5.3 E-Invoicing (MyInvois) readiness

- Maintain capability for:
  - Buyer info capture rules by transaction type/threshold
  - Invoice UUID / validation status storage
  - QR code / validation reference rendering (if required)
  - Retry + exception queue for API failures
  - Credit/debit note linkage
- Rollout should support phased compliance timelines by taxpayer category.

## 5.4 Tax reports checklist

- [ ] Sales summary by tax code/rate
- [ ] Output tax report (service/sales tax where applicable)
- [ ] Exempt/zero-rated classification report (if applicable)
- [ ] Credit/debit note register
- [ ] Void/cancelled transaction audit report
- [ ] Daily Z-report and monthly tax reconciliation

---

## 6) Required Legal / HR Document Templates

> Store templates under `docs/templates/legal/my/` and `docs/templates/hr/my/`.

## 6.1 Employment lifecycle templates

- [ ] Employment contract (permanent)
- [ ] Employment contract (fixed-term)
- [ ] Probation confirmation letter
- [ ] Salary adjustment letter
- [ ] Promotion/transfer letter
- [ ] Working hours & roster policy acknowledgment
- [ ] Overtime policy acknowledgment
- [ ] Employee handbook acknowledgment
- [ ] Confidentiality / IP / data privacy agreement

## 6.2 Payroll/statutory onboarding templates

- [ ] New hire payroll data form
- [ ] Tax declaration form (resident status + relief-related fields)
- [ ] EPF registration/data capture form
- [ ] SOCSO/EIS registration form
- [ ] Bank account authorization form
- [ ] Consent for payslip e-delivery + PDPA notice

## 6.3 Separation templates

- [ ] Resignation acceptance letter
- [ ] Termination letter (cause/non-cause variants with legal review)
- [ ] Final salary checklist
- [ ] Exit clearance form
- [ ] Certificate/confirmation of employment template

---

## 7) GL Mapping Deltas for Malaysia

> Extend core chart-of-accounts mapping with MY-specific statutory liability and expense buckets.

## 7.1 Suggested account additions

- **Liabilities**
  - Payroll Payable
  - PCB Payable (LHDN)
  - EPF Employee Payable
  - EPF Employer Payable
  - SOCSO Employee Payable
  - SOCSO Employer Payable
  - EIS Employee Payable
  - EIS Employer Payable
  - HRD Levy Payable

- **Expenses**
  - Salaries & Wages
  - Employer EPF Expense
  - Employer SOCSO Expense
  - Employer EIS Expense
  - HRD Levy Expense
  - Overtime Expense
  - Public Holiday Premium Expense

- **Tax (Sales/Service)**
  - Output Sales Tax Payable
  - Output Service Tax Payable
  - SST Control / Clearing

## 7.2 Posting map (example)

- Gross payroll:
  - Dr Salaries & Wages
  - Cr Payroll Payable
- Employee deductions recognized:
  - Dr Payroll Payable
  - Cr PCB Payable / EPF Employee / SOCSO Employee / EIS Employee
- Employer burden recognized:
  - Dr Employer EPF/SOCSO/EIS/HRD Expense
  - Cr EPF Employer/SOCSO Employer/EIS Employer/HRD Levy Payable
- Net salary payment:
  - Dr Payroll Payable
  - Cr Bank
- Statutory remittance:
  - Dr respective statutory payable
  - Cr Bank

---

## 8) Rollout Checklist (Implementation-Ready)

## 8.1 Phase 0 — Legal & design sign-off

- [ ] Confirm legal entity profile (Sdn Bhd/branch/etc.)
- [ ] Confirm Employment Act coverage assumptions by employee groups
- [ ] Confirm statutory contribution applicability (EPF/SOCSO/EIS/HRD)
- [ ] Confirm payroll frequency and pay date policy
- [ ] Approve policy matrix (OT, rest day, public holiday, leave)

## 8.2 Phase 1 — System configuration

- [ ] Create `MY` country config package in codebase
- [ ] Add MY holiday calendar service (federal + state)
- [ ] Configure statutory components as versioned tables
- [ ] Configure payroll earning/deduction codes (base, OT, allowances, deductions)
- [ ] Configure SST/e-invoice invoice tax code sets
- [ ] Add MY-specific GL mappings in finance module

## 8.3 Phase 2 — Templates & controls

- [ ] Upload legal/HR templates (contracting, onboarding, separation)
- [ ] Configure approval workflows (OT, payroll variance, statutory filing)
- [ ] Configure document retention policy and audit trail settings

## 8.4 Phase 3 — Testing

- [ ] Unit tests for statutory calculations by salary bands
- [ ] Integration tests: attendance → payroll → payslip → GL
- [ ] Filing simulation tests (EPF/SOCSO/EIS/PCB outputs)
- [ ] UAT with sample employee classes (hourly/salaried/manager)
- [ ] Parallel run (1–2 payroll cycles) against legacy/manual method

## 8.5 Phase 4 — Go-live & stabilization

- [ ] Production sign-off checklist completed
- [ ] First live payroll with hypercare support
- [ ] Statutory payment proof reconciliation completed
- [ ] Post-go-live retrospective and patch list closed

---

## 9) Open Legal/Tax Confirmations (Must Close Before Production)

1. **Employment Act scope**: confirm exact employee categories covered by current threshold/rule set.
2. **Overtime mechanics**: confirm final rest-day and public-holiday computation logic for each employee class.
3. **Current contribution rates/tables**: EPF/SOCSO/EIS/HRD latest effective rates and wage bands.
4. **PCB/MTD calculation method**: confirm latest LHDN schedule version + treatment of relief/tax residency changes.
5. **SST applicability**: confirm whether business activities trigger Sales Tax, Service Tax, both, or none.
6. **Service Tax rate exceptions**: validate applicable rate(s) for the business sector and exemptions.
7. **E-Invoice obligations**: confirm mandated go-live date for taxpayer category and B2C consolidation rules.
8. **Public holiday handling**: confirm state-specific calendars per branch locations and replacement rules.
9. **Document wording**: local counsel review for all employment and termination templates.
10. **Data/privacy compliance**: verify PDPA wording, retention periods, and cross-border transfer clauses.

---

## 10) Suggested Repository Structure

```text
docs/
  country-packs/
    MY.md
  templates/
    legal/
      my/
        employment-contract-permanent.md
        employment-contract-fixed-term.md
        termination-letter-template.md
    hr/
      my/
        new-hire-payroll-form.md
        overtime-consent-acknowledgement.md
        final-payroll-clearance-checklist.md
```

---

## 11) Implementation Notes for Engineering

- Build all statutory rates as **effective-dated configuration**, not code constants.
- Keep a **country rule engine** with per-employee-policy overrides.
- Enforce **idempotent payroll runs** with immutable run snapshots.
- Maintain full **audit logs** for payroll changes, approvals, and filing outputs.
- Add monitoring alerts for:
  - Missed statutory deadlines
  - Significant payroll variance
  - E-invoice submission failures

---

Owner: Payroll + Finance + Legal (MY)
Last updated: 2026-02-26
