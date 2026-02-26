# Branch + Till SOP Outline

Scope: branch-level daily operations for till workflows, including shift open/close, offline mode, and sync recovery.

## 1) Roles and Responsibilities

- **Cashier**: executes till transactions and end-of-shift reconciliation.
- **Shift Supervisor**: authorizes variance actions and shift closure.
- **Branch Manager**: approves exceptions, audits branch controls.
- **Support Agent**: resolves technical incidents and sync failures.

## 2) SOP-01: Open Shift

### Objective
Start till operations with verified float, active user session, and successful system health checks.

### Preconditions
- Assigned user has active credentials.
- Till device is powered and connected (or has approved offline fallback).
- Branch is marked as open in branch schedule.

### Steps
1. Cashier signs in with individual credentials.
2. Confirm branch, till ID, and shift ID on screen.
3. Count opening float with Shift Supervisor present.
4. Enter opening float amount and denomination split.
5. Supervisor verifies and confirms opening float.
6. Run till health checks:
   - printer availability
   - scanner status
   - payment terminal link
   - sync status indicator
7. Print/opening receipt or save digital open log.
8. Start first transaction only after status is **Ready**.

### Controls
- No shared cashier logins.
- Float confirmation requires supervisor acknowledgment.
- Any mismatch must be recorded before first sale.

### Exceptions
- If network unavailable: switch to SOP-03 (Offline Mode).
- If hardware fails: raise incident and move to backup till.

---

## 3) SOP-02: Close Shift

### Objective
Close the till with complete transaction reconciliation and secure handover.

### Preconditions
- Last customer transaction completed.
- Pending suspended transactions resolved or transferred.

### Steps
1. Cashier selects **Close Shift**.
2. System prints/exports shift transaction summary.
3. Count physical cash by denomination.
4. Compare expected vs actual cash.
5. Record variance reason code if non-zero difference.
6. Supervisor reviews and approves closure.
7. Close payment terminal batch (if applicable).
8. Generate and store end-of-shift report.
9. Secure cash per branch policy and handover log.
10. Sign out cashier session.

### Controls
- Shift cannot close without variance reason for mismatch.
- Supervisor approval required above threshold variance.
- All closure records stored with timestamp and user IDs.

### Exceptions
- If sync pending at close time: close locally and follow SOP-04.

---

## 4) SOP-03: Offline Mode Operations

### Objective
Continue controlled sales when internet/service connectivity is unavailable.

### Trigger Conditions
- Sync status shows **Offline** for configured threshold (example: > 60 seconds).
- Payment gateway timeout exceeds retry policy.

### Allowed in Offline Mode
- Cash sales
- Approved local card fallback (if policy permits)
- Receipt issuance from local queue

### Restricted in Offline Mode
- Real-time loyalty/redemption checks
- Live inventory reservations across branches
- Centralized promo validation requiring server checks
- Credit/account sales requiring online authorization

### Steps
1. Supervisor confirms offline incident start time.
2. Till enters **Offline Mode** and displays banner.
3. Cashier continues only allowed transaction types.
4. Every transaction receives local offline sequence ID.
5. Store transactions in encrypted local queue.
6. Track manual exceptions in branch incident log.
7. Attempt auto-reconnect at configured intervals.

### Controls
- Max offline transaction/time thresholds must be enforced.
- High-risk actions require supervisor PIN.
- End-of-day branch report must include offline summary.

---

## 5) SOP-04: Sync Recovery

### Objective
Safely synchronize offline transactions and resolve conflicts after connectivity returns.

### Preconditions
- Network restored and service health is green.
- No active till maintenance lock.

### Recovery Flow
1. System detects connectivity restoration.
2. Validate device time drift and queue integrity.
3. Start sync from oldest queued transaction.
4. Submit in ordered batches with idempotency keys.
5. Capture acknowledgments and mark successful items.
6. Route failed/conflict items to reconciliation queue.
7. Generate sync completion report.

### Conflict Handling Rules (Outline)
- Duplicate transaction ID: keep first accepted record, flag duplicate.
- Price/inventory mismatch: preserve sale event, flag inventory reconciliation.
- Payment confirmation mismatch: escalate to finance reconciliation workflow.

### Manual Recovery (Support Agent)
1. Review branch/till sync dashboard.
2. Reprocess transient failures.
3. Annotate non-recoverable records with issue code.
4. Confirm branch receives final reconciliation status.

### Exit Criteria
- Queue depth returns to zero.
- All conflicts assigned/closed with owner.
- Branch Manager signs off daily recovery summary.

---

## 6) Operational Metrics to Track

- Shift open success rate
- Shift close variance rate and value
- Offline incidents per branch per week
- Average offline duration
- Sync recovery success time
- Conflict rate per 1,000 transactions

## 7) Escalation Matrix (Template)

- **L1 Branch**: Shift Supervisor (0-15 min)
- **L2 Country Ops**: Country Operations Lead (15-45 min)
- **L3 Technical**: Support Agent / Platform Ops (45+ min)
- **L4 Finance Control**: Financial Controller (for settlement conflicts)
