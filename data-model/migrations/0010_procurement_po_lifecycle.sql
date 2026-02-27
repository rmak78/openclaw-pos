-- Procurement baseline: suppliers payment terms + purchase order lifecycle

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  supplier_code TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  payment_terms_days INTEGER NOT NULL DEFAULT 0,
  payment_terms_note TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  po_code TEXT NOT NULL UNIQUE,
  supplier_id TEXT NOT NULL,
  branch_id TEXT,
  currency_code TEXT NOT NULL,
  subtotal_amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- draft|approved|issued|received|closed
  notes TEXT,
  approved_at TEXT,
  issued_at TEXT,
  received_at TEXT,
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY(branch_id) REFERENCES org_units(id)
);

CREATE TABLE IF NOT EXISTS purchase_order_status_events (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  transition_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(id)
);

CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_status ON purchase_orders(supplier_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_purchase_order_events_po_time ON purchase_order_status_events(purchase_order_id, created_at);
