# Country Pack — Oman (OM)

> **Purpose:** Implementation-ready baseline for Oman localization in `openclaw-pos`.
> **Status:** Draft for legal/payroll validation.
> **Last updated:** 2026-02-26
> **Owner(s):** HRIS + Finance + Local Legal Counsel

---

## 1) Country Profile Snapshot

- **ISO country code:** OM
- **Currency:** OMR (Omani Rial)
- **Subunit:** Baisa (1 OMR = 1000 baisa)
- **Default number format:** English/Arabic locale support required
- **Week model:** Typically Sunday–Thursday workweek (entity-specific confirmation required)
- **Weekend days:** Commonly Friday and Saturday (confirm for each legal entity/site)
- **Primary language(s):** Arabic (official), English (business common)
- **Tax system (high level):** VAT regime in force; no broad personal income tax withholding currently in standard payroll (legal confirmation required)

---

## 2) Payroll Cadence Norms (Implementation Defaults)

## Recommended Defaults

- **Payroll frequency (monthly staff):** Monthly
- **Payroll frequency (hourly/daily wage staff):** Monthly or biweekly (employer policy)
- **Pay period close:** Last calendar day of month
- **Standard pay date:** Last working day of month (or contractually fixed date)
- **Overtime cutoff:** Align with payroll cutoff (avoid off-cycle except approved adjustments)
- **Off-cycle payroll:** Allowed for final settlements, corrections, and ad-hoc statutory adjustments

## Payroll Calendar Controls

- [ ] Define legal entity payroll calendars (per entity, not only per country)
- [ ] Configure Oman public holiday calendar + company-specific shutdowns
- [ ] Add cut-off lock date and approval workflow (HR → Finance)
- [ ] Configure bank transfer lead time (T-1 / T-2) per bank SLA
- [ ] Configure end-of-service settlement run type

---

## 3) Statutory Payroll / Tax / Social Contributions (Placeholders)

> Keep these as **parameterized constants** in code/config. Do not hardcode rates in business logic.

## 3.1 Employer/Employee Deductions (Payroll)

| Item | Applies To | Basis | Employer % | Employee % | Ceiling/Floor | Filing/Payment Cadence | System Field Key |
|---|---|---|---:|---:|---|---|---|
| Social Protection / Social Insurance (Omani nationals) | Omani employees (confirm scope) | Pensionable/basic wage definition per law | `OM_SOC_EMPLOYER_RATE` | `OM_SOC_EMPLOYEE_RATE` | `OM_SOC_WAGE_CAP` | Monthly | `stat.social.main` |
| Work injury / occupational coverage | As prescribed | Eligible wage | `OM_WORKINJ_EMPLOYER_RATE` | 0 | `OM_WORKINJ_CAP` | Monthly | `stat.social.workinj` |
| Job security / unemployment scheme (if applicable) | As prescribed | Eligible wage | `OM_JS_EMPLOYER_RATE` | `OM_JS_EMPLOYEE_RATE` | `OM_JS_CAP` | Monthly | `stat.social.jobs` |
| Expat social/pension equivalent | Typically N/A (check GCC transferability cases) | N/A | `OM_EXPAT_SOC_RATE` | `OM_EXPAT_SOC_RATE_EE` | N/A | N/A | `stat.social.expat` |

## 3.2 Income Tax Withholding (Payroll)

| Item | Current Baseline | Config Treatment |
|---|---|---|
| Personal income tax withholding (PAYE-style) | Generally treated as **not currently applied** in standard Oman payroll | Keep switchable feature flag: `OM_PAYROLL_PIT_ENABLED=false` |

## 3.3 Employer Corporate Tax / Other (Non-payroll but finance-relevant)

| Item | Purpose | Config Treatment |
|---|---|---|
| Corporate Income Tax | Not payroll withholding, but impacts statutory reporting | Keep in finance tax module only |
| VAT | Sales/output and purchase/input tax compliance | Configure in POS invoicing + reporting |

## 3.4 Statutory Master Data Checklist

- [ ] Register each legal entity with relevant social protection authority account IDs
- [ ] Store employer registration number, branch code, and remittance reference format
- [ ] Define pensionable wage components mapping (basic, allowances, exclusions)
- [ ] Define ceilings, effective dates, and retro-change handling
- [ ] Enable effective-dated rate tables with audit trail

