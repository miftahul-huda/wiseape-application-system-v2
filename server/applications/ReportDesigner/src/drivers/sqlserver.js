const sql = require('mssql');
const { TIMEOUT_MS, STATEMENT_TIMEOUT_MS, flags, splitFull } = require('./common');

async function withPool(conn, fn) {
  const o = conn.options || {};
  const pool = new sql.ConnectionPool({
    server: conn.host, port: conn.port, user: conn.username, password: conn.password,
    database: conn.databaseName,
    connectionTimeout: TIMEOUT_MS, requestTimeout: STATEMENT_TIMEOUT_MS,
    options: {
      encrypt: o.ssl !== undefined ? !!o.ssl : true,
      trustServerCertificate: o.trustServerCertificate !== undefined ? !!o.trustServerCertificate : true,
    },
    pool: { max: 1 },
  });
  await pool.connect();
  try { return await fn(pool); } finally { await pool.close().catch(() => {}); }
}

module.exports = {
  quoteIdent: (n) => '[' + String(n).replace(/]/g, ']]') + ']',
  async testConnection(conn) { await withPool(conn, (p) => p.request().query('SELECT 1 AS ok')); },
  async listTables(conn) {
    return withPool(conn, async (p) => {
      const r = await p.request().query(`SELECT TABLE_SCHEMA AS [schema], TABLE_NAME AS name,
        CASE WHEN TABLE_TYPE='VIEW' THEN 'view' ELSE 'table' END AS type
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA NOT IN ('sys','INFORMATION_SCHEMA') ORDER BY 1,2`);
      return r.recordset;
    });
  },
  async listColumns(conn, full) {
    const { schema, name } = splitFull(full);
    return withPool(conn, async (p) => {
      const r = await p.request().input('s', schema).input('t', name).query(
        `SELECT COLUMN_NAME AS column_name, DATA_TYPE AS data_type FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA=@s AND TABLE_NAME=@t ORDER BY ORDINAL_POSITION`);
      return r.recordset.map((x) => ({ name: x.column_name, dataType: x.data_type, ...flags(x.data_type) }));
    });
  },
  async query(conn, text, params = []) {
    return withPool(conn, async (p) => {
      const req = p.request();
      params.forEach((v, i) => req.input('p' + i, v));
      const r = await req.query(text);
      const columns = Object.keys(r.recordset.columns || {});
      return { columns, rows: r.recordset };
    });
  },
};
