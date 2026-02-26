# FinOps Sprint v1 — Minimum Viable Accounting Pipeline (Pilot)

Status: Draft for pilot implementation  
Scope: openclaw-pos current state (`org_units`, `employees`, `sync_events`, `/v1/org-units`, `/v1/employees`) + minimum additions required for finance close control.

---

## 0) Current-State Baseline (What exists today)

### Existing D1 tables
- `org_units` (hierarchy + country/currency metadata)
- `employees` (HR master reference)
- `sync_events` (generic event ingestion with `event_type`, `payload_json`, `business_date`)

### Existing API endpoints
- Readiness: `/health`, `/db-check`, `/v1/health`, `/v1/db-check`, `/v1/meta`
- Master data CRUD (basic):
  - `/v1/org-units` GET/POST
  - `/v1/employees` GET/POST

### Practical implication for pilot accounting
- We **already have an event ledger intake point** via `sync_events`.
- We do **not** yet have accounting-specific entities (chart of accounts, journal headers/lines, posting rules, reconciliation snapshots).
- Minimum viable path: use `sync_events` as immutable source events, then post deterministic journal entries into new accounting tables.

---

## 1) Posting Map (Event → Accounting Entries)

Assumptions for pilot:
- Functional currency per branch/country from `org_units.currency_code` (PK baseline: `PKR`).
- Inventory accounting deferred (phase-2). Pilot posts sales, refunds, cash movement, payroll accrual/payment.
- Tax account naming uses Pakistan baseline (Sales Tax/GST style output tax). Adjust nomenclature per legal advisor if needed.

### 1.1 Chart-of-Accounts (minimum codes)

- `110100` Cash on Hand - Till
- `110200` Cash in Transit
- `110300` Bank Clearing / Card Settlement Receivable
- `120100` Employee Receivable (optional for advances)
- `210100` Sales Tax Payable (Output Tax)
- `210200` Payroll Payable
- `210300` Salary Tax Withholding Payable
- `410100` Sales Revenue (Net of Tax)
- `420100` Sales Returns & Allowances (contra-revenue)
- `510100` Salaries Expense

> If branch-level segmentation is needed, use dimensions (`branch_id`, `till_id`, `country_code`) rather than duplicate GL accounts.

### 1.2 Posting rules by event type

| Event Type | Trigger condition | Debit | Credit | Notes |
|---|---|---|---|---|
| `SaleFinalized` | Sale committed (invoice/receipt final) | Cash/Card clearing (gross amount) | Sales Revenue (net) + Sales Tax Payable (tax) | Split by tender: cash to `110100`, card/wallet to `110300` |
| `Return` | Approved return/refund completed | Sales Returns & Allowances (net) + Sales Tax Payable (reverse tax) | Cash/Card clearing (refund gross) | Tax reversal must mirror original tax basis/rate |
| `TillClose` | Shift close with counted cash | (A) Cash in Transit for deposit amount; (B) Over/Short expense/income if variance model added | Cash on Hand - Till | For v1, post transfer and capture variance fields for reporting even if no dedicated account yet |
| `PayrollJournal` | Payroll run approved for posting | Salaries Expense (+ employer burdens if added) | Payroll Payable + Salary Tax Withholding Payable | Payment event later clears payable to bank/cash |

#### SaleFinalized formula (line-level aggregated to document)
- `gross_total = taxable_base + tax_amount + non_taxable_base`
- Debit tender account(s): `gross_total`
- Credit revenue: `taxable_base + non_taxable_base`
- Credit output tax payable: `tax_amount`

#### Return formula
- Reverse of sale amounts (sign-inverted from original transaction proportions).

#### TillClose formula (pilot)
- `expected_cash` from sale/return/tender events
- `counted_cash` from till close payload
- `deposit_cash` (normally equals counted or policy-defined safe drop)
- Entry:
  - Dr `110200` Cash in Transit = `deposit_cash`
  - Cr `110100` Cash on Hand - Till = `deposit_cash`
- Variance (`counted_cash - expected_cash`) stored in recon table; optional GL posting in v1.1.

