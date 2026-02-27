# Information Architecture

## Domain map

```mermaid
flowchart TD
  Org[Org Hierarchy] --> POS[Sales & Returns]
  Org --> Till[Till Sessions]
  Org --> Proc[Procurement]
  Org --> HR[HR Attendance]
  HR --> Payroll[Payroll]
  POS --> Fin[Finance Posting]
  Till --> Fin
  Proc --> Fin
  Payroll --> Fin
```

## IA sections
- Operations: POS, till, branch controls
- Inventory: items, suppliers, PO, GRN
- Finance: journals, recon, posting errors, controls
- People: employees, rosters, attendance, payroll
- Admin: policy config, audit logs, access

## Key entities
- Sales Receipt, Return, Refund, Till Session, Cash Drop
- Purchase Order, Goods Receipt, Inventory Movement
- Journal Entry/Lines, Reconciliation Snapshot, Posting Error
- Employee, Roster, Attendance Daily, Payroll Run
