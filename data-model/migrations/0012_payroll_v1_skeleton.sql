-- Payroll v1 skeleton: pay cycles, components, and payroll runs
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pay_cycles (
  id TEXT PRIMARY KEY,
  cycle_code TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL,
  legal_entity_id TEXT,
  cycle_type TEXT NOT NULL, -- weekly|biweekly|monthly|custom
  cycle_start TEXT NOT NULL,
  cycle_end TEXT NOT NULL,
  payday TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft|open|locked|paid|closed
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(legal_entity_id) REFERENCES org_units(id)
);

CREATE TABLE IF NOT EXISTS pay_components (
  id TEXT PRIMARY KEY,
  component_code TEXT NOT NULL UNIQUE,
  component_name TEXT NOT NULL,
  component_type TEXT NOT NULL, -- earning|deduction|employer_cost
  calc_mode TEXT NOT NULL, -- fixed|percent|formula
  taxable_default INTEGER NOT NULL DEFAULT 1,
  pensionable_default INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id TEXT PRIMARY KEY,
  pay_cycle_id TEXT NOT NULL,
  branch_id TEXT,
  run_code TEXT NOT NULL UNIQUE,
  run_type TEXT NOT NULL, -- regular|offcycle|adjustment|final
  status TEXT NOT NULL DEFAULT 'draft', -- draft|processing|review|approved|processed|paid|cancelled
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(pay_cycle_id) REFERENCES pay_cycles(id),
  FOREIGN KEY(branch_id) REFERENCES org_units(id)
);

CREATE INDEX IF NOT EXISTS idx_pay_cycles_country_dates ON pay_cycles(country_code, cycle_start, cycle_end);
CREATE INDEX IF NOT EXISTS idx_pay_components_type_active ON pay_components(component_type, is_active);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_cycle_status ON payroll_runs(pay_cycle_id, status, created_at);