---

## 4) Labor / Overtime / Holiday Policy Matrix (System Policy Layer)

> Values below are implementation placeholders and must be legally confirmed for sector/entity/contract type.

| Policy Area | Default Rule Template | Config Key(s) | Evidence Required |
|---|---|---|---|
| Standard working hours | `OM_STD_HOURS_PER_DAY=8`, `OM_STD_HOURS_PER_WEEK=40-48` | `labor.standardHours.*` | Contract + legal memo |
| Weekly rest day | Default Friday (or Fri/Sat weekend model by employer) | `labor.weekendDays` | Company policy |
| Daily overtime trigger | Hours beyond scheduled shift/standard day | `ot.trigger.daily` | Labor counsel confirmation |
| OT rate on normal workday | Placeholder `125%` of hourly rate | `ot.rate.normalDay=1.25` | Legal confirmation |
| OT rate on weekly rest day | Placeholder `150%` | `ot.rate.restDay=1.50` | Legal confirmation |
| OT rate on public holiday | Placeholder `150%` or compensatory leave rule | `ot.rate.publicHoliday` + `ot.compLeavePolicy` | Legal confirmation |
| Max OT limits | Cap by day/month/year if required | `ot.max.*` | Legal confirmation |
| Public holiday pay treatment | Paid leave; work-on-holiday premium or comp-off | `holiday.workTreatment` | Legal + policy |
| Annual leave accrual | Accrual logic by completed service | `leave.annual.accrualRule` | HR policy + law |
| Sick leave | Paid/unpaid bands per law/policy | `leave.sick.*` | HR/legal confirmation |
| Maternity/paternity/other leave | As per Oman law + policy | `leave.family.*` | Legal confirmation |
| Probation | Max duration + notice terms | `employment.probation.*` | Contract templates |
| End-of-service benefits | Gratuity/terminal benefit logic by employee category | `termination.eos.*` | Legal + finance signoff |

## Implementation Notes

- Build **effective-dated policy records** by legal entity.
- Keep **contract-type overrides** (limited/unlimited term, category, grade).
- Add **shift-level OT eligibility flags** (managerial exclusions if lawful).
- Maintain **holiday calendar versioning** by year.

---

## 5) Invoice, Receipt, and Tax Report Requirements (POS + Finance)

## 5.1 VAT / Invoice Controls

- **VAT model:** Oman VAT regime (standard rate expected to be configured as 5% unless legally updated)
- **Tax code setup:**
  - `OM_VAT_STD` (standard-rated)
  - `OM_VAT_ZERO` (zero-rated)
  - `OM_VAT_EXEMPT`
  - `OM_VAT_OUT_SCOPE`
- **Per-line tax determination:** mandatory
- **Rounding rule:** configurable at line vs invoice total with legal signoff

## 5.2 Mandatory Invoice/Receipt Data Elements (Template)

- [ ] Supplier legal name (Arabic/English as required)
- [ ] Supplier VAT registration number
- [ ] Branch address/contact
- [ ] Invoice/receipt serial number (unique, sequential)
- [ ] Invoice issue date/time
- [ ] Customer details (where required for tax invoice)
- [ ] Item description, quantity, unit price
- [ ] Taxable amount by VAT category
- [ ] VAT rate and VAT amount per line/summary
- [ ] Gross total payable (OMR)
- [ ] Credit note linkage for returns/reversals
- [ ] Currency and exchange disclosure (if non-OMR allowed)

## 5.3 Tax Reporting Outputs

- [ ] VAT sales summary by tax code and period
- [ ] VAT purchase/input summary (if finance module integrated)
- [ ] Output VAT vs input VAT reconciliation report
- [ ] Adjustments report (credit notes, voids, returns)
- [ ] Exception report (missing VAT number, invalid tax code)
- [ ] Audit extract (invoice sequence gap report)

## 5.4 Filing Calendar Placeholders

