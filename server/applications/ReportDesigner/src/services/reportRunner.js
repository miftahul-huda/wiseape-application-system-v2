const { badRequest } = require('../utils/httpError');
const { validateReadOnlyQuery } = require('./queryGuard');
const { MAX_ROWS } = require('../drivers');

const AGGREGATES = ['sum', 'avg', 'count', 'min', 'max', 'count_distinct'];
const CHART_TYPES = ['bar', 'horizontalBar', 'line', 'area', 'pie', 'doughnut', 'radar', 'polarArea', 'table'];

const sanitizeAlias = (s) => String(s).replace(/[^A-Za-z0-9_]/g, '_').replace(/^_+$/, 'x');

function clampLimit(v) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n <= 0) return 500;
  return Math.min(n, MAX_ROWS);
}

async function build(report, conn, adapter, driver) {
  const q = adapter.quoteIdent;
  const dims = Array.isArray(report.dimensions) ? report.dimensions : [];
  const meas = Array.isArray(report.measures) ? report.measures : [];
  if (!dims.length && !meas.length) throw badRequest('At least one dimension or measure is required');
  const limit = clampLimit(report.rowLimit);

  let source;
  let columnNames;
  if (report.sourceType === 'table') {
    if (!report.sourceTable) throw badRequest('sourceTable is required');
    const tables = await adapter.listTables(conn);
    const t = tables.find((x) => `${x.schema}.${x.name}` === report.sourceTable);
    if (!t) throw badRequest(`Table '${report.sourceTable}' not found on this connection`);
    const cols = await adapter.listColumns(conn, report.sourceTable);
    columnNames = new Set(cols.map((c) => c.name));
    source = `${q(t.schema)}.${q(t.name)}`;
  } else if (report.sourceType === 'query') {
    const clean = validateReadOnlyQuery(report.sourceQuery);
    source = `( ${clean} ) AS src`;
    columnNames = null; // validated by the database itself (identifiers are quoted)
  } else {
    throw badRequest("sourceType must be 'table' or 'query'");
  }

  const checkCol = (c) => {
    if (typeof c !== 'string' || !c) throw badRequest('Column name is required');
    if (columnNames && !columnNames.has(c)) throw badRequest(`Column '${c}' does not exist in '${report.sourceTable}'`);
  };

  const used = new Set();
  const uniq = (a) => { let x = a; let n = 2; while (used.has(x)) x = `${a}_${n++}`; used.add(x); return x; };

  const dimSel = dims.map((d) => {
    checkCol(d.column);
    const alias = uniq(sanitizeAlias(d.alias || d.column));
    return { alias, expr: q(d.column) };
  });
  const measSel = meas.map((m) => {
    const agg = String(m.aggregate || '').toLowerCase();
    if (!AGGREGATES.includes(agg)) throw badRequest(`Aggregate '${m.aggregate}' is not allowed (use ${AGGREGATES.join(', ')})`);
    let inner;
    if (m.column === '*') {
      if (agg !== 'count') throw badRequest("Column '*' is only allowed with aggregate 'count'");
      inner = '*';
    } else { checkCol(m.column); inner = q(m.column); }
    const expr = agg === 'count_distinct' ? `COUNT(DISTINCT ${inner})` : `${agg.toUpperCase()}(${inner})`;
    const alias = uniq(sanitizeAlias(m.alias || `${agg}_${m.column === '*' ? 'all' : m.column}`));
    return { alias, expr };
  });

  const top = driver === 'mssql' ? `TOP ${limit} ` : '';
  const tail = driver === 'mssql' ? '' : ` LIMIT ${limit}`;
  const selectList = [
    ...dimSel.map((d) => `${d.expr} AS ${q(d.alias)}`),
    ...measSel.map((m) => `${m.expr} AS ${q(m.alias)}`),
  ].join(', ');

  let sql;
  if (!meas.length) {
    sql = `SELECT DISTINCT ${top}${selectList} FROM ${source} ORDER BY ${q(dimSel[0].alias)}${tail}`;
  } else if (!dims.length) {
    sql = `SELECT ${top}${selectList} FROM ${source}${tail}`;
  } else {
    const group = dimSel.map((d) => d.expr).join(', ');
    sql = `SELECT ${top}${selectList} FROM ${source} GROUP BY ${group} ORDER BY ${dimSel[0].expr}${tail}`;
  }
  return { sql, dimAliases: dimSel.map((d) => d.alias), measAliases: measSel.map((m) => m.alias), limit };
}

function buildChart(report, built, rows) {
  const chartType = CHART_TYPES.includes(report.chartType) ? report.chartType : 'table';
  const fmt = (v) => (v === null || v === undefined ? '' : v instanceof Date ? v.toISOString() : String(v));
  const labels = rows.map((r) => (built.dimAliases.length ? built.dimAliases.map((a) => fmt(r[a])).join(' / ') : 'Total'));
  const datasets = built.measAliases.map((a) => ({
    label: a,
    data: rows.map((r) => { const n = Number(r[a]); return Number.isFinite(n) ? n : 0; }),
  }));
  return { type: chartType, labels, datasets };
}

async function runReport(report, runtime) {
  const { conn, adapter, driver } = runtime;
  const built = await build(report, conn, adapter, driver);
  const result = await adapter.query(conn, built.sql, [], { limit: built.limit });
  const rows = result.rows.slice(0, built.limit);
  return { columns: result.columns, rows, sql: built.sql, chart: buildChart(report, built, rows) };
}

module.exports = { runReport, AGGREGATES, CHART_TYPES, clampLimit };
