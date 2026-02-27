-- Payroll execution baseline: run lines + indexes
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS payroll_run_lines (
  id TEXT PRIMARY KEY,
  payroll_run_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  component_code TEXT NOT NULL,
  component_type TEXT NOT NULL, -- earning|deduction|employer_cost
  calc_mode TEXT NOT NULL, -- fixed|percent|formula
  input_value REAL,
  computed_amount REAL NOT NULL,
  currency_code TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_run_lines_run_employee
  ON payroll_run_lines(payroll_run_id, employee_id, component_code);

CREATE INDEX IF NOT EXISTS idx_payroll_run_lines_component
  ON payroll_run_lines(component_type, component_code);
