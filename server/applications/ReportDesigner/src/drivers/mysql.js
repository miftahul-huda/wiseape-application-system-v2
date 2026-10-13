const mysql = require('mysql2/promise');
const { TIMEOUT_MS, STATEMENT_TIMEOUT_MS, flags, splitFull } = require('./common');

async function withConn(conn, fn) {
  const o = conn.options || {};
  const c = await mysql.createConnection({
    host: conn.host, port: conn.port, user: conn.username, password: conn.password,
    database: conn.databaseName, connectTimeout: TIMEOUT_MS,
    ssl: o.ssl ? { rejectUnauthorized: !o.trustServerCertificate } : undefined,
    rowsAsArray: false,
  });
  try { return await fn(c); } finally { await c.end().catch(() => {}); }
}

module.exports = {
  quoteIdent: (n) => '`' + String(n).replace(/`/g, '``') + '`',
  async testConnection(conn) { await withConn(conn, (c) => c.query('SELECT 1')); },
  async listTables(conn) {
    return withConn(conn, async (c) => {
      const [rows] = await c.query(`SELECT table_schema AS \`schema\`, table_name AS name,
        IF(table_type='VIEW','view','table') AS type FROM information_schema.tables
        WHERE table_schema NOT IN ('mysql','information_schema','performance_schema','sys')
        ORDER BY 1,2`);
      return rows.map((r) => ({ schema: r.schema, name: r.name, type: r.type }));
    });
  },
  async listColumns(conn, full) {
    const { schema, name } = splitFull(full);
    return withConn(conn, async (c) => {
      const [rows] = await c.query(`SELECT column_name AS column_name, data_type AS data_type
        FROM information_schema.columns WHERE table_schema=? AND table_name=? ORDER BY ordinal_position`, [schema, name]);
      return rows.map((x) => ({ name: x.column_name, dataType: x.data_type, ...flags(x.data_type) }));
    });
  },
  async query(conn, sql, params = []) {
    return withConn(conn, async (c) => {
      const [rows, fields] = await c.query({ sql, values: params, timeout: STATEMENT_TIMEOUT_MS });
      return { columns: (fields || []).map((f) => f.name), rows };
    });
  },
};
