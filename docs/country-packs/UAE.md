# UAE Country Pack (Implementation-Ready Draft)

> **Purpose:** Configure `openclaw-pos` for United Arab Emirates operations (retail/POS + back-office payroll/finance baseline).  
> **Status:** Draft for implementation with **legal/tax confirmation required** before production use.

---

## 1) Country Snapshot

- **Country:** United Arab Emirates (UAE)
- **Currency:** AED (UAE Dirham)
- **Standard precision:** 2 decimals
- **Week model (common private sector):** Monday-Friday work week in many entities; some operate 6-day weeks by contract/policy
- **Weekend (federal):** Saturday-Sunday (market dependent)
- **Timezone:** Gulf Standard Time (GST, UTC+4)
- **Primary regulator touchpoints (to confirm per entity):**
  - Ministry of Human Resources and Emiratisation (MOHRE)
  - Federal Tax Authority (FTA)
  - General Pension and Social Security Authority (GPSSA) / relevant local pension authority
  - Relevant free-zone authority (if applicable)

---

## 2) Payroll Cadence Norms (UAE)

## 2.1 Recommended default cadence

- **Frequency:** Monthly payroll (dominant market norm)
- **Pay period:** 1st to last calendar day of month
- **Payroll lock date:** Last working day of month
- **Payment date target:** Within first 1-3 working days of next month
- **Payment rails:** WPS (Wage Protection System) compliant transfer flow where required

## 2.2 Suggested payroll cycle controls

- T-7: Input freeze reminder (attendance, overtime, leave)
- T-5: Draft payroll calculation
- T-3: HR + Finance variance review
- T-2: Final approval and WPS/SIF preparation
- T-0 to T+1: Salary disbursement
- T+2: GL posting and reconciliation

## 2.3 Data fields to enforce

- Employee labor card / work permit references (where applicable)
- Emirates ID (if available for records)
- Visa/employment status
- Bank/WPS beneficiary data
- Contract wage split (basic vs allowances)
- Leave balances and approved overtime

---

## 3) Statutory Payroll / Tax / Social Contribution Placeholders

> Keep these as configurable rule packs with effective dating. Do **not** hardcode rates.

## 3.1 Employee payroll deductions (default baseline)

- **Personal income tax:** `0%` (placeholder; currently no broad UAE wage PIT)
- **Employee pension/social (UAE nationals):** `{{EMP_PENSION_RATE_NATIONAL}}`
- **Employee pension/social (GCC nationals):** `{{EMP_PENSION_RATE_GCC}}` (jurisdiction-dependent)
- **Employee pension/social (expatriates):** usually none statutory pension; EOSB applies (confirm policy)
- **Other deductions:** loans/advances/fines per compliant policy and consent controls

## 3.2 Employer payroll on-cost placeholders

- **Employer pension/social (UAE nationals):** `{{ER_PENSION_RATE_NATIONAL}}`
- **Employer pension/social (GCC nationals):** `{{ER_PENSION_RATE_GCC}}`
- **Workers insurance / medical coverage:** `{{MANDATORY_INSURANCE_RULES}}`
- **End-of-service benefit accrual (EOSB):** `{{EOSB_ACCRUAL_METHOD}}`

## 3.3 Corporate and indirect tax references (finance/reporting)

- **VAT:** `5%` standard rate (with zero/exempt/out-of-scope categories as applicable)
- **Corporate tax reference:** `{{UAE_CT_APPLICABILITY_BY_ENTITY}}` (e.g., mainland/free-zone qualifying treatment)
- **Withholding tax:** `{{WHT_APPLICABILITY}}` (placeholder; confirm by transaction type)

## 3.4 Open legal confirmations (mandatory)

- [ ] Confirm latest GPSSA/local pension rates and salary caps by employee nationality class.
- [ ] Confirm WPS applicability for each employing entity (mainland/free-zone exclusions if any).
- [ ] Confirm EOSB calculation basis (basic wage definition, unpaid leave effect, resignations/terminations scenarios).
- [ ] Confirm treatment for probation exits and disciplinary termination under current labor law.
- [ ] Confirm any emirate/free-zone specific variances from federal baseline.

---

## 4) Labor, Overtime, Leave, Holiday Policy Matrix

> System should support policy-by-legal-entity with effective date and contract override controls.

