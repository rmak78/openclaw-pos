# Sprint V1 — Repo Stabilization + CI/CD + Deploy Ops Plan

**Repo:** `openclaw-pos`  
**Objective (immediate):** get to a predictable, protected `main` branch with green required checks, controlled Cloudflare deployments, documented secret handling, D1 backup/restore readiness, and basic production observability.

---

## 0) Sprint outcome (Definition of Done)

- `main` is protected and mergeable only via PR + passing checks.
- CI failures are triaged and reduced to **zero known flaky failures**.
- Deploy to Cloudflare runs **only from `main`** (release workflow), never from feature branches.
- Environment/secrets matrix is documented and implemented in GitHub Environments.
- D1 backup/restore runbook is tested at least once in non-prod.
- Health/error/latency dashboard + alert thresholds are in place.

---

## 1) Failing checks strategy + branch flow (protected `main`)

### 1.1 Target branch flow

- `main` = protected, releasable branch.
- Work only on short-lived branches:
  - `feat/*`
  - `fix/*`
  - `chore/*`
  - `docs/*`
- Merge strategy: **Squash merge** (clean history).
- No direct pushes to `main`.

### 1.2 Required protection rules for `main`

Enable in GitHub Branch Protection:

- Require PR before merge.
- Required approvals: `1`.
- Dismiss stale approvals on new commits.
- Require Code Owner review (already has CODEOWNERS file).
- Require branches to be up to date before merge.
- Require conversation resolution.
- Disable force push + branch deletion.
- Required checks:
  - `lint-docs-and-yaml`
  - `shellcheck`
  - `git-hygiene`
  - `codeql (javascript-typescript)`
  - `codeql (python)`
  - `trivy-config-scan`

### 1.3 Immediate fix strategy for failing checks

Use this order so cheap/fast failures are fixed first:

1. **Lint first** (`lint-docs-and-yaml`)  
   - Fix markdown/yaml style issues before anything else.
2. **Shell hygiene** (`shellcheck`)  
   - Add shellcheck directives only when justified; prefer script fixes.
3. **Secret pattern guard** (`git-hygiene`)  
   - Remove/rotate any exposed token-like strings.
4. **Security scans** (CodeQL + Trivy)  
   - Triage into:
     - **Blocker:** exploitable in runtime path
     - **High priority:** likely risky but not immediately exploitable
     - **Deferred:** false positives or non-reachable paths

### 1.4 Anti-flake policy

- If a check flakes twice in 7 days: open `ci-flake` issue and fix/remove within same sprint.
- No "re-run until green" culture.
- Pin action versions by commit SHA (already done in current workflows; keep this standard).

### 1.5 PR quality gate (developer checklist)

- [ ] Local lint/docs pass
- [ ] No secret-bearing files changed (`.env`, keys, dumps)
- [ ] Migration impact assessed (if `data-model/migrations/*` changed)
- [ ] Rollback notes included in PR description when schema or deploy behavior changes

---

## 2) Release workflow — Cloudflare deploy from `main` only

### 2.1 Release model

- Deployment source of truth: **merge commit on `main`**.
- Trigger release workflow only on:
  - `push` to `main` (auto deploy), or
  - manual `workflow_dispatch` for controlled redeploy of known SHA.
- No deploy jobs on PR workflows.

### 2.2 Recommended GitHub Actions structure

- Keep `.github/workflows/ci.yml` = validation only.
- Add `.github/workflows/release-cloudflare.yml`:
  - `on: push: branches: [main]` (+ optional manual dispatch)
  - `needs`: logical gate after CI jobs (or rely on branch protection required checks)
  - deploy step:
    - `npm ci`
    - `npx wrangler deploy --env production`
  - optional post-deploy smoke checks against `/health`.

### 2.3 Environment protections

Use GitHub Environments:

- `production` environment:
  - required reviewers (at least 1 maintainer)
  - environment-scoped secrets
  - optional wait timer (5–10 min) for last-minute abort

### 2.4 Release tagging + rollback

- Tag every production deploy: `prod-YYYYMMDD-HHMM-<shortsha>`.
- Keep release notes minimal: commit range + migration notes.
- Rollback method:
  1. identify last known good SHA
  2. re-run release workflow with that SHA (workflow_dispatch) or revert commit and redeploy

---

## 3) Secrets + environment matrix

> Principle: least privilege, per-environment isolation, never commit secret values.

### 3.1 Environment matrix

| Key | Local dev | CI (PR) | Production (GitHub Env) | Notes |
|---|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | optional | no | **yes** | Scope: Workers + D1 for target account only |
| `CLOUDFLARE_ACCOUNT_ID` | optional | no | **yes** | Non-secret but keep centralized |
| `APP_ENV` | `dev` | `ci` | `production` | Should align with wrangler env |
| `D1_DATABASE_ID` | local optional | no | **yes** | Use prod DB id only in prod env |
| `D1_DATABASE_NAME` | optional | no | **yes** | Helpful for backup scripts |
| `HEALTHCHECK_URL` | optional | optional | **yes** | Used for post-deploy smoke/monitoring |
| `SENTRY_DSN` (if used) | optional | no | optional/yes | Error tracking integration |

### 3.2 Storage policy

- Local: `.env.local` (gitignored).
- GitHub:
  - repo-level non-sensitive vars (if needed)
  - **environment secrets** for production tokens
