-- Procurement baseline: suppliers + purchase orders + goods receipts (GRN)

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  supplier_code TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  country_code TEXT,
  payment_terms_days INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active|inactive|blocked
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  supplier_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  order_date TEXT NOT NULL,
  expected_date TEXT,
  currency_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft|submitted|partially_received|received|cancelled
  notes TEXT,
  created_by_employee_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY(branch_id) REFERENCES org_units(id),
  FOREIGN KEY(created_by_employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL,
  sku_code TEXT NOT NULL,
  item_name TEXT,
  ordered_qty REAL NOT NULL,
  unit_cost REAL NOT NULL,
  tax_rate REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL,
  received_qty REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(id)
);

CREATE TABLE IF NOT EXISTS goods_receipts (
  id TEXT PRIMARY KEY,
  grn_number TEXT NOT NULL UNIQUE,
  purchase_order_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  received_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'posted', -- draft|posted|cancelled
  notes TEXT,
  received_by_employee_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(id),
  FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY(branch_id) REFERENCES org_units(id),
  FOREIGN KEY(received_by_employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS goods_receipt_lines (
  id TEXT PRIMARY KEY,
  goods_receipt_id TEXT NOT NULL,
  purchase_order_line_id TEXT,
  sku_code TEXT NOT NULL,
  received_qty REAL NOT NULL,
  accepted_qty REAL NOT NULL,
  rejected_qty REAL NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL,
  line_total REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(goods_receipt_id) REFERENCES goods_receipts(id),
  FOREIGN KEY(purchase_order_line_id) REFERENCES purchase_order_lines(id)
);

CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status, supplier_name);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_date ON purchase_orders(supplier_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch_status ON purchase_orders(branch_id, status, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_order_lines_po ON purchase_order_lines(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_po_date ON goods_receipts(purchase_order_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_branch_date ON goods_receipts(branch_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_goods_receipt_lines_grn ON goods_receipt_lines(goods_receipt_id);
