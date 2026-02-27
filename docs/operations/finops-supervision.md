# FinOps Supervision Notes (Returns, Procurement, Payments, Day-Close)

Date: 2026-02-27
Scope audited:
- `src/index.ts` API flows
- `data-model/migrations/0004`, `0005`, `0006`, `0007`, `0008`, `0011`

## Executive Summary

Current implementation demonstrates strong **foundational coverage** for POS FinOps flows, but there are control gaps that can impact accounting reliability in production:

1. **Migration sequencing risk (high):** `0011_returns_refunds_controls.sql` alters `sales_returns` and `sales_refunds`, but baseline creation for those tables is not present in migrations currently in-repo.
2. **Procurement API compile/runtime risk (high):** purchase-order create path references `initialStatus` without declaration.
3. **Posting/reconciliation integrity gaps (medium-high):** no strict cross-check that split payments equal receipt total, and refund posting does not enforce return approval in API logic.
4. **Variance/day-close governance gaps (medium):** no close-state guardrails on till session close and limited reconciliation linkage between cash drops, till close, and branch-level reconciliation snapshot.

These are fixable with small, targeted hardening changes plus policy checks.

## 1) Posting Controls

### What exists
- Sales receipt writes force `posted_to_ledger = 1` and enqueue sync outbox event (`/v1/sales-receipts` POST).
- Sales return line can auto-create inventory reversal movement (`movement_type='sale_return'`) and update stock on hand.
- Procurement GRN updates inventory and PO line received quantities.

### Control gaps
1. **Missing base return/refund DDL in migration chain**
   - `0011_returns_refunds_controls.sql` does `ALTER TABLE sales_returns ...` and `ALTER TABLE sales_refunds ...`.
   - No migration in current chain creates `sales_returns`, `sales_return_lines`, `sales_refunds` before `0011`.
   - Risk: migration failure in clean environments; inconsistent schemas across environments.

2. **PO creation uses undefined `initialStatus`**
   - In `src/index.ts` purchase-order POST, `initialStatus` is used in INSERT/response/event, but not declared.
   - Risk: TypeScript compile failure or runtime failure depending build path.

3. **Refund policy not enforced at posting point**
   - `/v1/sales-refunds` inserts refunds without checking return approval state (`approval_status`).
   - Risk: unauthorized/early refunds, weak financial controls.

4. **Payment split completeness not enforced**
   - No API check that sum of `sales_receipt_payments.amount` equals `sales_receipts.total_amount`.
   - Risk: incomplete tender capture and reconciliation breaks.

## 2) Reconciliation Integrity

### What exists
- `branch_reconciliations` stores expected/counted/variance and status.
- `day-close-summary` reports receipts + payment method totals + reconciliation row.
- `variance_reasons` supports attribution.

### Integrity gaps
1. **Day-close payment totals include all settlement states**
   - Summary query does not filter `sales_receipt_payments.settlement_status`.
   - Risk: pending/failed tenders inflating apparent collections.

2. **No hard linkage between till close and branch reconciliation lifecycle**
   - Till close can happen independently of branch reconciliation and without variance reason when non-zero variance.
   - Risk: closures with unresolved exceptions.

3. **No duplicate-refund prevention guard in API layer**
   - Multiple refunds can be posted for same return without cap check against return total.
   - Risk: over-refunds and manual clean-up.

## 3) Variance Handling

### What exists
- `variance_reasons` table supports coding notes against till session or branch reconciliation.
- till close computes variance = counted - expected.

### Gaps
1. **Variance reason not mandatory for material variance**
   - API allows closing till with any non-zero variance and no reason.
2. **No threshold policy model**
   - No app-config threshold (e.g., absolute or % threshold) to auto-route to investigate/approval.
3. **No explicit approver metadata for till close exceptions**
   - Missing approved-by / approved-at for forced closures with variance.

## 4) Accounting Edge Cases

1. **Negative/invalid quantities and amounts**
   - Several endpoints rely on caller discipline; DB has limited CHECK constraints.
2. **Cross-currency controls**
   - Currency fields exist, but no API guard that return/refund/receipt currencies match originating document.
3. **Procurement receiving against unspecified PO line**
   - GRN line update attempts PO line update even when `purchase_order_line_id` not provided (`?? ""`), silently no-op.
4. **Idempotency coverage**
   - Strong in sync_outbox keying for receipts; weaker for business operations like refunds/GRN posts (no operation idempotency key).

## Recommended Hardening Backlog (Prioritized)

### P0 (must-fix)
1. Add canonical migration for base returns/refunds tables before `0011` (or fold to canonical single migration with safe guards).
2. Fix purchase-order POST `initialStatus` declaration/validation.
3. Enforce refund preconditions:
   - return exists,
   - approval status is approved,
   - cumulative refund <= approved return total.

### P1
1. In day-close payment rollup, default to `settlement_status='captured'` (or expose settled vs pending separately).
2. Enforce payment split balancing rule at posting completion:
   - Σ payment splits = receipt total (within tolerance).
3. Require variance reason for non-zero variance above configurable threshold.

### P2
1. Add CHECK constraints for non-negative monetary fields and sensible status enums where missing.
2. Add idempotency keys to refund/GRN/till-close write APIs.
3. Add reconciliation snapshot table for immutable day-close lock records.

## Suggested Control Tests (minimum)

1. **Migration smoke** on clean DB must apply full chain successfully.
2. **Refund approval gate** test: unapproved return refund attempt rejected.
3. **Over-refund test**: second refund exceeding return amount rejected.
4. **Payment split balance**: posting finalized only when balanced.
5. **Variance policy**: close blocked or escalated when variance exceeds threshold without reason.

## Conclusion

The domain model is directionally strong and close to pilot-ready, but key financial control points still rely on convention rather than enforceable safeguards. Addressing the P0 items will materially improve posting correctness, auditability, and reconciliation confidence.
