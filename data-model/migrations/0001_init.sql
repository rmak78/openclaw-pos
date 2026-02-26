-- openclaw-pos initial schema (v1 bootstrap)

CREATE TABLE IF NOT EXISTS org_units (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  unit_type TEXT NOT NULL, -- global|country|regional|warehouse|branch|till
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_code TEXT,
  currency_code TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  employee_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  employment_type TEXT NOT NULL, -- permanent|contract|daily_wager
  country_code TEXT NOT NULL,
  legal_entity_id TEXT,
  branch_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sync_events (
  event_id TEXT PRIMARY KEY,
  source_node TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  business_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_org_units_parent ON org_units(parent_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_type_date ON sync_events(event_type, business_date);
