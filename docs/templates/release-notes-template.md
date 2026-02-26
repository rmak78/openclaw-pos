# Release Notes Template

> File naming convention: `YYYY-MM-DD-vX.Y.Z.md`

## Release Summary

- **Version:** `vX.Y.Z`
- **Release date:** `YYYY-MM-DD`
- **Release type:** `major | minor | patch | hotfix`
- **Products impacted:** `Till POS | Branch Web | HQ Web | Sync Engine | Reporting`
- **Regions/Countries impacted:** `list`
- **Prepared by:** `name/role`

## 1) What’s New

- Short bullets of user-visible improvements.
- Group by role impact (Cashier, Supervisor, Manager, Support).

## 2) Operational Impact

- **Branch operations impact:** `none/low/medium/high + notes`
- **Training required:** `yes/no + target roles`
- **Downtime required:** `yes/no + expected duration`
- **Policy or SOP update required:** `yes/no + links`

## 3) Fixes

- Defects resolved with concise behavior-before/after.

## 4) Risks and Mitigations

- Known limitations.
- Rollback readiness.
- Monitoring focus for first 24-72 hours.

## 5) Data and Reconciliation Notes

- Any changes affecting transaction totals, tax logic, settlement, or reports.
- Required finance checks after release.

## 6) Offline/Sync Behavior Changes

- Describe any change to offline limits, queue behavior, retry strategy, conflict handling.

## 7) Configuration Changes

- Feature flags added/removed.
- New required branch/country settings.

## 8) Compatibility

- Minimum supported app versions.
- Device/OS constraints.

## 9) Rollout Plan

- Pilot branches/regions.
- Rollout waves and timing.
- Stop/go checkpoints.

## 10) Validation Checklist

- [ ] Open shift works
- [ ] Sales and payment flows validated
- [ ] Close shift reconciliation validated
- [ ] Offline flow tested
- [ ] Sync recovery tested
- [ ] Reports verified

## 11) Support Readiness

- Support briefing date/time.
- FAQ/article links.
- Escalation owner and on-call details.

## 12) Links

- PRs:
- SOP updates:
- User manual updates:
- Incident playbook:
