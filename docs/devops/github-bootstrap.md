# GitHub Bootstrap (Public OSS + Free Tier)

## 1) Repository bootstrap checklist

- [ ] Create public repo: `global-pos-erp`
- [ ] Default branch: `main`
- [ ] Enable branch protection on `main`
- [ ] Require pull request before merge (min 1 review)
- [ ] Require status checks to pass (`CI`, `Security`)
- [ ] Require conversation resolution before merge
- [ ] Disable force pushes and branch deletion on `main`
- [ ] Enable Dependabot alerts + security updates
- [ ] Enable secret scanning + push protection (public repos)
- [ ] Add CODEOWNERS and templates under `.github/`
- [ ] Add OpenSSF Scorecard badge once first run is active

## 2) Branch strategy

- `main` = protected, releasable
- `feat/*`, `fix/*`, `chore/*`, `docs/*` = short-lived branches
- Squash merge only for clean audit trail
- Tags: `vYYYY.MM.DD-N` (or semver later)

## 3) Branch protection (required)

Apply to `main`:

- Require PR before merge
- Required approvals: 1
- Dismiss stale approvals on new commits
- Require review from Code Owners
- Require status checks before merge
  - `lint-docs-and-yaml`
  - `shellcheck`
  - `git-hygiene`
  - `codeql (javascript-typescript)`
  - `codeql (python)`
  - `trivy-config-scan`
- Require branches to be up to date
- Require conversation resolution
- Do not allow force pushes
- Do not allow deletions

## 4) Free-tier environment matrix

| Environment | Purpose | Platform (free tier) | Data | Access model | Notes |
|---|---|---|---|---|---|
| Dev | PR previews / smoke tests | GitHub Actions + local Docker | Ephemeral | Maintainers only | No paid runners |
| Staging | Shared integration test | Fly.io free allowance OR Render free web service | Neon/Supabase free Postgres | Team + QA | Auto-sleep acceptable |
| Production (MVP) | Low-traffic public demo | Render/Fly/Railway free tier (pick one) | Managed free Postgres + object storage free tier | Public app, admin restricted | Keep single region to minimize latency/cost |
| Observability | Logs + uptime | Better Stack free / Uptime Kuma self-hosted on free VM | N/A | Maintainers | Keep retention limits in mind |
| Docs | Architecture + runbooks | GitHub Pages | N/A | Public | Auditability by default |

Recommended zero-cost baseline:
- App/API: Render free web service (or Fly.io free allowance)
- Database: Neon free Postgres
- Cache/queue (optional early): Upstash free Redis
- Assets/backups: Cloudflare R2 free tier bounds (or Backblaze B2 free credits)

## 5) CI/CD plan (public auditable)

1. **PR CI (required checks)**
   - Markdown/YAML lint
   - Shell script lint
   - Basic secret-pattern guard
   - CodeQL + Trivy scans

2. **Merge to main**
   - Re-run CI
   - Build immutable artifact/container tagged by commit SHA
   - Publish provenance/SBOM artifact (later phase)

3. **Deploy strategy (free-tier safe)**
   - Staging auto deploy from `main`
   - Production deploy manually approved (GitHub Environment protection)
   - Rollback = redeploy previous SHA

4. **Release governance**
   - Signed tags optional at phase 2
   - Changelog generated from PR labels
   - Post-deploy smoke checks

## 6) Secrets policy

- Never commit secrets to git (including `.env`)
- Use GitHub Actions Environments (`staging`, `production`) for scoped secrets
- Minimum secrets at start:
  - `DATABASE_URL`
  - `REDIS_URL` (if used)
  - `JWT_PRIVATE_KEY`
  - `CLOUD_STORAGE_ACCESS_KEY`
  - `CLOUD_STORAGE_SECRET_KEY`
  - `THIRD_PARTY_API_KEY_*`
- Use OIDC/workload identity when provider supports it; avoid long-lived cloud keys
- Rotate secrets every 90 days or on contributor offboarding
- Break-glass credentials stored outside git, encrypted, with 2 maintainers
- CI must mask secrets in logs
- Add `.env*` to `.gitignore` (except `.env.example`)
- Keep `.env.example` as schema only, never real values

## 7) Exact commands: remote setup + first push

From local path `/home/rmak78/.openclaw/workspace/global-pos-erp`:

```bash
cd /home/rmak78/.openclaw/workspace/global-pos-erp

# 0) sanity
pwd
git branch --show-current

# 1) initialize if needed
[ -d .git ] || git init -b main

# 2) set identity (if missing)
git config user.name "YOUR_NAME"
git config user.email "you@example.com"

# 3) commit bootstrap
git add .
git commit -m "chore(repo): bootstrap governance, templates, and CI/security workflows"

# 4A) create GitHub repo via gh CLI (recommended)
# gh auth login  # run once if not authenticated
gh repo create global-pos-erp --public --source=. --remote=origin --push

# 4B) OR add remote manually (if repo already exists)
# git remote add origin git@github.com:<ORG_OR_USER>/global-pos-erp.git
# git push -u origin main
```

## 8) Post-push hardening commands (GitHub CLI)

```bash
cd /home/rmak78/.openclaw/workspace/global-pos-erp

# Enable Dependabot alerts + auto security updates
gh api -X PUT repos/<ORG_OR_USER>/global-pos-erp/vulnerability-alerts

gh api -X PUT repos/<ORG_OR_USER>/global-pos-erp/automated-security-fixes

# Example: basic branch protection (adjust contexts if names change)
gh api -X PUT repos/<ORG_OR_USER>/global-pos-erp/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -f required_status_checks.strict=true \
  -f required_status_checks.contexts[]="lint-docs-and-yaml" \
  -f required_status_checks.contexts[]="shellcheck" \
  -f required_status_checks.contexts[]="git-hygiene" \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -f required_pull_request_reviews.dismiss_stale_reviews=true \
  -f required_pull_request_reviews.require_code_owner_reviews=true \
  -f enforce_admins=true \
  -f restrictions=
```
