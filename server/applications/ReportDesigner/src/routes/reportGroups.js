const router = require('express').Router();
const { query } = require('../db/pool');
const { badRequest, notFound, conflict } = require('../utils/httpError');

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const map = (r) => ({
  id: r.id, name: r.name, description: r.description, reportCount: r.report_count,
  createdAt: r.created_at, updatedAt: r.updated_at,
});
const SELECT = `SELECT g.*, (SELECT count(*)::int FROM rd_reports r WHERE r.group_id = g.id) AS report_count FROM rd_report_groups g`;

async function get(id) {
  if (!/^\d+$/.test(String(id))) throw notFound('Report group not found');
  const r = await query(`${SELECT} WHERE g.id=$1`, [id]);
  if (!r.rows[0]) throw notFound('Report group not found');
  return r.rows[0];
}
function body(b = {}) {
  const name = String(b.name ?? '').trim();
  if (!name) throw badRequest('name is required');
  return { name, description: b.description ? String(b.description) : null };
}

router.get('/', async (req, res) => ok(res, (await query(`${SELECT} ORDER BY g.name`)).rows.map(map)));
router.get('/:id', async (req, res) => ok(res, map(await get(req.params.id))));

router.get('/:id/reports', async (req, res) => {
  await get(req.params.id);
  const r = await query(`SELECT id, group_id, name, description, chart_type, connection_id FROM rd_reports WHERE group_id=$1 ORDER BY name`, [req.params.id]);
  ok(res, r.rows.map((x) => ({ id: x.id, groupId: x.group_id, name: x.name, description: x.description, chartType: x.chart_type, connectionId: x.connection_id })));
});

router.post('/', async (req, res) => {
  const b = body(req.body);
  const r = await query('INSERT INTO rd_report_groups (name, description) VALUES ($1,$2) RETURNING id', [b.name, b.description]);
  ok(res, map(await get(r.rows[0].id)), 201);
});
router.put('/:id', async (req, res) => {
  await get(req.params.id);
  const b = body(req.body);
  await query('UPDATE rd_report_groups SET name=$1, description=$2, updated_at=now() WHERE id=$3', [b.name, b.description, req.params.id]);
  ok(res, map(await get(req.params.id)));
});
router.delete('/:id', async (req, res) => {
  const g = await get(req.params.id);
  if (g.report_count > 0) {
    if (req.query.force !== 'true') throw conflict(`Group has ${g.report_count} report(s); use ?force=true to delete them as well`);
    await query('DELETE FROM rd_reports WHERE group_id=$1', [req.params.id]);
  }
  await query('DELETE FROM rd_report_groups WHERE id=$1', [req.params.id]);
  ok(res, { id: g.id, deletedReports: g.report_count });
});

module.exports = router;
