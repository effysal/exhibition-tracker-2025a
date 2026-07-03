import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brand_config (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  keywords TEXT[] NOT NULL DEFAULT ARRAY['Opatra', 'Opatra London'],
  marketplaces TEXT[] NOT NULL DEFAULT ARRAY['EBAY_GB'],
  authorized_sellers TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  typical_price NUMERIC,
  vero_portal_url TEXT,
  trademark_owner_name TEXT,
  trademark_registration_number TEXT,
  trademark_registration_country TEXT,
  trademark_contact_name TEXT,
  trademark_contact_email TEXT,
  CONSTRAINT single_row CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  price_value NUMERIC,
  price_currency TEXT,
  image_url TEXT,
  seller_username TEXT,
  condition TEXT,
  marketplace TEXT,
  matched_keyword TEXT,
  risk_score INT NOT NULL DEFAULT 0,
  risk_reasons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'new',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL REFERENCES listings(id),
  item_id TEXT,
  listing_snapshot JSONB,
  report_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ
);
`;

export async function initSchema() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  await pool.query(SCHEMA);
  await pool.query(
      `INSERT INTO brand_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING`,
  );
}