| Policy Area | UAE Baseline (Draft) | System Rule | Open Confirmation |
|---|---|---|---|
| Standard working hours | Typically up to 8 hrs/day, 48 hrs/week (private sector baseline) | Cap default schedules; flag violations | Confirm sector exceptions and Ramadan adjustments |
| Weekly rest | Minimum weekly rest day(s), often 1 day | Enforce weekly off in roster templates | Confirm if internal policy grants 2-day weekend universally |
| Overtime eligibility | Not all employees eligible (role/category dependent) | Eligibility flag by contract grade | Confirm exempt categories |
| Overtime premium - normal | `Base hourly x 1.25` (placeholder common baseline) | OT type `OT_NORMAL` | Confirm legal/current percentage |
| Overtime premium - night window | `Base hourly x 1.50` (placeholder common baseline, e.g., late night) | OT type `OT_NIGHT` | Confirm exact time window and exclusions |
| Overtime on rest day / public holiday | Comp off and/or premium pay per law/policy | OT type `OT_REST_HOLIDAY` with dual option | Confirm mandatory method by scenario |
| Public holidays | Federal announcements vary annually | Maintain annually published holiday table | Confirm paid/unpaid rules for shift workers |
| Annual leave | Statutory annual leave entitlement | Leave accrual engine by tenure | Confirm accrual during probation/unpaid leave |
| Sick leave | Statutory structure with paid tiers | Tiered sick leave pay rules | Confirm thresholds and medical evidence rules |
| Maternity leave | Statutory paid leave entitlements | Leave type + payroll override | Confirm duration/pay split and eligibility |
| Paternity/parental leave | Statutory entitlement exists | Leave type + approval workflow | Confirm days and proof requirements |
| End of service (EOSB) | Based on basic wage + tenure (subject to law) | Monthly accrual + final settlement calc | Confirm resign/termination treatment matrix |

---

## 5) Invoice and Tax Report Requirements (FTA-Oriented)

## 5.1 POS invoice / tax invoice minimum fields

- Supplier legal name, address, TRN
- Invoice number (sequential, unique)
- Invoice issue date
- Customer name/address/TRN (where required, e.g., full tax invoice/B2B)
- Description of goods/services
- Quantity, unit price, line net
- VAT rate per line
- VAT amount per line and total VAT
- Gross total payable (AED)
- Credit note linkage (for returns/adjustments)

## 5.2 Invoice classes to support

- Simplified tax invoice (B2C threshold/conditions)
- Full tax invoice (B2B and required cases)
- Tax credit note
- Tax debit note
- Proforma/non-tax document (non-posting)

## 5.3 VAT configuration checklist

- [ ] Tax code master created: `STD_5`, `ZERO`, `EXEMPT`, `OUT_SCOPE`
- [ ] Product taxability mapped by SKU/service category
- [ ] Branch/registration mapping (single vs multiple TRN handling)
- [ ] Reverse charge scenarios mapped (if applicable)
- [ ] Return/refund tax reversal logic validated
- [ ] Rounding logic validated at line vs document level per policy

## 5.4 Tax reporting outputs (minimum)

- VAT sales by tax code and period
- VAT purchases/input tax by code and recoverability status
- Output VAT vs input VAT reconciliation
- Exception report: negative VAT, missing TRN, invalid tax code
- VAT return support schedule export (`{{FTA_RETURN_TEMPLATE_VERSION}}`)

---

## 6) Required Legal / HR Document Templates

> Store templates under version control; each template requires owner, version, effective date.

## 6.1 Core employment documents

- [ ] Employment contract template (Arabic/English requirements as applicable)
- [ ] Offer letter template
- [ ] Job description template by role family
- [ ] Employee handbook / policy acknowledgment
- [ ] NDA + confidentiality agreement

## 6.2 Payroll & attendance documents

- [ ] Salary structure form (basic, allowances, variable)
- [ ] Bank/WPS salary transfer authorization
- [ ] Overtime pre-approval and claim form
- [ ] Leave application and approval form
- [ ] Unpaid leave consent form
- [ ] Payroll change request form

## 6.3 Lifecycle documents

- [ ] Probation review template
- [ ] Disciplinary notice templates (graded)
- [ ] Termination/resignation acceptance template
- [ ] Final settlement & EOSB computation sheet
- [ ] Exit clearance checklist

## 6.4 Compliance confirmations

- [ ] Data privacy consent/notice template (employee)
- [ ] Record retention schedule
- [ ] Document language/legalization requirements confirmed for jurisdiction

---

## 7) GL Mapping Deltas for UAE Localization

> Add these as localization overlays, not core chart rewrites.

## 7.1 New/updated account buckets

- **Liabilities**
  - `2105` VAT Output Payable
  - `2106` VAT Input Recoverable
  - `2110` Payroll Payable - Net Salaries
  - `2111` Payroll Payable - Pension (Employee)
  - `2112` Payroll Payable - Pension (Employer)
  - `2113` EOSB Provision
  - `2114` Leave Encashment Provision (if used)

- **Expenses**
  - `5105` Employer Pension Expense
  - `5106` EOSB Expense
  - `5107` Overtime Expense
  - `5108` Allowances Expense (Housing/Transport/Other)