- Cloudflare credentials:
  - prefer API token with minimum permissions, not global key.

### 3.3 Rotation + incident response

- Rotate Cloudflare token every 90 days (or immediately on contributor offboarding).
- If leak suspected:
  1. revoke token
  2. issue new token
  3. update GitHub Environment secret
  4. validate deploy pipeline
  5. document incident in `docs/operations/` postmortem

---

## 4) D1 backup/restore runbook (exports)

> Goal: deterministic recovery path for Cloudflare D1 using periodic exports.

### 4.1 Backup cadence

- **Daily** automated export of production D1.
- Keep:
  - daily backups × 14 days
  - weekly backups × 8 weeks
  - monthly backups × 6 months
- Store encrypted backups in controlled storage (private bucket/artifact store).

### 4.2 Backup command pattern (example)

```bash
# Export current D1 DB to SQL dump
npx wrangler d1 export openclaw_pos --remote --output ./exports/d1/openclaw_pos_$(date +%F_%H%M%S).sql
```

If your Wrangler version uses different flags/subcommands, lock a project script (`npm run d1:backup`) and use that consistently.

### 4.3 Restore procedure (staging rehearsal first)

1. Confirm incident scope (data loss vs corruption vs accidental migration).
2. Freeze writes (maintenance mode or temporary write block).
3. Select restore point (latest clean backup before incident).
4. Restore into **staging clone** first and validate:
   - row counts on critical tables
   - smoke tests for key flows
5. Restore production database from validated dump.
6. Run post-restore verification checklist.
7. Re-enable writes.
8. Publish incident summary + corrective actions.

### 4.4 Verification checklist (post-restore)

- [ ] Migration version is expected
- [ ] Critical tables row counts match expected range
- [ ] API health endpoint returns healthy
- [ ] Read/write checkout flow passes smoke test
- [ ] No elevated error rate in first 15 minutes

### 4.5 Runbook ownership

- Primary owner: DevOps maintainer
- Backup owner: Tech lead
- Quarterly game-day: simulate restore to staging

---

## 5) Observability checklist (health, error rate, latency)

### 5.1 Minimum telemetry to enable now

- **Health:** `/health` endpoint with dependency checks (D1 connectivity).
- **Errors:** structured logs + exception capture (Sentry or equivalent).
- **Latency:** p50/p95 response time per endpoint.

### 5.2 SLI/SLO starter targets (MVP)

- Availability SLO: `99.5%` monthly for API.
- Error-rate SLO: `<1%` 5xx over 15 min rolling window.
- Latency SLO:
  - p95 `<500ms` for read endpoints
  - p95 `<900ms` for write endpoints

### 5.3 Alert thresholds (actionable)

- **Critical:**
  - health check down for 5 min
  - 5xx error rate > 3% for 10 min
- **Warning:**
  - p95 latency > 1.2s for 15 min
  - sudden traffic drop > 40% baseline

### 5.4 Dashboard must include

- Request volume (RPS)
- 2xx/4xx/5xx rates
- p50/p95 latency
- D1 query latency / failure count
- Last deploy timestamp + commit SHA

### 5.5 On-call quick response checklist

- [ ] Identify if issue is deploy-correlated (check last SHA/time)
- [ ] Validate health endpoint + D1 reachability
- [ ] If deploy-related, rollback to previous known-good SHA
- [ ] Capture timeline and mitigation in incident doc

---

## 6) Sprint execution plan (7-day immediate)

### Day 1–2: CI and branch protection hardening

- Apply/verify `main` branch protection settings.
- Triage current failing checks and open fix PRs.
- Ensure required checks in protection exactly match workflow job names.

### Day 3: Release workflow implementation

- Add `release-cloudflare.yml` (main-only deploy).
- Configure `production` GitHub Environment + reviewer gate.
- Test deploy from a controlled merge.

### Day 4: Secrets matrix implementation

- Add/update `.env.example` schema (no values).
- Add production environment secrets and validate least privilege.
- Document rotation owner + schedule.

### Day 5: D1 backup/restore rehearsal

- Add backup script and storage path convention.
- Run first backup.
- Perform restore drill to staging and capture timing.

### Day 6–7: Observability + closeout

- Stand up dashboard/alerts for health, errors, latency.
- Validate alerts trigger and are actionable.
- Publish sprint closeout notes with gaps moved to Sprint V2.

---

## 7) Risks and mitigations

- **Risk:** CI jobs pass locally but fail in Actions due to env drift.  
  **Mitigation:** pin tool versions and use `npm ci`.

- **Risk:** Accidental deploy from non-main branch.  
  **Mitigation:** release workflow triggers only on `main`; no deploy steps in PR workflows.

- **Risk:** Backup exists but restore untested.  
  **Mitigation:** mandatory staging restore rehearsal every quarter.

- **Risk:** Alert fatigue from noisy thresholds.  
  **Mitigation:** tune thresholds after 2 weeks using baseline traffic.

---

## 8) Immediate follow-up artifacts to add (next PRs)

- `.github/workflows/release-cloudflare.yml`
- `docs/operations/d1-backup-restore.md` (expanded runbook from section 4)
- `scripts/backup-d1.sh` and `scripts/restore-d1.sh` (if scripts directory is adopted)
- `docs/operations/incident-template.md`
