# Singapore (SG) Country Pack — openclaw-pos

> **Purpose:** Implementation-ready baseline for payroll, compliance, invoicing, and finance setup for Singapore entities/branches.
>
> **Status:** Draft for legal/payroll advisor confirmation before production use.
>
> **Last updated:** 2026-02-26

---

## 1) Country Setup Snapshot

- **Country/ISO:** Singapore / `SG`
- **Currency:** Singapore Dollar (`SGD`)
- **Locale defaults:** `en-SG`
- **Timezone:** `Asia/Singapore`
- **Week start:** Monday
- **Public holiday model:** National gazetted public holidays (MOM/MOF list, annual)
- **Tax authority:** IRAS (Inland Revenue Authority of Singapore)
- **Labor authority:** MOM (Ministry of Manpower)
- **Social security body:** CPF Board

### Implementation Checklist

- [ ] Set country code, currency, timezone, locale in tenant bootstrap.
- [ ] Add SG public holiday calendar feed/versioning by year.
- [ ] Configure SG payment rails in AP/Payroll disbursement module (GIRO/FAST as applicable).
- [ ] Register authority account identifiers:
  - [ ] CPF Submission Number (CSN)
  - [ ] IRAS UEN tax references / GST number (if GST-registered)
  - [ ] Skills Development Levy account details

---

## 2) Payroll Cadence Norms (Singapore)

### Market/Operational Norms

- **Most common payroll cycle:** Monthly.
- **Pay date norm:** Last calendar day of month or fixed day (e.g., 25th/26th).
- **Statutory salary payment timing:** Salary generally must be paid within statutory timelines under Employment Act (typically within 7 days after salary period end; overtime pay within 14 days after salary period end).

### Recommended Default for openclaw-pos

- **Payroll frequency:** Monthly
- **Cutoff date:** Last day of month
- **Regular pay date:** Last business day of month
- **Overtime payment treatment:** Included in same-month run where cutoff allows; else paid in next run with clear earnings period tag.

### Payroll Cycle Checklist

- [ ] Define payroll calendar for full year (12 cycles).
- [ ] Configure cutoffs for attendance/OT/allowances.
- [ ] Configure lock date for payroll adjustments.
- [ ] Configure maker-checker approvals (HR → Finance → Final approver).
- [ ] Configure reversal/off-cycle workflow.

---

## 3) Statutory Payroll / Tax / Social Contributions (Placeholders)

> Use this section to map system components. Rates/thresholds must be maintained via versioned config and validated each year.

## 3.1 Mandatory / Typical Statutory Elements

1. **CPF (Central Provident Fund)**
   - Employer contribution: rate depends on employee age/residency wage bands.
   - Employee contribution: rate depends on employee age/residency wage bands.
   - Wage concepts: Ordinary Wages (OW) and Additional Wages (AW), with applicable ceilings.
   - Submission/payment: monthly.

2. **SDL (Skills Development Levy)**
   - Common formula baseline in operations: percentage of monthly remuneration with min/max caps per employee.
   - Submission/payment: commonly together with CPF process.

3. **SHG (Self-Help Group) contributions**
   - Employee deductions may apply by community scheme rules (e.g., CDAC, ECF, MBMF, SINDA) where applicable.
   - Must support opt-out/waiver flags where regulations permit.

4. **IR8A / Appendix filings (annual employment income reporting)**
   - Annual employer submission to IRAS (direct or via AIS integration if enrolled).

5. **GST (if entity is GST-registered)**
   - Current standard GST rate should be parameterized (do not hardcode in code).
   - Return filing (F5/F8 etc.) depends on filing cycle assigned by IRAS.

## 3.2 Data Model Requirements (Statutory)

- **Employee master flags**
  - [ ] Residency / CPF eligibility category
  - [ ] Date of birth (for age-banded contribution logic)
  - [ ] SHG category + opt-out docs
  - [ ] Tax residency flags for annual reporting

- **Payroll engine parameters**
  - [ ] `cpf_rate_table_version`
  - [ ] `cpf_ow_ceiling`
  - [ ] `cpf_aw_ceiling_formula`
  - [ ] `sdl_rate`
  - [ ] `sdl_min_per_employee`
  - [ ] `sdl_max_per_employee`
  - [ ] `shg_rules_version`

