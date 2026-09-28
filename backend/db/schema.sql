-- AY-Dashboard database schema (PostgreSQL)
-- With Docker (docker compose up -d) this file is applied automatically on first start.
-- Without Docker: create the database first (createdb ay_dashboard), then run:
--   psql -U postgres -d ay_dashboard -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'admin'
                CHECK (role IN ('admin','manager','viewer')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(150),
  phone       VARCHAR(30),
  company     VARCHAR(150),
  status      VARCHAR(20) NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','inactive')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id          SERIAL PRIMARY KEY,
  invoice_no  VARCHAR(30) NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount      NUMERIC(14,2) NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('paid','pending','overdue')),
  issue_date  DATE NOT NULL,
  due_date    DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id          SERIAL PRIMARY KEY,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
  category    VARCHAR(100) NOT NULL,
  amount      NUMERIC(14,2) NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  description VARCHAR(255),
  txn_date    DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(txn_date);
CREATE INDEX IF NOT EXISTS idx_txn_type ON transactions(type);
