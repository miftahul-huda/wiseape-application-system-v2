const { Client } = require('pg');
const { TIMEOUT_MS, STATEMENT_TIMEOUT_MS, flags, splitFull } = require('./common');

async function withClient(conn, fn) {
  const o = conn.options || {};
  const client = new Client({
    host: conn.host, port: conn.port, user: conn.username, password: conn.password,
    database: conn.databaseName,
    ssl: o.ssl ? { rejectUnauthorized: !o.trustServerCertificate } : undefined,
    connectionTimeoutMillis: TIMEOUT_MS,
    statement_timeout: STATEMENT_TIMEOUT_MS,
    query_timeout: STATEMENT_TIMEOUT_MS,
  });
  client.on('error', () => {});
  await client.connect();
  try { return await fn(client); } finally { await client.end().catch(() => {}); }
}

module.exports = {
  quoteIdent: (n) => '"' + String(n).replace(/"/g, '""') + '"',
  async testConnection(conn) { await withClient(conn, (c) => c.query('SELECT 1')); },
  async listTables(conn) {
    return withClient(conn, async (c) => {
      const r = await c.query(`SELECT table_schema AS schema, table_name AS name,
        CASE WHEN table_type='VIEW' THEN 'view' ELSE 'table' END AS type
        FROM information_schema.tables
        WHERE table_schema NOT IN ('pg_catalog','information_schema') AND table_schema NOT LIKE 'pg\\_%'
          AND table_type IN ('BASE TABLE','VIEW')
        ORDER BY 1,2`);
      return r.rows;
    });
  },
  async listColumns(conn, full) {
    const { schema, name } = splitFull(full);
    return withClient(conn, async (c) => {
      const r = await c.query(`SELECT column_name, data_type FROM information_schema.columns
        WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position`, [schema, name]);
      return r.rows.map((x) => ({ name: x.column_name, dataType: x.data_type, ...flags(x.data_type) }));
    });
  },
  async query(conn, sql, params = []) {
    return withClient(conn, async (c) => {
      const r = await c.query({ text: sql, values: params, rowMode: 'array' });
      const columns = r.fields.map((f) => f.name);
      const rows = r.rows.map((arr) => Object.fromEntries(columns.map((k, i) => [k, arr[i]])));
      return { columns, rows };
    });
  },
};
