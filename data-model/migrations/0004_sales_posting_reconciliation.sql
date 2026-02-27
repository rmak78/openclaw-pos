-- Sales posting, inventory movements, and branch reconciliation baseline

CREATE TABLE IF NOT EXISTS sales_receipts (
  id TEXT PRIMARY KEY,
  receipt_no TEXT NOT NULL UNIQUE,
  branch_id TEXT NOT NULL,
  till_id TEXT,
  cashier_employee_id TEXT,
  customer_id TEXT,
  currency_code TEXT NOT NULL,
  subtotal_amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'captured',
  posted_to_ledger INTEGER NOT NULL DEFAULT 0,
  posted_at TEXT,
  business_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(branch_id) REFERENCES org_units(id),
  FOREIGN KEY(till_id) REFERENCES org_units(id),
  FOREIGN KEY(cashier_employee_id) REFERENCES employees(id),
  FOREIGN KEY(customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS sales_receipt_lines (
  id TEXT PRIMARY KEY,
  sales_receipt_id TEXT NOT NULL,
  sku_code TEXT NOT NULL,
  item_name TEXT,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  tax_amount REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(sales_receipt_id) REFERENCES sales_receipts(id)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  movement_code TEXT NOT NULL UNIQUE,
  sku_code TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  movement_type TEXT NOT NULL, -- sale|purchase|adjustment|transfer_in|transfer_out
  quantity_delta REAL NOT NULL,
  unit_cost REAL,
  reference_type TEXT,
  reference_id TEXT,
  business_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(branch_id) REFERENCES org_units(id)
);

CREATE TABLE IF NOT EXISTS branch_reconciliations (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  business_date TEXT NOT NULL,
  expected_sales_amount REAL NOT NULL DEFAULT 0,
  counted_cash_amount REAL NOT NULL DEFAULT 0,
  variance_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open', -- open|matched|investigate|closed
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(branch_id, business_date),
  FOREIGN KEY(branch_id) REFERENCES org_units(id)
);

CREATE INDEX IF NOT EXISTS idx_sales_receipts_branch_date ON sales_receipts(branch_id, business_date);
CREATE INDEX IF NOT EXISTS idx_sales_receipts_posting ON sales_receipts(posted_to_ledger, business_date);
CREATE INDEX IF NOT EXISTS idx_sales_receipt_lines_receipt ON sales_receipt_lines(sales_receipt_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_branch_sku_date ON inventory_movements(branch_id, sku_code, business_date);
CREATE INDEX IF NOT EXISTS idx_branch_reconciliations_status ON branch_reconciliations(status, business_date);
