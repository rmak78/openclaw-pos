# Investor & Pilot Walkthrough Script (12 minutes)

Use this script for live demos so product story stays consistent across landing page, demo directory, and project summary.

## 0) Setup (before call)

- Open tabs in this order:
  1. `web/index.html` (Demo Landing)
  2. `web/demos/index.html` (Demo Directory)
  3. `web/project-summary.html` (Project Summary)
- Confirm storyline appears exactly as:
  - **Global HQ → Country → Region → Branch → Till + Warehouse layer**
- Keep one seeded scenario ready (Pakistan pilot branch).

## 1) Opening Narrative (60 seconds)

"OpenClaw POS + ERP is built for environments where internet is unreliable but financial control cannot fail. We run a multi-layer operating model from Global HQ down to Till, with Warehouse tightly connected for stock continuity."

Anchor points:
- Offline-first operations
- Finance/compliance-grade controls
- Country-configurable policy model

## 2) Demo Landing (90 seconds)

Show `web/index.html`.

Say:
- "This is the top-level demo hub for the full operating stack."
- "We can start by layer, not by feature, so each stakeholder sees their world first."

Click:
- **Open Demo Directory**
- Point out **Project Summary** links (local + GitHub Pages)

## 3) Layer Walkthrough (5 minutes total)

From `web/demos/index.html`, run this sequence:

1. **Till Demo** (60s)
   - Checkout speed, payment, receipt continuity in low-connectivity conditions.
2. **Branch Demo** (45s)
   - Shift control, branch KPIs, day-close discipline.
3. **Warehouse Demo** (45s)
   - Receiving, transfers, dispatch traceability.
4. **Regional Office Demo** (45s)
   - Cross-branch visibility and variance watchlist.
5. **Country Office Demo** (45s)
   - Tax/payroll controls and policy governance.
6. **Global HQ Demo** (60s)
   - Cross-country governance, portfolio metrics, strategic controls.

## 4) Project Summary Close (2 minutes)

Open `web/project-summary.html`.

Call out:
- Pilot scope: **10 branches, 3 warehouses, 2–7 tills/branch**
- Build priority: **Offline resilience > Speed > Accounting depth**
- API base and deployment posture

Close line:
"This is not just a POS UI; it is an auditable operating system for retail execution across countries."

## 5) Pilot/Investor Q&A Prompts (2 minutes)

Use these prompts to guide next steps:
- "Which layer is currently your biggest pain: till, branch control, or country compliance?"
- "Do you need strict offline continuity from day one, or staged rollout by branch type?"
- "Should we scope a 2-branch pilot first, then scale to the 10-branch target?"

## Fast Consistency Checklist (for presenters)

- [ ] Landing, demo directory, and project summary use the same layer narrative
- [ ] "Global HQ (Head Office)" wording is consistent
- [ ] Warehouse is presented as integrated layer (not disconnected module)
- [ ] Pilot numbers match README/project summary
- [ ] Final CTA is either pilot discovery call or sponsorship path