- **Clearing/Control**
  - `1308` WPS Salary Clearing Account
  - `1312` VAT Control / Reconciliation

## 7.2 Posting logic deltas

- Payroll journal split required between:
  - Basic wage
  - Allowances
  - Overtime
  - Employer contributions
  - EOSB accrual
  - Employee deductions
- VAT postings by tax code per line; document-level reconciliation control
- Credit notes must reverse revenue + VAT consistently with original invoice reference

## 7.3 Reconciliation controls

- [ ] WPS bank file total = payroll net salary payable
- [ ] VAT control account = VAT return support schedule
- [ ] EOSB provision roll-forward reconciles opening + accrual - settlements

---

## 8) Implementation Checklist (Sectioned)

## 8.1 Foundation setup

- [ ] Create `country=UAE` localization profile
- [ ] Configure AED currency + rounding rules
- [ ] Configure UAE timezone and business calendar
- [ ] Load federal holiday calendar seed (yearly update process)

## 8.2 Payroll engine configuration

- [ ] Define payroll frequency = monthly
- [ ] Set wage components (basic/allowances/OT/other)
- [ ] Configure pension/social placeholders by nationality class
- [ ] Configure EOSB accrual rule with effective dating
- [ ] Configure leave accrual and encashment rules
- [ ] Configure WPS file export schema + validation

## 8.3 Labor policy implementation

- [ ] Build overtime rate table (`OT_NORMAL`, `OT_NIGHT`, `OT_REST_HOLIDAY`)
- [ ] Map eligibility by role/grade
- [ ] Enforce max-hour alerts and approval workflow
- [ ] Implement public holiday pay handling modes

## 8.4 Tax & invoicing implementation

- [ ] Seed VAT tax codes and accounting mappings
- [ ] Enable simplified + full invoice templates
- [ ] Add mandatory TRN and tax field validation
- [ ] Build VAT return support exports
- [ ] Add tax exception dashboard widgets

## 8.5 Documents & governance

- [ ] Upload legal/HR template pack with versioning
- [ ] Assign document owners (HR, Legal, Finance)
- [ ] Add maker-checker approval for payroll finalization
- [ ] Add audit trail for payroll/tax master data changes

## 8.6 Testing & go-live

- [ ] UAT: payroll scenarios (new joiner, unpaid leave, OT, termination, EOSB)
- [ ] UAT: VAT scenarios (B2C, B2B, zero/exempt, credit note)
- [ ] Parallel run: 1-2 payroll cycles vs legacy
- [ ] Sign-off: HR, Finance, Legal, Tax
- [ ] Hypercare plan and rollback procedure approved

---

## 9) Open Legal/Tax Confirmation Register (Must Close Before Production)

| ID | Topic | Question to Confirm | Owner | Due Date | Status |
|---|---|---|---|---|---|
| UAE-L01 | Working hours | Confirm sector-specific max hours and exemptions | Legal/HR | `{{DATE}}` | Open |
| UAE-L02 | Overtime rates | Confirm legal premium percentages and night window definition | Legal/HR | `{{DATE}}` | Open |
| UAE-L03 | Public holiday pay | Confirm compensation method for rostered staff on holidays | Legal/HR | `{{DATE}}` | Open |
| UAE-L04 | EOSB | Confirm exact EOSB formula and resignation/termination treatment | Legal/HR | `{{DATE}}` | Open |
| UAE-T01 | VAT invoicing | Confirm simplified vs full invoice thresholds/conditions | Tax | `{{DATE}}` | Open |
| UAE-T02 | VAT return mapping | Confirm return box mapping to tax code matrix | Tax/Finance | `{{DATE}}` | Open |
| UAE-P01 | Pension rates | Confirm employee/employer rates and salary caps by category | Payroll/Legal | `{{DATE}}` | Open |
| UAE-P02 | WPS | Confirm entity applicability and required file/data standard | Payroll/Compliance | `{{DATE}}` | Open |
| UAE-F01 | Corporate tax | Confirm entity-level CT applicability and reporting impacts | Finance/Tax | `{{DATE}}` | Open |

---

## 10) Engineering Notes (for `openclaw-pos`)

- Keep UAE localization under `docs/country-packs/UAE.md` + config artifacts in code (`/data-model` or `/services/finops-ledger` as implemented).
- All statutory rates and legal thresholds must be config-driven with:
  - effective date
  - entity scope
  - source reference link
  - approver and change ticket
- Add automated regression pack for UAE payroll + VAT edge cases before each release.

---

## Disclaimer

This document is an implementation blueprint, **not legal advice**. UAE labor/tax requirements can vary by entity type, free-zone regime, and latest circulars. Final production configuration requires validation by licensed legal/tax advisors in UAE.
