-- Omnichannel commerce + dispatch foundation (future-ready)

CREATE TABLE IF NOT EXISTS sales_channels (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,           -- own_site | shopify | amazon | daraz | noon | etc
  name TEXT NOT NULL,
  channel_type TEXT NOT NULL,          -- own_site | marketplace | social
  country_code TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS channel_accounts (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  external_account_id TEXT,
  region_code TEXT,
  credentials_ref TEXT,                -- pointer to secret vault key/path, never raw secret
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(channel_id) REFERENCES sales_channels(id)
);

CREATE TABLE IF NOT EXISTS channel_products (
  id TEXT PRIMARY KEY,
  channel_account_id TEXT NOT NULL,
  sku_code TEXT NOT NULL,
  external_listing_id TEXT NOT NULL,
  title TEXT,
  status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(channel_account_id, external_listing_id),
  FOREIGN KEY(channel_account_id) REFERENCES channel_accounts(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_code TEXT NOT NULL UNIQUE,
  source_channel_id TEXT,
  source_account_id TEXT,
  source_order_id TEXT,
  customer_ref TEXT,
  currency_code TEXT NOT NULL,
  country_code TEXT,
  order_status TEXT NOT NULL,
  subtotal_amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  shipping_amount REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_channel_id) REFERENCES sales_channels(id),
  FOREIGN KEY(source_account_id) REFERENCES channel_accounts(id)
);

CREATE TABLE IF NOT EXISTS order_lines (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  sku_code TEXT NOT NULL,
  product_name TEXT,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  tax_amount REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS dispatch_shipments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  source_org_unit_id TEXT,
  courier_name TEXT,
  tracking_number TEXT,
  shipment_status TEXT NOT NULL,
  dispatched_at TEXT,
  delivered_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(source_org_unit_id) REFERENCES org_units(id)
);

CREATE TABLE IF NOT EXISTS shipment_events (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_time TEXT NOT NULL,
  event_payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(shipment_id) REFERENCES dispatch_shipments(id)
);

CREATE INDEX IF NOT EXISTS idx_channel_accounts_channel ON channel_accounts(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_products_account ON channel_products(channel_account_id);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source_channel_id, source_account_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_time ON orders(order_status, created_at);
CREATE INDEX IF NOT EXISTS idx_order_lines_order ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON dispatch_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_time ON shipment_events(shipment_id, event_time);
