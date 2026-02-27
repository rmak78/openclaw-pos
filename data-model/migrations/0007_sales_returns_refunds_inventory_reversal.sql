-- Sales returns + refunds baseline with inventory reversal hooks

CREATE TABLE IF NOT EXISTS sales_returns (
  id TEXT PRIMARY KEY,
  return_no TEXT NOT NULL UNIQUE,
  original_sales_receipt_id TEXT,
  branch_id TEXT NOT NULL,
  till_session_id TEXT,
  cashier_employee_id TEXT,
  customer_id TEXT,
  return_reason TEXT,
  return_status TEXT NOT NULL DEFAULT 'initiated', -- initiated|approved|refunded|void
  currency_code TEXT NOT NULL,
  subtotal_amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  business_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(original_sales_receipt_id) REFERENCES sales_receipts(id),
  FOREIGN KEY(branch_id) REFERENCES org_units(id),
  FOREIGN KEY(till_session_id) REFERENCES till_sessions(id),
  FOREIGN KEY(cashier_employee_id) REFERENCES employees(id),
  FOREIGN KEY(customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS sales_return_lines (
  id TEXT PRIMARY KEY,
  sales_return_id TEXT NOT NULL,
  original_sales_receipt_line_id TEXT,
  sku_code TEXT NOT NULL,
  item_name TEXT,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  tax_amount REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL,
  restock_to_inventory INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(sales_return_id) REFERENCES sales_returns(id),
  FOREIGN KEY(original_sales_receipt_line_id) REFERENCES sales_receipt_lines(id)
);

CREATE TABLE IF NOT EXISTS sales_refunds (
  id TEXT PRIMARY KEY,
  sales_return_id TEXT NOT NULL,
  payment_method_id TEXT NOT NULL,
  amount REAL NOT NULL,
  reference_no TEXT,
  refund_status TEXT NOT NULL DEFAULT 'processed', -- pending|processed|failed|reversed
  refunded_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(sales_return_id) REFERENCES sales_returns(id),
  FOREIGN KEY(payment_method_id) REFERENCES payment_methods(id)
);

CREATE INDEX IF NOT EXISTS idx_sales_returns_branch_date ON sales_returns(branch_id, business_date, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_returns_receipt ON sales_returns(original_sales_receipt_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_return_lines_return ON sales_return_lines(sales_return_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_refunds_return ON sales_refunds(sales_return_id, refunded_at);