- **Compliance outputs**
  - [ ] CPF contribution file/export format
  - [ ] SDL summary
  - [ ] SHG deduction report
  - [ ] IR8A/AIS annual export set

## 3.3 Submission & Due-Date Placeholder Table

| Obligation | Frequency | Typical Due Timing | System Owner | Status |
|---|---|---|---|---|
| CPF contributions | Monthly | By statutory monthly due date (commonly by 14th of following month for e-submission/payment) | Payroll | [ ] Confirm |
| SDL payment | Monthly | Align with CPF cycle | Payroll/Finance | [ ] Confirm |
| SHG remittance | Monthly | Align with CPF remittance process | Payroll | [ ] Confirm |
| IR8A/AIS submission | Annual | By statutory annual deadline (commonly 1 Mar) | HR/Payroll | [ ] Confirm |
| GST return (if registered) | Periodic | By IRAS-assigned filing deadline (typically 1 month after period) | Finance/Tax | [ ] Confirm |

---

## 4) Labor, Overtime, Holiday Policy Matrix

> Baseline matrix for configuration. Must be validated against current Employment Act scope and employment contracts/CBA.

| Policy Area | Baseline SG Rule (Operational) | System Configuration Requirement | Legal Confirmation |
|---|---|---|---|
| Standard hours | Commonly up to 44 hours/week for Part IV-covered employees | Work schedule templates, threshold rules | [ ] |
| Overtime trigger | Beyond contractual/Part IV standard hours | OT eligibility by employee class | [ ] |
| Overtime rate | Common baseline: 1.5x hourly basic rate for eligible employees | Earnings code `OT150`, rate engine | [ ] |
| OT cap | Common statutory cap: 72 OT hours/month (unless approved exception) | Hard/soft cap with approval override | [ ] |
| Rest day pay | Enhanced rates for rest-day work based on duration/rules | Rest-day work code + formula set | [ ] |
| Public holiday pay | Paid holiday entitlement; premium/alternative pay if required to work | PH calendar + PH work premium rule | [ ] |
| Salary payment timing | Salary and OT payment deadlines set by law | Payroll close compliance alerting | [ ] |
| Annual leave | Statutory minimum with service-based progression | Leave accrual matrix by service length | [ ] |
| Sick leave | Statutory outpatient/hospitalization leave eligibility | Leave type rules + medical cert requirement | [ ] |
| Maternity/Paternity/Childcare leave | Governed by statutory eligibility + citizenship criteria + policy | Leave policy profiles; entitlement calculators | [ ] |
| Notice/termination pay | Based on contract/minimum standards | Final pay checklist + proration + deductions controls | [ ] |

### Labor Policy Implementation Checklist

- [ ] Build employee category framework:
  - [ ] Part IV-covered workman
  - [ ] Part IV-covered non-workman
  - [ ] Manager/executive (non-Part IV overtime rule set)
- [ ] Configure overtime eligibility at contract level.
- [ ] Configure public holiday work scenarios:
  - [ ] Not worked
  - [ ] Worked with substitute day
  - [ ] Worked with premium pay
- [ ] Configure final pay process for resignation/termination with statutory timeline alerts.
- [ ] Enable audit logs for policy overrides (who/when/why).

---

## 5) Invoice, GST, and Tax Report Requirements

## 5.1 Invoice Requirements (GST-Registered Entity)

### Tax Invoice (B2B) minimum fields

- [ ] Supplier legal name
- [ ] UEN
- [ ] GST registration number
- [ ] Invoice number (unique, sequential policy)
- [ ] Invoice date
- [ ] Customer name/address (and GST no. where required)
- [ ] Description of goods/services
- [ ] Quantity/unit price
- [ ] Pre-tax amount
- [ ] GST rate applied
- [ ] GST amount
- [ ] Total amount payable (SGD)

### Simplified invoice/receipt scenarios

- [ ] Rules by amount threshold and transaction type
- [ ] POS receipt template with GST-inclusive/exclusive clarity

## 5.2 GST Configuration Checklist

- [ ] Parameterize GST rate table by effective date.
- [ ] Configure tax codes:
  - [ ] Standard-rated supplies
  - [ ] Zero-rated supplies
  - [ ] Exempt supplies
  - [ ] Out-of-scope / non-taxable
