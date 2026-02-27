-- Returns/Refund controls: reason codes, approval workflow, and refund method tracking

CREATE TABLE IF NOT EXISTS return_reason_codes (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sales_returns (
  id TEXT PRIMARY KEY,
  return_no TEXT NOT NULL UNIQUE,
  original_sales_receipt_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  return_reason_code TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_by_employee_id TEXT,
  approved_at TEXT,
  return_status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by_employee_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(original_sales_receipt_id) REFERENCES sales_receipts(id),
  FOREIGN KEY(branch_id) REFERENCES org_units(id),
  FOREIGN KEY(return_reason_code) REFERENCES return_reason_codes(code),
  FOREIGN KEY(approved_by_employee_id) REFERENCES employees(id),
  FOREIGN KEY(created_by_employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  sales_return_id TEXT NOT NULL,
  refund_method_id TEXT NOT NULL,
  refund_amount REAL NOT NULL,
  refund_status TEXT NOT NULL DEFAULT 'processed',
  reference_no TEXT,
  refunded_at TEXT NOT NULL,
  created_by_employee_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(sales_return_id) REFERENCES sales_returns(id),
  FOREIGN KEY(refund_method_id) REFERENCES payment_methods(id),
  FOREIGN KEY(created_by_employee_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_sales_returns_receipt ON sales_returns(original_sales_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_returns_approval ON sales_returns(approval_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_returns_reason ON sales_returns(return_reason_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refunds_return ON refunds(sales_return_id, refunded_at DESC);
CREATE INDEX IF NOT EXISTS idx_refunds_method_status ON refunds(refund_method_id, refund_status, refunded_at DESC);
