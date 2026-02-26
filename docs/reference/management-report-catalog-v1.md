# Management Report Catalog v1

**Document ID:** REF-MGMT-REPORTS-1.0  
**Version:** 1.0 (Pilot Baseline)  
**Owner:** Product + Finance Ops + Reporting  
**Applies To:** HQ, Country, Branch Pilot Governance

---

## 1) Purpose
Define a standard report catalog for pilot governance across four stakeholder groups:
1. Upper Management (executive)
2. Middle Management (ops)
3. Tax Compliance
4. Legal/Audit

Each report includes intent, audience, cadence, source, KPIs, and action owner.

---

## 2) Report Metadata Standard (Use for every report)

- **Report ID:**
- **Report Name:**
- **Audience:**
- **Primary Use Case:**
- **Cadence:** (real-time / daily / weekly / monthly)
- **Delivery Channel:** (HQ web dashboard / email PDF / CSV export)
- **Data Window:** (intraday / D-1 / month-to-date / custom)
- **Primary Source Tables/Services:**
- **Key Metrics:**
- **Filter Dimensions:**
- **Owner:**
- **Backup Owner:**
- **Controls/Approvals:**
- **Retention Requirement:**

---

## 3) Upper Management Reports (Executive)

## U-01 Executive Daily Flash
- **Goal:** High-level health snapshot (sales, uptime, risk flags)
- **Cadence:** Daily 09:00 local
- **Core KPIs:**
  - Net sales (D-1)
  - Gross margin estimate
  - Active branches/tills
  - Outage minutes
  - High-severity incidents
- **Action Owner:** Country Ops Lead

## U-02 Weekly Pilot Scorecard
- **Goal:** Pilot performance vs target
- **Cadence:** Weekly
- **Core KPIs:**
  - Open/close compliance
  - Offline incident frequency/duration
  - Sync SLA attainment
  - Cash variance trend
  - Customer throughput trend
- **Action Owner:** Program Manager

## U-03 Monthly P&L Summary (Pilot)
- **Goal:** Finance-level profitability signal
- **Cadence:** Monthly
- **Core KPIs:**
  - Revenue by branch
  - COGS estimate
  - Operating costs (pilot attributable)
  - Net contribution
- **Action Owner:** Finance Controller

---

## 4) Middle Management Reports (Operations)

## M-01 Branch Daily Operations Dashboard
- **Goal:** Run each branch day-to-day
- **Cadence:** Near real-time + daily close
- **Core KPIs:**
  - Shift open on-time
  - Shift close completeness
  - Pending reconciliation count
  - Queue depth by till
  - Failed transaction count
- **Primary Users:** Branch Manager, Shift Supervisor

## M-02 Offline Incident & Recovery Tracker
- **Goal:** Monitor outages and closure quality
- **Cadence:** Real-time + daily summary
- **Core KPIs:**
  - Incident start/end time
  - Offline transaction volume
  - Time to recovery
  - Conflict counts by type
- **Primary Users:** Support + Ops

## M-03 Till Performance & Cash Variance Report
- **Goal:** Identify till-level risk and training needs
- **Cadence:** Daily/Weekly
- **Core KPIs:**
  - Cash over/short rate
  - Variance value distribution
  - Void/refund frequency
  - Supervisor override rate
- **Primary Users:** Branch Manager, Country Ops

## M-04 Staff Productivity & Compliance Report
- **Goal:** Compare shifts/teams and enforce SOP adherence
- **Cadence:** Weekly
- **Core KPIs:**
  - Transactions per cashier-hour
  - Avg basket size
  - SOP checklist completion
  - Late open/early close events
- **Primary Users:** Regional Ops, Training Lead

---

## 5) Tax Reports

## T-01 Daily Taxable Sales Summary
- **Goal:** Daily tax exposure by branch/tax class
- **Cadence:** Daily close
- **Core Fields/KPIs:**
  - Taxable amount
  - Tax collected
  - Exempt/zero-rated sales
  - Tax class distribution
- **Controls:** Locked after D+1 amendment window

## T-02 Tax Adjustment Register
- **Goal:** Track refunds/voids/adjustments impacting tax
- **Cadence:** Daily + monthly rollup
- **Core Fields/KPIs:**
  - Original txn reference
  - Adjustment reason code
  - Tax delta
  - Approval trail
- **Controls:** Dual approval for above-threshold adjustments

## T-03 Monthly Tax Filing Pack (Pilot)
- **Goal:** Filing-ready summary and evidence bundle
- **Cadence:** Monthly
- **Contents:**
  - Sales tax summary by branch
  - Tax collected vs payable
  - Adjustment schedules
  - Supporting exports and sign-off sheet
- **Owner:** Tax Lead

---

## 6) Legal/Audit Reports

## L-01 Audit Trail Integrity Report
- **Goal:** Validate immutable event capture and traceability
- **Cadence:** Weekly/On-demand
- **Core Checks:**
  - Missing audit links
  - Time drift anomalies
  - Unauthorized role actions
  - Log retention compliance
- **Owner:** Internal Audit / Platform

## L-02 Exception & Incident Register
- **Goal:** Single source of truth for operational/legal incidents
- **Cadence:** Daily update
- **Core Fields:**
  - Incident ID/severity
  - Regulatory relevance flag
  - Containment and closure notes
  - Responsible owner
- **Owner:** Operations Risk

## L-03 Access & Segregation-of-Duties (SoD) Review
- **Goal:** Ensure role boundaries and approval controls
- **Cadence:** Monthly
- **Core Checks:**
  - Shared account detection
  - Privilege escalation logs
  - Approval conflicts
  - Dormant user review
- **Owner:** Security + Compliance

---

## 7) Cross-Report Controls

- Standard timezone and business date rules
- Reconciliation against ledger and event store
- Role-based visibility (branch vs country vs HQ)
- Export watermarking and access logs
- Versioned metric definitions (single glossary reference)

---

## 8) Build Priority for Pilot (Suggested)

### Phase 1 (Must-Have)
- U-01 Executive Daily Flash
- M-01 Branch Daily Operations Dashboard
- M-02 Offline Incident & Recovery Tracker
- T-01 Daily Taxable Sales Summary
- L-02 Exception & Incident Register

### Phase 2 (Should-Have)
- U-02 Weekly Pilot Scorecard
- M-03 Till Performance & Cash Variance
- T-02 Tax Adjustment Register
- L-01 Audit Trail Integrity

### Phase 3 (Could-Have)
- U-03 Monthly P&L Summary
- M-04 Staff Productivity & Compliance
- T-03 Monthly Tax Filing Pack
- L-03 SoD Review

---

## 9) Open Items / Decisions Needed

- [ ] Final sign-off on KPI definitions (Finance/Ops)
- [ ] Threshold values for variance and incident severity
- [ ] Tax mapping validation by jurisdiction
- [ ] Evidence retention period by legal policy
- [ ] Final delivery channels and recipients
