# Pilot Branch SOP Packet v0.1

**Document ID:** OPS-PILOT-SOP-0.1  
**Version:** 0.1 (Draft for 2-Branch Pilot)  
**Effective Date:** _TBD_  
**Applies To:** Pilot Branch A, Pilot Branch B  
**Audience:** Cashier, Shift Supervisor, Branch Manager, Country Ops, Support  
**Owner:** Product + Operations  
**Approvers:** Country Ops Lead, Finance Controller, Platform Lead

---

## 0) Purpose, Scope, and Non-Negotiables

### Purpose
Provide one frontline-ready SOP packet for daily pilot operations across:
1. Shift Open
2. Shift Close
3. Offline Mode
4. Sync Recovery

### Scope
- Till POS (branch-side)
- Branch web operational checks
- Daily handover and incident logging

### Non-Negotiables
- No shared user credentials
- Every till action must be attributable (user/timestamp/till)
- Variance and incident events must be logged before day close

---

## 1) Role Matrix (RACI)

| Activity | Cashier | Shift Supervisor | Branch Manager | Support Agent | Finance |
|---|---|---|---|---|---|
| Open Shift | R | A | I | C | I |
| Close Shift | R | A | C | I | C |
| Offline Activation | R | A | I | C | I |
| Sync Recovery (Auto) | I | C | I | A | I |
| Sync Conflict Resolution | I | C | C | R | A |
| Daily Sign-Off | I | C | A | I | C |

> R = Responsible, A = Accountable, C = Consulted, I = Informed

---

## 2) SOP-01: Open Shift (Frontline)

### Objective
Open till safely with verified float, healthy devices, and readiness to transact.

### Preconditions Checklist
- [ ] Staff member rostered and credentials active
- [ ] Till powered and peripherals connected
- [ ] Network/sync indicator checked
- [ ] Opening float prepared (sealed or counted)

### Step-by-Step Procedure
1. Cashier login (individual credentials only)
2. Confirm branch ID / till ID / shift date on screen
3. Float count with supervisor witness
4. Enter float by denomination
5. Supervisor verification + approval
6. Run readiness checks:
   - printer test
   - scanner test
   - payment terminal handshake
   - sync health badge
7. Generate opening proof (print/digital)
8. Mark till status **Ready**

### Control Points
- Dual verification for float entry
- Mandatory mismatch reason before proceeding
- All checks timestamped in audit log

### Failure Paths (Skeleton)
- **No internet at open:** route to SOP-03
- **Device failure:** assign backup till, create incident ticket
- **Auth failure:** escalate to branch manager + support

---

## 3) SOP-02: Close Shift (Frontline)

### Objective
Close with full reconciliation, variance handling, and secure handover.

### Preconditions Checklist
- [ ] Last transaction completed
- [ ] Suspended transactions resolved
- [ ] Payment batch close window confirmed

### Step-by-Step Procedure
1. Select **Close Shift**
2. Export/print shift summary
3. Physical cash count by denomination
4. Compare expected vs actual
5. Enter variance (if any) + reason code
6. Supervisor review and approval
7. Close terminal batch
8. Generate end-of-shift packet (summary + variance + events)
9. Secure cash and complete handover log
10. Sign out and lock till

### Control Points
- Cannot close without variance reason when mismatch exists
- Threshold-based supervisor/manager approval matrix
- Mandatory signed handover entry

### End-of-Day Outputs
- Shift close report
- Cash variance log
- Offline/sync appendix (if applicable)

---

## 4) SOP-03: Offline Mode (Frontline)

### Objective
Maintain controlled sales during connectivity outage while preserving data integrity.

### Trigger Conditions
- Sync service disconnected beyond threshold
- Gateway/API unavailable
- HQ outage advisory received

### Allowed vs Restricted Transactions

#### Allowed
- [ ] Cash sale
- [ ] Approved card fallback (if enabled)
- [ ] Basic returns under threshold (policy-based)

#### Restricted
- [ ] Loyalty earn/redeem requiring live check
- [ ] Cross-branch stock transfers
- [ ] Credit/on-account transactions
- [ ] Promotions requiring central validation

### Step-by-Step Procedure
1. Supervisor confirms and records offline start
2. Activate/confirm **Offline Banner** on till
3. Continue only allowed transaction classes
4. Ensure each txn gets offline sequence ID
5. Queue encrypted records locally
6. Log manual exceptions in incident log
7. Reconnect attempts at policy interval

### Control Points
- Offline duration ceiling (e.g., 4 hours)
- Offline transaction cap per till
- High-risk actions require supervisor PIN

### Customer Messaging Script (Template)
- “We’re currently operating in fallback mode. Your receipt is valid and your transaction will sync shortly.”

---

## 5) SOP-04: Sync Recovery (Frontline + Support)

### Objective
Synchronize queued transactions safely after connectivity restoration and resolve conflicts.

### Entry Criteria
- Connectivity restored
- Till health checks green
- Queue integrity check passed

### Recovery Flow
1. Detect reconnect event
2. Validate clock/time drift and queue checksum
3. Sync oldest-first in ordered batches
4. Use idempotency keys per transaction
5. Mark successful acknowledgments
6. Route failures/conflicts to reconciliation queue
7. Publish sync completion status to branch

### Conflict Classes (Pilot v0.1)
- **Duplicate transaction ID** → keep first accepted, flag duplicate
- **Stock mismatch** → preserve sale, create inventory adjustment task
- **Payment mismatch** → escalate to finance reconciliation queue
- **Tax rule mismatch** → hold for tax/legal review

### Manual Recovery Runbook (Support)
- Retry transient failures (N attempts)
- Annotate non-recoverable errors with code + owner
- Confirm queue depth returns to zero or exceptions assigned

### Exit Criteria
- Queue depth = 0 or all exceptions assigned
- Branch notified of final status
- Daily sync recovery summary signed by manager

---

## 6) Escalation & Communications Matrix

### Escalation Levels
- **L1 (0–15 min):** Branch Supervisor
- **L2 (15–45 min):** Country Ops
- **L3 (45+ min):** Support / Platform Ops
- **L4 (Financial impact):** Finance Controller
- **L5 (Regulatory risk):** Tax/Legal contact

### Required Incident Fields
- Branch ID, Till ID, Shift ID
- Start/end time
- Incident type/severity
- Actions taken
- Owner and ETA

---

## 7) Pilot Acceptance Criteria (v0.1)

- [ ] 95%+ on-time shift open rate
- [ ] 100% shift close packet completeness
- [ ] Offline incidents captured with start/end in logs
- [ ] Sync recovery average < defined SLA
- [ ] All variance cases have approved reason codes

---

## 8) Appendices (Templates to be filled)

### Appendix A — Opening Float Count Sheet
- Date / Shift / Till / Cashier / Supervisor
- Denomination table
- Expected vs Counted vs Variance

### Appendix B — Shift Close Reconciliation Sheet
- Tender-wise totals
- Variance reasons
- Sign-off blocks

### Appendix C — Offline Incident Log
- Outage start/end
- Allowed transactions count
- Exceptions list

### Appendix D — Sync Recovery Summary
- Queue depth at start/end
- Success/failure counts
- Conflict categories and owners

### Appendix E — Exception Codes Catalog
- _TODO: link to reference exception codebook_