| Report | Periodicity | Due Date Rule | Owner |
|---|---|---|---|
| VAT Return | `OM_VAT_RETURN_FREQ` (monthly/quarterly as registered) | `OM_VAT_DUE_RULE` | Finance Tax |
| VAT Payment | With return due date | `OM_VAT_PAY_DUE_RULE` | Treasury |
| Payroll social remittance | Monthly | `OM_SOC_DUE_RULE` | Payroll |

---

## 6) Required Legal / HR Document Templates

> Store templates in `docs/templates/legal/om/` and rendered records in secured HRIS DMS.

## Core Employment Documents

- [ ] Oman-compliant employment contract template (Arabic + bilingual form if needed)
- [ ] Offer letter template
- [ ] Job description template
- [ ] Probation confirmation/extension letter
- [ ] Salary change / allowance amendment letter
- [ ] Working hours and overtime consent/policy acknowledgment
- [ ] Leave policy acknowledgment
- [ ] Confidentiality / data protection addendum

## Payroll & Statutory Documents

- [ ] Payroll data consent/authorization form
- [ ] Bank account salary transfer authorization
- [ ] Social insurance enrollment form (nationals)
- [ ] Social insurance change/termination notification form
- [ ] Payslip template (Arabic/English presentation options)
- [ ] End-of-service settlement sheet template

## Time, Attendance, and Discipline

- [ ] Attendance policy acknowledgment
- [ ] Overtime pre-approval form
- [ ] Leave request forms (annual/sick/emergency)
- [ ] Disciplinary notice templates
- [ ] Grievance/complaint form

## Separation Documents

- [ ] Resignation acceptance template
- [ ] Termination notice template
- [ ] Final settlement statement
- [ ] Asset handover/NOC/checklist template
- [ ] Service certificate template

---

## 7) GL Mapping Deltas (OM Localization)

> Add Oman-specific accounts while preserving group chart structure.

## 7.1 Payroll GL Deltas

| Transaction Type | Debit Account | Credit Account | Notes |
|---|---|---|---|
| Gross salary expense | `5xxx-OM-PAYROLL-GROSS` | `2xxx-OM-PAYROLL-PAYABLE` | By cost center/branch |
| Employee social deduction | `2xxx-OM-PAYROLL-PAYABLE` | `2xxx-OM-SOC-EE-PAYABLE` | Nationals scope |
| Employer social contribution | `5xxx-OM-SOC-ER-EXP` | `2xxx-OM-SOC-ER-PAYABLE` | Statutory burden |
| Overtime expense | `5xxx-OM-OT-EXP` | `2xxx-OM-PAYROLL-PAYABLE` | Separate analytics |
| EOS/gratuity provision | `5xxx-OM-EOS-EXP` | `2xxx-OM-EOS-PROVISION` | If provision policy applies |
| Payroll payment | `2xxx-OM-PAYROLL-PAYABLE` | `1xxx-BANK-OMR` | Bank disbursement |
| Social remittance payment | `2xxx-OM-SOC-*-PAYABLE` | `1xxx-BANK-OMR` | Monthly remittance |

## 7.2 VAT / POS GL Deltas

| Transaction Type | Debit Account | Credit Account | Notes |
|---|---|---|---|
| Taxable sale | `1xxx-CASH/BANK/AR` | `4xxx-REVENUE` + `2xxx-OM-OUTPUT-VAT` | Split revenue vs VAT |
| Zero-rated sale | `1xxx-CASH/BANK/AR` | `4xxx-REVENUE-ZERO` | No output VAT |
| Exempt sale | `1xxx-CASH/BANK/AR` | `4xxx-REVENUE-EXEMPT` | No output VAT |
| Customer return | `4xxx-REV-RETURNS` + `2xxx-OM-OUTPUT-VAT` (reverse) | `1xxx-CASH/BANK/AR` | Link to credit note |
| Input VAT on purchases | `5xxx/1xxx ASSET/EXP` + `1xxx/2xxx-OM-INPUT-VAT` | `2xxx-AP` | Finance AP side |
| VAT settlement | `2xxx-OM-OUTPUT-VAT` / `1xxx/2xxx-OM-INPUT-VAT` | `2xxx-OM-VAT-PAYABLE/RECEIVABLE` | Return close |

## 7.3 GL Mapping Checklist

