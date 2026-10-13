const { pool } = require('./pool');

const DDL = `
CREATE TABLE IF NOT EXISTS rd_database_types (
  id serial PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  driver text NOT NULL,
  default_port int,
  is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS rd_connections (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  database_type_id int NOT NULL REFERENCES rd_database_types(id),
  host text NOT NULL,
  port int NOT NULL,
  database_name text NOT NULL,
  username text NOT NULL,
  password_enc text,
  options jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rd_report_groups (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rd_reports (
  id serial PRIMARY KEY,
  group_id int REFERENCES rd_report_groups(id),
  name text NOT NULL,
  description text,
  connection_id int NOT NULL REFERENCES rd_connections(id),
  source_type text NOT NULL CHECK (source_type IN ('table','query')),
  source_table text,
  source_query text,
  chart_type text,
  dimensions jsonb NOT NULL DEFAULT '[]',
  measures jsonb NOT NULL DEFAULT '[]',
  row_limit int NOT NULL DEFAULT 500,
  options jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO rd_database_types (code, name, driver, default_port) VALUES
  ('postgres','PostgreSQL','pg',5432),
  ('mysql','MySQL','mysql2',3306),
  ('sqlserver','SQL Server','mssql',1433)
ON CONFLICT (code) DO NOTHING;
`;

// Code derived from a name: "Laporan Penjualan" -> "LAPORAN_PENJUALAN" (no spaces).
function slugifyCode(name) {
  return String(name || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    .toUpperCase().slice(0, 50);
}

async function initSchema() {
  await pool.query(DDL);

  // rd_report_groups.code: added after the first release, so migrate in place.
  await pool.query('ALTER TABLE rd_report_groups ADD COLUMN IF NOT EXISTS code text');
  const missing = await pool.query('SELECT id, name FROM rd_report_groups WHERE code IS NULL OR code = \'\' ORDER BY id');
  for (const row of missing.rows) {
    let code = slugifyCode(row.name) || `GROUP_${row.id}`;
    const clash = await pool.query('SELECT 1 FROM rd_report_groups WHERE lower(code) = lower($1) AND id <> $2', [code, row.id]);
    if (clash.rowCount > 0) code = `${code.slice(0, 44)}_${row.id}`;
    await pool.query('UPDATE rd_report_groups SET code = $1 WHERE id = $2', [code, row.id]);
  }
  await pool.query('ALTER TABLE rd_report_groups ALTER COLUMN code SET NOT NULL');
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS rd_report_groups_code_key ON rd_report_groups (lower(code))');
}

module.exports = { initSchema, slugifyCode };
