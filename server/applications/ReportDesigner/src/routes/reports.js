const router = require('express').Router();
const { query } = require('../db/pool');
const { badRequest, notFound } = require('../utils/httpError');
const { runReport, AGGREGATES, CHART_TYPES, clampLimit } = require('../services/reportRunner');
const { validateReadOnlyQuery } = require('../services/queryGuard');
const { getRuntime } = require('../services/connectionService');

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const SELECT = `SELECT r.*, g.name AS group_name, c.name AS connection_name FROM rd_reports r
  LEFT JOIN rd_report_groups g ON g.id = r.group_id
  LEFT JOIN rd_connections c ON c.id = r.connection_id`;

const map = (r) => ({
  id: r.id, groupId: r.group_id, groupName: r.group_name, name: r.name, description: r.description,
  connectionId: r.connection_id, connectionName: r.connection_name, sourceType: r.source_type,
  sourceTable: r.source_table, sourceQuery: r.source_query, chartType: r.chart_type,
  dimensions: r.dimensions, measures: r.measures, rowLimit: r.row_limit, options: r.options,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

async function get(id) {
  if (!/^\d+$/.test(String(id))) throw notFound('Report not found');
  const r = await query(`${SELECT} WHERE r.id=$1`, [id]);
  if (!r.rows[0]) throw notFound('Report not found');
  return r.rows[0];
}

// Validates report definition (partial: name optional for preview)
async function normalize(b = {}, { requireName = true } = {}) {
  const name = String(b.name ?? '').trim();
  if (requireName && !name) throw badRequest('name is required');
  const connectionId = parseInt(b.connectionId, 10);
  if (!Number.isInteger(connectionId)) throw badRequest('connectionId is required');
  if (!(await query('SELECT 1 FROM rd_connections WHERE id=$1', [connectionId])).rowCount) throw badRequest('connectionId does not exist');
  let groupId = null;
  if (b.groupId !== undefined && b.groupId !== null && b.groupId !== '') {
    groupId = parseInt(b.groupId, 10);
    if (!Number.isInteger(groupId) || !(await query('SELECT 1 FROM rd_report_groups WHERE id=$1', [groupId])).rowCount) throw badRequest('groupId does not exist');
  }
  if (!['table', 'query'].includes(b.sourceType)) throw badRequest("sourceType must be 'table' or 'query'");
  if (b.sourceType === 'table' && !String(b.sourceTable || '').trim()) throw badRequest('sourceTable is required');
  if (b.sourceType === 'query') validateReadOnlyQuery(b.sourceQuery);
  const chartType = b.chartType || 'table';
  if (!CHART_TYPES.includes(chartType)) throw badRequest(`chartType must be one of: ${CHART_TYPES.join(', ')}`);
  const dimensions = (Array.isArray(b.dimensions) ? b.dimensions : []).map((d) => {
    if (!d || !String(d.column || '').trim()) throw badRequest('Each dimension needs a column');
    return { column: String(d.column), alias: d.alias ? String(d.alias) : '' };
  });
  const measures = (Array.isArray(b.measures) ? b.measures : []).map((m) => {
    if (!m || !String(m.column || '').trim()) throw badRequest('Each measure needs a column');
    const aggregate = String(m.aggregate || '').toLowerCase();
    if (!AGGREGATES.includes(aggregate)) throw badRequest(`aggregate must be one of: ${AGGREGATES.join(', ')}`);
    return { column: String(m.column), aggregate, alias: m.alias ? String(m.alias) : '' };
  });
  const options = b.options && typeof b.options === 'object' && !Array.isArray(b.options) ? b.options : {};
  return {
    groupId, name, description: b.description ? String(b.description) : null, connectionId,
    sourceType: b.sourceType, sourceTable: b.sourceType === 'table' ? String(b.sourceTable).trim() : null,
    sourceQuery: b.sourceType === 'query' ? String(b.sourceQuery) : null,
    chartType, dimensions, measures, rowLimit: clampLimit(b.rowLimit), options,
  };
}

const cols = (n) => [n.groupId, n.name, n.description, n.connectionId, n.sourceType, n.sourceTable, n.sourceQuery,
  n.chartType, JSON.stringify(n.dimensions), JSON.stringify(n.measures), n.rowLimit, JSON.stringify(n.options)];

router.get('/', async (req, res) => {
  const where = req.query.groupId ? ' WHERE r.group_id=$1' : '';
  const params = req.query.groupId ? [parseInt(req.query.groupId, 10) || 0] : [];
  ok(res, (await query(`${SELECT}${where} ORDER BY r.name`, params)).rows.map(map));
});

router.post('/preview', async (req, res) => {
  const n = await normalize(req.body, { requireName: false });
  ok(res, await runReport(n, await getRuntime(n.connectionId)));
});

router.get('/:id', async (req, res) => ok(res, map(await get(req.params.id))));

router.get('/:id/data', async (req, res) => {
  const r = map(await get(req.params.id));
  ok(res, await runReport(r, await getRuntime(r.connectionId)));
});

router.post('/', async (req, res) => {
  const n = await normalize(req.body);
  const r = await query(
    `INSERT INTO rd_reports (group_id,name,description,connection_id,source_type,source_table,source_query,chart_type,dimensions,measures,row_limit,options)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`, cols(n));
  ok(res, map(await get(r.rows[0].id)), 201);
});

router.put('/:id', async (req, res) => {
  await get(req.params.id);
  const n = await normalize(req.body);
  await query(
    `UPDATE rd_reports SET group_id=$1,name=$2,description=$3,connection_id=$4,source_type=$5,source_table=$6,source_query=$7,
     chart_type=$8,dimensions=$9,measures=$10,row_limit=$11,options=$12,updated_at=now() WHERE id=$13`, [...cols(n), req.params.id]);
  ok(res, map(await get(req.params.id)));
});

router.delete('/:id', async (req, res) => {
  await get(req.params.id);
  await query('DELETE FROM rd_reports WHERE id=$1', [req.params.id]);
  ok(res, { id: Number(req.params.id) });
});

module.exports = router;