- [ ] Configure purchase tax codes for input tax tracking.
- [ ] Configure bad debt relief / credit note workflow where applicable.
- [ ] Configure debit/credit note links to original invoice.

## 5.3 Tax Reporting Outputs

- [ ] GST return extract pack (F5/F8-ready mapping workbook).
- [ ] Output tax by code and period.
- [ ] Input tax by code and recoverability status.
- [ ] Box-level trial mapping sheet (for finance review).
- [ ] Audit file retention index and source document linkage.

---

## 6) Required Legal / HR Document Templates (SG)

> Store under `docs/templates/hr/sg/` and `docs/templates/legal/sg/`.

## 6.1 Core Employment Documents

- [ ] Employment Agreement (full-time)
- [ ] Employment Agreement (part-time)
- [ ] Key Employment Terms (KET) acknowledgment
- [ ] Probation confirmation/extension letter
- [ ] Salary adjustment letter
- [ ] Promotion/transfer letter
- [ ] Working hours & OT policy acknowledgment
- [ ] Employee handbook acknowledgment

## 6.2 Leave / Benefits / Claims

- [ ] Leave policy (annual, sick, hospitalization, parental categories)
- [ ] Medical certificate submission SOP
- [ ] Expense/claims policy
- [ ] Benefits enrollment/change forms

## 6.3 Payroll & Tax Consent/Declarations

- [ ] CPF/SHG declaration forms (as applicable)
- [ ] Bank account salary credit authorization
- [ ] Personal data consent (PDPA compliant)
- [ ] IRAS annual income reporting notice/consent language (if needed by policy)

## 6.4 Separation/Offboarding

- [ ] Resignation acknowledgment
- [ ] Termination letter templates (with cause/no cause legal review)
- [ ] Final dues settlement statement
- [ ] Exit clearance checklist
- [ ] Certificate of service/employment letter

## 6.5 Document Control Checklist

- [ ] Legal owner assigned for each template.
- [ ] Version number + effective date in footer.
- [ ] Bilingual variants if required by workforce profile.
- [ ] E-sign workflow and retention period configured.

---

## 7) GL Mapping Deltas (Singapore Localization)

> Deltas from global CoA; account numbers illustrative.

| Area | Suggested GL Account | Type | Notes |
|---|---|---|---|
| CPF Employer Expense | `5xxx-CPF-ER-EXP` | Expense | Employer CPF cost |
| CPF Employee Payable | `2xxx-CPF-EE-PAY` | Liability | Employee CPF withheld |
| CPF Employer Payable | `2xxx-CPF-ER-PAY` | Liability | Employer CPF payable |
| SDL Expense | `5xxx-SDL-EXP` | Expense | Employer levy expense |
| SDL Payable | `2xxx-SDL-PAY` | Liability | Levy payable |
| SHG Deductions Payable | `2xxx-SHG-PAY` | Liability | Employee deductions payable |
| Salaries Payable | `2xxx-PAYROLL-NET` | Liability | Net payroll payable |
| GST Output Tax | `2xxx-GST-OUTPUT` | Liability | Collected GST |
| GST Input Tax Recoverable | `1xxx-GST-INPUT` | Asset | Recoverable GST |
| GST Suspense / Rounding | `2xxx-GST-SUSPENSE` | Liability/Contra | Reconciliation control |

### Posting Rules Checklist

- [ ] Payroll journal splits employer vs employee statutory components.
- [ ] Auto-reversal support for payroll accruals.
- [ ] Separate dimensions: branch, cost center, department.
- [ ] GST code required on revenue/AP lines where applicable.
- [ ] Monthly reconciliation pack includes:
  - [ ] CPF/SDL/SHG payable tie-out to filed amounts
  - [ ] GST control account tie-out to return draft

---

## 8) Rollout Checklist (Implementation-Ready)

## Phase A — Discovery & Legal Validation

- [ ] Appoint SG legal/payroll advisor.
- [ ] Confirm employing entity type, UEN, and registration status.
- [ ] Confirm Employment Act scope by worker categories.
- [ ] Confirm current-year CPF/SDL/SHG rates/ceilings and exceptions.
- [ ] Confirm GST registration status and filing frequency.

## Phase B — System Configuration

