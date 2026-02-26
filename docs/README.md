# Global POS+ERP Documentation Map

This repository is **docs-first**: product/operational documentation must be updated in the same PR as behavior changes.

## 1) Documentation Architecture

```text
/docs
  README.md                         # This map + contribution rules
  /architecture                     # System-level overviews and flows
  /operations                       # SOPs used by branch/till teams
  /user-manuals                     # Step-by-step operator guides
  /release-notes                    # Versioned release communication
  /templates                        # Reusable document templates
  /reference                        # Shared terminology and policy
```

## 2) What Goes Where

- **architecture/**
  - Context diagrams, service interaction, data movement, sync lifecycle.
  - Audience: Product, Engineering, Operations leadership.

- **operations/**
  - Shift policies, escalation paths, incident playbooks.
  - Audience: Branch Managers, Shift Supervisors, Support.

- **user-manuals/**
  - Task-oriented guides for cashiers/till users.
  - Audience: Frontline till operators.

- **release-notes/**
  - Change summaries by version with impact/risk sections.
  - Audience: Country Ops Leads, Training, Support, Finance.

- **templates/**
  - Standard reusable format for release notes and SOPs.

- **reference/**
  - Glossary, role definitions, localization and naming standards.

## 3) Core Docs (Initial Set)

1. `operations/branch-till-sop-outline.md`
2. `templates/release-notes-template.md`
3. `reference/glossary.md`
4. `operations/onboarding-checklist-new-country-region-branch.md`

## 4) Authoring Standards (Multilingual-ready)

- Keep sentences short (target <= 20 words).
- Use plain language and avoid local slang.
- One instruction per bullet.
- Use role labels consistently: **Cashier**, **Shift Supervisor**, **Branch Manager**, **Support Agent**.
- Use ISO dates (`YYYY-MM-DD`) and 24-hour time.
- Avoid screenshots with embedded language when possible.
- Put all user-facing strings in quote marks to simplify translation extraction.

## 5) PR Definition of Done (Docs)

A feature/change PR is complete only when:

- [ ] impacted SOP/manual sections are updated
- [ ] release-notes draft entry is added
- [ ] glossary terms are updated (if new terms introduced)
- [ ] operational impact (training/comms) is documented