#### PayrollJournal formula
- Dr `510100` Salaries Expense = gross payroll expense
- Cr `210200` Payroll Payable = net payable to employees
- Cr `210300` Salary Tax Withholding Payable = withheld tax
- (Optional future) Cr statutory payable accounts for social security/pension.

---

## 2) D1 Table Set (Journals + Mappings) for Pilot

Use additive migration (e.g., `0002_finops_v1.sql`).

```sql
-- 1) Chart of accounts
CREATE TABLE IF NOT EXISTS gl_accounts (
  account_code TEXT PRIMARY KEY,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL, -- asset|liability|equity|revenue|expense|contra_revenue
  normal_balance TEXT NOT NULL, -- debit|credit
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2) Event-to-posting rules (versioned mapping)
CREATE TABLE IF NOT EXISTS gl_posting_rules (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL, -- SaleFinalized|Return|TillClose|PayrollJournal
  country_code TEXT,        -- null = global default
  currency_code TEXT,       -- null = inherit from org unit
  rule_version INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  config_json TEXT NOT NULL, -- account mapping, formulas, dimensions
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gl_posting_rules_evt ON gl_posting_rules(event_type, country_code, currency_code, is_active);

-- 3) Journal header
CREATE TABLE IF NOT EXISTS gl_journal_entries (
  journal_id TEXT PRIMARY KEY,
  source_event_id TEXT NOT NULL,       -- sync_events.event_id
  source_event_type TEXT NOT NULL,
  source_node TEXT,
  business_date TEXT NOT NULL,
  posting_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'posted', -- posted|reversed|error|pending_review
  country_code TEXT,
  currency_code TEXT NOT NULL,
  fx_rate_to_group REAL,
  branch_id TEXT,
  till_id TEXT,
  memo TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source_event_id)
);

CREATE INDEX IF NOT EXISTS idx_gl_journal_date ON gl_journal_entries(business_date, source_event_type);

-- 4) Journal lines
CREATE TABLE IF NOT EXISTS gl_journal_lines (
  line_id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL,
  line_no INTEGER NOT NULL,
  account_code TEXT NOT NULL,
  debit_amount REAL NOT NULL DEFAULT 0,
  credit_amount REAL NOT NULL DEFAULT 0,
  tax_code TEXT,
  tax_rate REAL,
  narration TEXT,
  dimension_json TEXT, -- branch/till/employee/tender/etc
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (journal_id) REFERENCES gl_journal_entries(journal_id),
  FOREIGN KEY (account_code) REFERENCES gl_accounts(account_code)
);

CREATE INDEX IF NOT EXISTS idx_gl_journal_lines_journal ON gl_journal_lines(journal_id, line_no);
CREATE INDEX IF NOT EXISTS idx_gl_journal_lines_account ON gl_journal_lines(account_code);

-- 5) Daily reconciliation snapshots
CREATE TABLE IF NOT EXISTS finops_recon_daily (
  recon_id TEXT PRIMARY KEY,
  business_date TEXT NOT NULL,
  branch_id TEXT,
  till_id TEXT,
  currency_code TEXT NOT NULL,
  expected_cash REAL,
  counted_cash REAL,
  variance_cash REAL,
  sales_gross REAL,
  returns_gross REAL,
  net_sales REAL,
  tax_output REAL,
  payroll_posted REAL,
  status TEXT NOT NULL DEFAULT 'open', -- open|reviewed|closed
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (business_date, branch_id, till_id)
);

CREATE INDEX IF NOT EXISTS idx_finops_recon_daily_date ON finops_recon_daily(business_date, branch_id);

-- 6) Posting errors / dead-letter queue for finance
CREATE TABLE IF NOT EXISTS gl_posting_errors (
  id TEXT PRIMARY KEY,
  source_event_id TEXT NOT NULL,
  source_event_type TEXT NOT NULL,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  payload_json TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);
```

### Minimal endpoint additions (v1.1 suggested)
- `POST /v1/events` (or internal worker) to persist finance-relevant events into `sync_events`.
- `POST /v1/finops/postings/run?business_date=YYYY-MM-DD`
- `GET /v1/finops/recon/daily?business_date=YYYY-MM-DD&branch_id=...`
- `GET /v1/finops/journals?business_date=...&event_type=...`

---

## 3) Daily Reconciliation Queries (D1 SQL)