- [ ] Create OMR functional currency ledgers where required
- [ ] Validate branch/cost-center segment mapping for Oman entities
- [ ] Map statutory liabilities to dedicated control accounts
- [ ] Configure tax code → GL account matrix
- [ ] Test posting for sales, return, payroll, and remittance journeys

---

## 8) Implementation Rollout Checklist (Sectioned)

## A. Governance & Legal

- [ ] Appoint Oman legal counsel / compliance owner
- [ ] Confirm applicable labor law version and executive regulations
- [ ] Confirm social protection authority obligations by employee category
- [ ] Confirm VAT registration status per legal entity/branch
- [ ] Capture legal memo and approval in project repository

## B. Master Data & Configuration

- [ ] Create country record `OM`
- [ ] Configure currency precision (3 decimals for OMR handling policy)
- [ ] Load holiday calendar(s)
- [ ] Configure payroll calendars and pay groups
- [ ] Configure tax code matrix and invoice schema
- [ ] Configure OT/leave/end-of-service policy rules

## C. Integrations

- [ ] Bank file/payment integration for salary disbursement
- [ ] Statutory portal export format mapping (social + VAT)
- [ ] ERP/GL integration mapping verified for OM entities
- [ ] DMS integration for legal documents and employee records

## D. Testing

- [ ] Unit tests: payroll formula/rate resolution/effective dating
- [ ] UAT: joiner-to-leaver lifecycle with Oman scenarios
- [ ] Parallel run: 1–2 payroll cycles against legacy/manual baseline
- [ ] VAT E2E: sale, return, void, credit note, tax reporting
- [ ] Reconciliation: payroll-to-GL and VAT-to-GL tie-out

## E. Cutover & Hypercare

- [ ] Cutover checklist approved by HR/Finance/IT
- [ ] Initial balances loaded (leave, EOS accruals, liabilities)
- [ ] First live payroll with signoff gates
- [ ] First tax report pack generated and reviewed
- [ ] Hypercare war-room for first 4–6 weeks

---

## 9) Open Legal Confirmations (Must Close Before Production)

## Critical (Blockers)

- [ ] Confirm latest Oman labor law provisions for standard hours and overtime multipliers
- [ ] Confirm exact social protection contribution rates and wage base definitions (employer/employee split, ceilings)
- [ ] Confirm treatment differences for Omani vs expatriate workers
- [ ] Confirm end-of-service/gratuity calculation method by contract type and tenure
- [ ] Confirm mandatory invoice fields and e-invoicing/digital archiving obligations
- [ ] Confirm VAT return periodicity and submission/payment deadlines per entity

## High Priority (Go-live risk)

- [ ] Confirm public holiday work compensation rule (premium vs comp-off)
- [ ] Confirm sick leave pay bands and evidence requirements
- [ ] Confirm probation limits and notice obligations
- [ ] Confirm payroll record retention period and Arabic-language document requirements

## Nice to Have (Optimization)

- [ ] Confirm sector-specific CBAs/ministerial directives if any (retail/hospitality)
- [ ] Confirm preferred legal wording for bilingual contracts and policies

---

## 10) Data Model / Config Keys to Add (Engineering Backlog)

- [ ] `country.om.payroll.frequency.default`
- [ ] `country.om.social.rates[]` (effective-dated)
- [ ] `country.om.social.wageBaseRules`
- [ ] `country.om.ot.rates[]` (normal/rest/holiday)
- [ ] `country.om.leave.rules[]`
- [ ] `country.om.eos.rules[]`
- [ ] `country.om.vat.codes[]`
- [ ] `country.om.vat.return.calendar`
- [ ] `country.om.invoice.requiredFields[]`
- [ ] `country.om.gl.mappings[]`

---

## 11) Minimal Done Definition (OM Pack)

- [ ] All blocker legal confirmations signed by counsel
- [ ] Statutory rates and rules configured with effective dates
- [ ] Payroll and VAT UAT passed with reconciliation evidence
- [ ] Legal/HR templates approved and published
- [ ] First month close completed without unresolved statutory variance

---

## Appendix — Suggested Folder Layout

```text
docs/
  country-packs/
    OM.md
  templates/
    legal/
      om/
        employment-contract.md
        offer-letter.md
        overtime-policy-ack.md
        payroll-authorization.md
        eos-settlement-sheet.md
```