- [ ] Create SG country config package (`SG-vYYYY.MM`).
- [ ] Load payroll component catalog:
  - [ ] Base salary
  - [ ] OT
  - [ ] Allowances
  - [ ] Bonuses/AW
  - [ ] CPF/SDL/SHG items
- [ ] Configure leave entitlement policies and holiday calendar.
- [ ] Configure invoice and tax code master.
- [ ] Configure SG-specific GL mappings.

## Phase C — Integration & Outputs

- [ ] Build statutory file outputs (CPF/annual income reporting/GST extracts).
- [ ] Build bank payment export format for salary disbursement.
- [ ] Enable document generation templates (contracts, letters, payslips, tax invoices).

## Phase D — Testing (UAT + Parallel Run)

- [ ] Unit test statutory calculations by employee archetype.
- [ ] Test OT edge cases (caps, eligibility, rest day/public holiday).
- [ ] Test joiner/leaver prorations and final settlement.
- [ ] Test GST transactions (standard/zero/exempt/out-of-scope).
- [ ] Run at least 2 parallel payroll cycles vs incumbent process.
- [ ] Sign off by HR, Finance, and Compliance.

## Phase E — Go-Live & Control

- [ ] Freeze config version and tag release.
- [ ] Train payroll operators and branch finance users.
- [ ] Publish runbook with submission calendar and backup owner.
- [ ] Monitor first 3 cycles with daily issue log and post-mortem.

---

## 9) Open Legal Confirmations (Must Close Before Production)

> Track with owner and due date in implementation board.

| Item | Question to Confirm | Owner | Due Date | Status |
|---|---|---|---|---|
| CPF applicability | Exact CPF eligibility rules for each worker group in our workforce mix (citizen/PR/others) | Legal + Payroll Vendor |  | [ ] |
| CPF rate tables | Current statutory rates by age/wage bands and transition schedules | Payroll Vendor |  | [ ] |
| OW/AW ceilings | Exact ceiling logic and annual reset handling | Payroll Vendor |  | [ ] |
| SDL formula | Current levy %, min/max and edge-case treatment | Payroll Vendor |  | [ ] |
| SHG handling | Mandatory groups, deduction rates, waiver/opt-out process | HR + Payroll Vendor |  | [ ] |
| Employment Act scope | Final employee category mapping to Part IV and overtime obligations | Legal |  | [ ] |
| Public holiday work pay | Correct premium/substitution interpretation for each category | Legal |  | [ ] |
| Leave entitlements | Statutory + company policy overlays (maternity/paternity/childcare) | HR + Legal |  | [ ] |
| IR8A/AIS obligations | Filing method, data fields, and annual timetable | Tax |  | [ ] |
| GST invoicing | Exact invoice content/retention rules by transaction type | Tax |  | [ ] |
| GST reporting | F5 box mapping and special schemes applicability | Tax |  | [ ] |
| Record retention | Retention period and acceptable digital archive controls | Legal + Finance |  | [ ] |

---

## 10) Recommended Config Keys (for `country-config/SG`)

```yaml
country: SG
currency: SGD
timezone: Asia/Singapore
locale: en-SG

payroll:
  frequency: monthly
  pay_day_rule: last_business_day
  salary_payment_deadline_days_after_period: 7
  overtime_payment_deadline_days_after_period: 14
  contributions:
    cpf:
      enabled: true
      rate_table_version: "TBD"
      ow_ceiling: "TBD"
      aw_ceiling_rule: "TBD"
    sdl:
      enabled: true
      rate: "TBD"
      min_per_employee: "TBD"
      max_per_employee: "TBD"
    shg:
      enabled: true
      rules_version: "TBD"

labor:
  standard_weekly_hours: 44
  overtime:
    cap_hours_per_month: 72
    default_multiplier: 1.5

tax:
  gst:
    registered: "TBD"
    rate_table_version: "TBD"
    return_frequency: "TBD"
    filing_due_days_after_period: 30
```

---

## 11) Handover Notes for Engineering + Ops

- Keep all SG statutory rates and thresholds in **data-driven config**, not hardcoded business logic.
- Use **effective-dated versioning** for every statutory table.
- Enforce **dual control** (maker/checker) on any statutory parameter change.
- Produce **traceable audit artifacts** per payroll run (inputs, calc snapshots, outputs, approvals).
- Add automated compliance reminders for monthly/annual due dates.

---

**End of SG country pack (draft).**
