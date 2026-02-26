# Omnichannel Commerce Extension (Future-Ready)

## Objective
Ensure openclaw-pos can support country websites, online sales, dispatch, and marketplace channels without core redesign.

## In Scope (Architecture Readiness)
- Country storefronts (own web shop)
- Multi-channel connectors (Daraz, Amazon, Temu, Alibaba, AliExpress, Noon, Shopify, etc.)
- Unified order intake + dispatch orchestration
- Channel-specific pricing/tax/promo mapping
- Inventory reservation and fulfillment status sync

## Design Principles
1. **Channel adapters, not channel-specific core logic**
2. **Canonical order model** inside openclaw-pos
3. **Idempotent ingestion** for webhooks/polling
4. **Event-driven state transitions** for orders/dispatch/refunds
5. **Country policy-aware checkout/tax rules**
6. **Operational fallback for offline branch fulfillment**

## Proposed Bounded Context Additions
- `commerce-catalog`
- `commerce-orders`
- `commerce-payments`
- `commerce-fulfillment`
- `channel-connectors`
- `dispatch-logistics`

## Canonical Entities (minimum)
- `sales_channels` (own-site, daraz, amazon, etc.)
- `channel_accounts` (auth, region, store id)
- `channel_products` (listing ↔ SKU mapping)
- `channel_orders` (raw payload + normalized reference)
- `orders` / `order_lines` (canonical)
- `order_payments`
- `fulfillment_orders`
- `dispatch_shipments`
- `shipment_events`
- `returns_rma` (shared with Returns module)

## Required Integration Contracts
- `OrderCreated`
- `OrderPaid`
- `OrderCancelled`
- `ShipmentCreated`
- `ShipmentDelivered`
- `ReturnRequested`
- `ReturnApproved`
- `RefundIssued`

All contracts should include:
- channel source + external IDs
- idempotency key
- country/currency/tax mode
- timestamps (local + UTC)
- schema version

## Fulfillment & Dispatch Readiness
- Branch or warehouse dispatch source selection
- Pick/pack/ship status machine
- Courier abstraction (multiple logistics providers)
- Waybill/tracking mapping per carrier
- Delivery SLA and exception handling

## Reporting Additions
- Channel revenue & margin by country/channel
- Order-to-ship lead time
- Cancellation/refund rates by channel
- Dispatch SLA adherence
- Settlement reconciliation by marketplace

## Security & Compliance
- Per-channel token vaulting and rotation
- PII minimization in logs
- Country data-residency policy hooks
- Audit trail for order edits/refunds

## Implementation Strategy (when you decide to build)
Phase 1:
- Canonical order + channel adapter interface + Shopify + own-site

Phase 2:
- Daraz + Amazon + Noon adapters, dispatch orchestration

Phase 3:
- Remaining channels (Temu, Alibaba, AliExpress), advanced settlement reconciliation

## Note
This document intentionally sets architectural room now; execution can start later without reworking core POS/ERP foundations.
