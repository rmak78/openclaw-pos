-- Procurement lifecycle extension: supplier terms note + PO status events
ALTER TABLE suppliers ADD COLUMN payment_terms_note TEXT;

CREATE TABLE IF NOT EXISTS purchase_order_status_events (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  transition_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(id)
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_events_po_time
  ON purchase_order_status_events(purchase_order_id, created_at);
