PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS payroll_runs (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,
  legal_entity_id TEXT,
  branch_id TEXT,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  run_type TEXT NOT NULL DEFAULT 'regular',
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_status_period
  ON payroll_runs(status, period_start, period_end);

CREATE TABLE IF NOT EXISTS payroll_run_lines (
  id TEXT PRIMARY KEY,
  payroll_run_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  component_code TEXT NOT NULL,
  component_type TEXT NOT NULL,
  calc_mode TEXT NOT NULL,
  input_value REAL,
  computed_amount REAL NOT NULL,
  currency_code TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_run_lines_run_employee
  ON payroll_run_lines(payroll_run_id, employee_id, component_code);