> These are the minimum daily control reports finance needs in pilot.

### 3.1 Trial balance check (daily, must net to zero)
```sql
SELECT
  je.business_date,
  ROUND(SUM(jl.debit_amount), 2) AS total_debit,
  ROUND(SUM(jl.credit_amount), 2) AS total_credit,
  ROUND(SUM(jl.debit_amount - jl.credit_amount), 2) AS imbalance
FROM gl_journal_entries je
JOIN gl_journal_lines jl ON je.journal_id = jl.journal_id
WHERE je.business_date = ?
GROUP BY je.business_date;
```

### 3.2 Event-to-journal completeness
```sql
SELECT
  se.event_type,
  COUNT(*) AS event_count,
  SUM(CASE WHEN je.journal_id IS NOT NULL THEN 1 ELSE 0 END) AS posted_count,
  SUM(CASE WHEN je.journal_id IS NULL THEN 1 ELSE 0 END) AS missing_count
FROM sync_events se
LEFT JOIN gl_journal_entries je ON je.source_event_id = se.event_id
WHERE se.business_date = ?
  AND se.event_type IN ('SaleFinalized','Return','TillClose','PayrollJournal')
GROUP BY se.event_type;
```

### 3.3 Sales vs returns vs net revenue
```sql
SELECT
  je.business_date,
  ROUND(SUM(CASE WHEN jl.account_code = '410100' THEN jl.credit_amount - jl.debit_amount ELSE 0 END), 2) AS sales_revenue_net,
  ROUND(SUM(CASE WHEN jl.account_code = '420100' THEN jl.debit_amount - jl.credit_amount ELSE 0 END), 2) AS returns_value,
  ROUND(
    SUM(CASE WHEN jl.account_code = '410100' THEN jl.credit_amount - jl.debit_amount ELSE 0 END)
    - SUM(CASE WHEN jl.account_code = '420100' THEN jl.debit_amount - jl.credit_amount ELSE 0 END)
  , 2) AS net_revenue_after_returns
FROM gl_journal_entries je
JOIN gl_journal_lines jl ON je.journal_id = jl.journal_id
WHERE je.business_date = ?
GROUP BY je.business_date;
```

### 3.4 Output tax payable movement
```sql
SELECT
  je.business_date,
  ROUND(SUM(jl.credit_amount - jl.debit_amount), 2) AS output_tax_net
FROM gl_journal_entries je
JOIN gl_journal_lines jl ON je.journal_id = jl.journal_id
WHERE je.business_date = ?
  AND jl.account_code = '210100'
GROUP BY je.business_date;
```

### 3.5 Till cash expected vs counted variance
```sql
SELECT
  business_date,
  branch_id,
  till_id,
  ROUND(expected_cash, 2) AS expected_cash,
  ROUND(counted_cash, 2) AS counted_cash,
  ROUND(variance_cash, 2) AS variance_cash,
  status
FROM finops_recon_daily
WHERE business_date = ?
ORDER BY branch_id, till_id;
```

### 3.6 Unresolved posting errors
```sql
SELECT
  source_event_type,
  error_code,
  COUNT(*) AS open_items,
  MIN(created_at) AS oldest_item,
  MAX(created_at) AS latest_item
FROM gl_posting_errors
WHERE resolved_at IS NULL
GROUP BY source_event_type, error_code
ORDER BY open_items DESC;
```

---

## 4) Tax Inclusive / Exclusive Handling Spec (Pakistan baseline)

> This is an implementation baseline, not legal advice. Finance/legal should confirm rates/scenarios per product category.

### 4.1 Required fields in transaction payload (for `SaleFinalized` / `Return`)
Per line item:
- `quantity`
- `unit_price`
- `discount_amount`
- `tax_code` (e.g., `PK_STD`, `PK_ZERO`, `PK_EXEMPT`)
- `tax_rate`
- `price_includes_tax` (boolean)

Document-level:
- `currency_code` (`PKR` default)
- `rounding_mode` (`half_up` baseline)
- `rounding_level` (`line` or `document`; pilot recommend `line` then sum)

### 4.2 Computation rules

