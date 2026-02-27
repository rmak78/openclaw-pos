-- Payroll approval workflow + audit trail
PRAGMA foreign_keys = ON;

ALTER TABLE payroll_runs ADD COLUMN currency_code TEXT;
ALTER TABLE payroll_runs ADD COLUMN approved_at TEXT;
ALTER TABLE payroll_runs ADD COLUMN approved_by_employee_id TEXT;
ALTER TABLE payroll_runs ADD COLUMN processed_at TEXT;
ALTER TABLE payroll_runs ADD COLUMN processed_by_employee_id TEXT;
ALTER TABLE payroll_runs ADD COLUMN created_by_employee_id TEXT;

CREATE TABLE IF NOT EXISTS payroll_run_audit_logs (
  id TEXT PRIMARY KEY,
  payroll_run_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- status_transition|note|manual_adjustment
  from_status TEXT,
  to_status TEXT,
  actor_employee_id TEXT,
  notes TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(payroll_run_id) REFERENCES payroll_runs(id),
  FOREIGN KEY(actor_employee_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_audit_run_created
  ON payroll_run_audit_logs(payroll_run_id, created_at DESC);
