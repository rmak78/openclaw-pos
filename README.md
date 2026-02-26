# OpenClaw POS + ERP

Offline-first, multi-tier POS/ERP for real-world operations where connectivity is unreliable and controls still matter.

**Hierarchy:** Global HO → Country HO → Regional → Branch → Till

---

## Why this project exists

Most POS tools assume stable internet.
Most ERPs assume perfect process discipline.
Real operations have neither.

**OpenClaw POS + ERP** is built for:
- intermittent internet,
- multi-country operations,
- finance/compliance-grade controls,
- and practical branch/till workflows.

---

## Current Stack

- **API runtime:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Language:** TypeScript
- **Repository:** Public GitHub (auditable workflow)
- **Live API base:** `https://pos-api.bixisoft.com/v1`

Fallback path for higher control/capacity:
- Hostinger VPS + Docker + Postgres

---

## Core Principles

1. **Offline-first by default**
   - Sales should continue when internet fails.
2. **Deterministic sync + idempotency**
   - No duplicate posting surprises.
3. **Accounting and compliance discipline**
   - Event traceability, reconciliation, period controls.
4. **Configurable country policy model**
   - No hardcoded legal constants in business logic.
5. **Open, auditable development**
   - Public commits, clear docs, explicit decisions.

---

## Phase-1 Scope (locked)

- **10 branches**
- **3 warehouses**
- **2–7 tills per branch**
- **Pakistan first**, expansion-ready for:
  - UAE, Qatar, Oman, Malaysia, Singapore, Germany, UK, Canada, USA

Priority order:
1. Offline resilience
2. Speed
3. Accounting depth

---

## Modules in Progress

- POS sales & till operations
- Sync/event pipeline
- FinOps (journals, posting rules, reconciliation)
- HRIS (employee lifecycle, attendance, roster)
- Payroll + legal policy packs
- Management reporting (middle + upper management)
- Country packs (tax/payroll/compliance templates)
- i18n/l10n plan (Arabic RTL + German)

Also planned/expanding:
- Customer service workflows
- Returns/RMA lifecycle
- Vendor/supply management

---

## API (v1) — currently live

- `GET /v1`
- `GET /v1/health`
- `GET /v1/db-check`
- `GET /v1/meta`
- `GET /v1/org-units`
- `POST /v1/org-units`
- `GET /v1/employees`
- `POST /v1/employees`

---

## Repository Structure

- `src/` → Worker API
- `data-model/migrations/` → D1 migrations
- `docs/architecture/` → architecture + sprint plans
- `docs/operations/` → SOPs, pilot playbooks, compliance operations
- `docs/country-packs/` → country-specific rollout packs
- `docs/reference/` → report catalog, glossary, i18n plans
- `.github/workflows/` → CI, security, pages
- `web/` → project landing page (GitHub Pages)

---

## Quick Start (dev)

```bash
npm install
npx wrangler whoami
npx wrangler d1 execute openclaw_pos --remote --file data-model/migrations/0001_init.sql
npx wrangler dev
```

Deploy:

```bash
npx wrangler deploy
```

---

## Documentation Index

Start here:
- `docs/README.md`

Key packs:
- `docs/architecture/sprint-plan-v1.md`
- `docs/operations/finops-sprint-v1.md`
- `docs/operations/hris-sprint-v1.md`
- `docs/reference/management-report-catalog-v1.md`
- `docs/reference/i18n-ar-de-plan.md`
- `docs/country-packs/*.md`

---

## Governance & Security

- Protected `main` branch
- PR-driven workflow
- CI + hygiene checks
- Security workflow (CodeQL/Trivy baseline)
- Config-first legal/statutory placeholders pending country confirmation

---

## Contribution Model

This repo is execution-driven.
If you contribute, please include:
- clear scope,
- migration impact,
- API contract impact,
- rollout/ops notes,
- and test/reconciliation implications.

---

## Sponsorship / Crowdfunding

We are actively preparing support channels for:
- pilot hardware (tills, scanners, printers),
- hosting + observability,
- legal/compliance validation across countries.

Follow project updates on the repo and website for sponsorship options.

---

## Status

**Active build phase.**
Foundations are live, docs are expanding rapidly, and country packs are being generated in parallel.
