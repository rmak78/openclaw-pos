# Architecture Supervision Report — 2026-02-27

Scope reviewed:
- Current repository state (`main` + migration chain + API implementation)
- Open issues/PR landscape on `rmak78/openclaw-pos`
- Architecture quality focus: module boundaries, offline-sync/idempotency, migration sequencing

## 1) Repository + PR/Issue Snapshot

- Open issues: **0**
- Open PRs: **11** (`#12 #15 #16 #26 #27 #28 #29 #30 #31 #32 #33`)
- Architectural signal:
  - PR `#28` is the canonical payroll consolidation and correctly moves payroll migrations to `0012/0013/0014`.
  - PRs `#12/#15/#16` are superseded but still open and still introduce conflicting historical migration numbers (`0007/0008` payroll).
  - PRs `#27/#29/#30/#31/#32/#33` heavily overlap around docs/tests/web and increase merge ordering complexity.

## 2) Module Boundary Assessment

### Current state

- Runtime/API is implemented in a **single large router file**: `src/index.ts`.
- Database schema is additive and module-themed in migrations (`core`, `offline`, `sales`, `till`, `procurement`, `returns`, pending payroll in PR #28).
- Functional domains are visible but not physically isolated in code.

### Boundary integrity (score: **medium risk**)

Strengths:
- Data model already groups by domain tables (sales, till, procurement, sync, payroll).
- Route catalog in `/v1/modules` reflects domain intent.

Risks:
1. **God-router coupling**: cross-domain side-effects are embedded directly in handlers (e.g., sales/inventory/sync writes together), making invariants hard to reason about.
2. **Missing domain service layer**: no explicit domain application services for transaction boundaries and policies.
3. **Boundary leakage**: procurement handlers mutate inventory directly; returns handlers directly update stock + movements with no dedicated inventory policy gateway.
4. **Testability bottleneck**: without per-domain modules, isolation tests and contract tests will be brittle.

Recommendation:
- Split into `src/modules/{core,sync,sales,till,procurement,payroll}/` with per-domain routes + service + repository layers.
- Keep a thin `index.ts` composition root only.

## 3) Offline Sync + Idempotency Integrity

### Observed

- Offline primitives exist:
  - `sync_outbox` (`idempotency_key UNIQUE`, retry metadata)
  - `sync_conflicts`
- Sales receipt creation enqueues sync outbox in same batch.
- Several write endpoints are plain inserts keyed by caller-provided IDs.

### Integrity assessment (score: **medium-high risk**)

Strengths:
- Outbox table has structural idempotency key uniqueness.
- Some deterministic IDs can naturally de-duplicate at PK level.

Gaps:
1. **No uniform API idempotency contract** for all mutating endpoints (no shared `Idempotency-Key` handling + response replay store).
2. **No explicit inbox/processed-event guard** for inbound webhook/event replays beyond ad hoc key choices.
3. **No server-owned sync batch endpoint** from architecture plan (`/v1/sync-events/batch`) that enforces batch + event + domain idempotency tiers.
4. **Retry lifecycle incomplete**: outbox has retry fields but no worker/state-machine implementation in repo enforcing backoff and poison/dead-letter behavior.
5. **Conflict resolution policy not executable**: schema exists, but no conflict arbitration engine or resolution transitions.

Recommendation:
- Introduce shared idempotency middleware + persisted response ledger.
- Implement sync protocol endpoint and replay-safe processing pipeline.

## 4) Migration Sequencing Risk Review

### Current chain in `main`
`0001, 0002, 0003, 0004, 0005, 0006, 0007, 0008, 0011`

### Risks

1. **Non-contiguous numbering** (`0009`, `0010` missing in main): not fatal, but signals branch-history churn; can confuse operators and release tooling.
2. **Superseded open PR collisions**:
   - `#12/#15/#16` use `0007/0008` payroll migration numbers that conflict with already-merged procurement migrations.
   - If merged accidentally, migration chain integrity is compromised.
3. **Unsafe ALTER pattern potential**:
   - `0011_returns_refunds_controls.sql` uses direct `ALTER TABLE ... ADD COLUMN` statements without idempotent guards; reruns or drifted environments may fail.
4. **Cross-PR ordering sensitivity**:
   - `#27` contains payroll migrations `0012-0014` + other broad changes; if merged with overlapping PRs out of sequence, operational traceability and deployment certainty degrade.

Recommendation:
- Close superseded payroll PRs after merging `#28`.
- Enforce migration lint in CI (unique version, no duplicate filenames, rerunnable-safe DDL checks where possible).

## 5) Next 5 Architecture-Critical Tasks (Priority Ordered)

1. **Merge strategy hardening for migration integrity**
   - Merge `#28` (canonical payroll) first; close `#12/#15/#16` immediately.
   - Define release gate: no PR with duplicate/retroactive migration number may merge.

2. **Implement global idempotency layer for all POST/transition endpoints**
   - Add `idempotency_requests` store (`scope,key,request_hash,response,status,created_at`).
   - Require `Idempotency-Key` for financial/stock/approval mutations.

3. **Ship sync protocol v1 (server authoritative)**
   - Build `/v1/sync-events/batch` with batch/event/domain idempotency checks.
   - Add deterministic duplicate response behavior and cursored pull watermark.

4. **Refactor monolith router into bounded modules**
   - Extract per-domain modules + service/repo boundaries.
   - Introduce transaction scripts for cross-domain workflows (sale post, return+restock, GRN+inventory, payroll approval).

5. **Migration reliability controls in CI/CD**
   - Add migration manifest check, apply-dry-run on clean DB + upgraded DB, and rerun safety test.
   - Block merge if migration order/compatibility checks fail.

## Action Checklist

- [ ] Merge PR #28 and close PRs #12, #15, #16 as superseded.
- [ ] Add global idempotency middleware + persistence table.
- [ ] Implement `/v1/sync-events/batch` with deterministic replay semantics.
- [ ] Create `src/modules/*` domain split and move handlers incrementally.
- [ ] Add migration CI policy: sequence, collision, dry-run upgrade path, rerun safety.

## Supervisory Verdict

Architecture direction is solid, but **execution risk is now in integration discipline**:
- code boundaries are too centralized,
- idempotency is partial rather than systemic,
- migration hygiene is vulnerable to overlapping PR streams.

If the five actions above are completed in order, the platform can move from “feature-accumulating” to “operationally reliable under offline and multi-branch stress.”