#### A) Tax-inclusive pricing (`price_includes_tax = true`)
- `line_gross = (quantity * unit_price) - discount_amount`
- `line_tax = round(line_gross * tax_rate / (1 + tax_rate), 2)`
- `line_net = line_gross - line_tax`

Posting impact:
- Revenue credited with `line_net`
- Tax payable credited with `line_tax`
- Tender debited with `line_gross`

#### B) Tax-exclusive pricing (`price_includes_tax = false`)
- `line_net = (quantity * unit_price) - discount_amount`
- `line_tax = round(line_net * tax_rate, 2)`
- `line_gross = line_net + line_tax`

Posting impact:
- Revenue credited with `line_net`
- Tax payable credited with `line_tax`
- Tender debited with `line_gross`

### 4.3 Return handling
- Return must reference original sale line or preserve original `tax_code`, `tax_rate`, and inclusivity flag.
- Reverse net and tax in same proportions used at sale.
- If original invoice unavailable, route to `pending_review` with conservative default tax treatment disabled (no auto-guess for compliance safety).

### 4.4 Rounding and tolerance policy
- Monetary precision: 2 decimals for PKR.
- Tolerance for document-level mismatch from line rounding: max `±0.50 PKR` per document.
- If tolerance exceeded: send to `gl_posting_errors` (`error_code = 'ROUNDING_EXCEEDED'`).

### 4.5 Tax code master (minimum)
- `PK_STD` → standard rated taxable sale
- `PK_ZERO` → zero-rated taxable supply
- `PK_EXEMPT` → exempt / non-taxable

---

## 5) 7-Day Implementation Checklist (Pilot)

### Day 1 — Foundations
- [ ] Confirm event payload contract for `SaleFinalized`, `Return`, `TillClose`, `PayrollJournal`.
- [ ] Freeze pilot COA codes and descriptions with Finance owner.
- [ ] Approve tax code set and inclusive/exclusive behavior.

### Day 2 — Data model
- [ ] Add migration `0002_finops_v1.sql` with tables listed above.
- [ ] Seed `gl_accounts` with pilot COA.
- [ ] Seed `gl_posting_rules` for four event types.

### Day 3 — Posting engine
- [ ] Implement deterministic posting service: `sync_events` → `gl_journal_entries` + `gl_journal_lines`.
- [ ] Enforce idempotency (`UNIQUE(source_event_id)`).
- [ ] Add dead-letter/error logging into `gl_posting_errors`.

### Day 4 — Till close + recon
- [ ] Extend `TillClose` payload to include expected/counted/deposit cash and branch/till IDs.
- [ ] Populate `finops_recon_daily` snapshots.
- [ ] Add variance statuses (`open/reviewed/closed`).

### Day 5 — Reporting endpoints and SQL checks
- [ ] Expose read APIs for journals and daily recon.
- [ ] Automate queries 3.1–3.6 for end-of-day runbook.
- [ ] Add downloadable CSV/JSON option for Finance review.

### Day 6 — UAT + controls
- [ ] UAT scenarios: cash sale, card sale, return, till close with variance, payroll journal.
- [ ] Validate trial balance always equals zero.
- [ ] Validate missing-postings and posting-error reports.

### Day 7 — Go-live readiness
- [ ] Pilot sign-off checklist completed (Finance + Ops + Engineering).
- [ ] Define daily close owner and escalation SLA for unresolved errors.
- [ ] Publish SOP addendum: "Finance Close v1" with cut-off times and approvals.

---

## 6) Open Risks / Decisions Needed

1. **Inventory COGS omitted in v1** (no stock ledger yet): acceptable for pilot?  
2. **Cash variance GL treatment**: post immediately to over/short account vs hold in recon-only until approval.  
3. **Payroll payment event**: currently only journal accrual specified; settlement event should be defined next sprint.  
4. **Tax/legal confirmation**: PK rates and invoicing requirements must be validated before production rollout.

---

## 7) Definition of Done (Pilot FinOps v1)

- All four event types can be ingested and deterministically posted.
- Journal entries are balanced and idempotent.
- Daily reconciliation reports run with no manual SQL edits.
- Tax-inclusive and tax-exclusive logic produces auditable net/tax/gross splits.
- Posting errors are visible, triaged, and reprocessable.
