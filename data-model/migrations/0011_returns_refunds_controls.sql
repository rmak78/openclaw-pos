-- Returns/refunds controls layered on top of baseline returns schema
-- Adds reason codes + approval state on sales_returns and extends sales_refunds auditability.

CREATE TABLE IF NOT EXISTS return_reason_codes (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE sales_returns ADD COLUMN return_reason_code TEXT;
ALTER TABLE sales_returns ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending'; -- pending|approved|rejected
ALTER TABLE sales_returns ADD COLUMN approved_by_employee_id TEXT;
ALTER TABLE sales_returns ADD COLUMN approved_at TEXT;
ALTER TABLE sales_returns ADD COLUMN notes TEXT;
ALTER TABLE sales_returns ADD COLUMN created_by_employee_id TEXT;

ALTER TABLE sales_refunds ADD COLUMN created_by_employee_id TEXT;

CREATE INDEX IF NOT EXISTS idx_sales_returns_receipt ON sales_returns(original_sales_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_returns_approval ON sales_returns(approval_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_returns_reason ON sales_returns(return_reason_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_refunds_return ON sales_refunds(sales_return_id, refunded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_refunds_method_status ON sales_refunds(payment_method_id, refund_status, refunded_at DESC);
