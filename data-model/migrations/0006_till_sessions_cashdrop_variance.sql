-- Till session lifecycle + cash drop + variance reason codes

CREATE TABLE IF NOT EXISTS till_sessions (
  id TEXT PRIMARY KEY,
  till_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  opened_by_employee_id TEXT,
  opening_float_amount REAL NOT NULL DEFAULT 0,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  expected_cash_amount REAL,
  counted_cash_amount REAL,
  variance_amount REAL,
  status TEXT NOT NULL DEFAULT 'open', -- open|closed
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(till_id) REFERENCES org_units(id),
  FOREIGN KEY(branch_id) REFERENCES org_units(id),
  FOREIGN KEY(opened_by_employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS cash_drops (
  id TEXT PRIMARY KEY,
  till_session_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  amount REAL NOT NULL,
  drop_reason TEXT NOT NULL, -- safety_limit|bank_deposit|shift_handover|other
  reference_no TEXT,
  dropped_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(till_session_id) REFERENCES till_sessions(id),
  FOREIGN KEY(branch_id) REFERENCES org_units(id)
);

CREATE TABLE IF NOT EXISTS variance_reasons (
  id TEXT PRIMARY KEY,
  till_session_id TEXT,
  branch_reconciliation_id TEXT,
  reason_code TEXT NOT NULL,
  reason_note TEXT,
  created_by_employee_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(till_session_id) REFERENCES till_sessions(id),
  FOREIGN KEY(branch_reconciliation_id) REFERENCES branch_reconciliations(id),
  FOREIGN KEY(created_by_employee_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_till_sessions_till_status ON till_sessions(till_id, status, opened_at);
CREATE INDEX IF NOT EXISTS idx_cash_drops_session ON cash_drops(till_session_id, dropped_at);
CREATE INDEX IF NOT EXISTS idx_variance_reasons_code ON variance_reasons(reason_code, created_at);
