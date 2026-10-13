const adapters = {
  pg: require('./postgres'),
  mysql2: require('./mysql'),
  mssql: require('./sqlserver'),
};
const MAX_ROWS = 5000;

function getAdapter(driver) {
  const a = adapters[driver];
  if (!a) throw new Error(`Unsupported driver '${driver}'`);
  return a;
}

// Wraps a query with the row limit using the dialect's syntax.
function limitSql(driver, innerSql, limit) {
  const n = Math.max(0, Math.min(MAX_ROWS, parseInt(limit, 10) || 0));
  if (driver === 'mssql') return `SELECT TOP ${n} * FROM ( ${innerSql} ) AS lim`;
  return `SELECT * FROM ( ${innerSql} ) AS lim LIMIT ${n}`;
}

module.exports = { getAdapter, limitSql, MAX_ROWS };
