-- Receipt lines, payment split, and day-close summary support

CREATE TABLE IF NOT EXISTS sales_receipt_payments (
  id TEXT PRIMARY KEY,
  sales_receipt_id TEXT NOT NULL,
  payment_method_id TEXT NOT NULL,
  amount REAL NOT NULL,
  reference_no TEXT,
  settlement_status TEXT NOT NULL DEFAULT 'captured', -- captured|pending|failed
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(sales_receipt_id) REFERENCES sales_receipts(id),
  FOREIGN KEY(payment_method_id) REFERENCES payment_methods(id)
);

CREATE INDEX IF NOT EXISTS idx_receipt_payments_receipt ON sales_receipt_payments(sales_receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_payments_method ON sales_receipt_payments(payment_method_id, created_at);
