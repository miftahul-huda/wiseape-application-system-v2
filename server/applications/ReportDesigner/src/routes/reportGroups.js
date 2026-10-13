const router = require('express').Router();
const { query } = require('../db/pool');
const { badRequest, notFound, conflict } = require('../utils/httpError');
const { slugifyCode } = require('../db/schema');

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const map = (r) => ({
  id: r.id, code: r.code, name: r.name, description: r.description, reportCount: r.report_count,
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
  // Code: no spaces, only letters/digits/_/-; derived from the name when omitted.
  const code = String(b.code ?? '').trim() || slugifyCode(name);
  if (!code) throw badRequest('code is required');
  if (code.length > 50) throw badRequest('code must be at most 50 characters');
  if (!/^[A-Za-z0-9_-]+$/.test(code)) throw badRequest('code must not contain spaces; use only letters, digits, "_" or "-"');
  return { code, name, description: b.description ? String(b.description) : null };
}

// Unique violations (name or code) -> 409 with a readable message.
function mapUnique(err) {
  if (err && err.code === '23505') {
    return conflict(String(err.constraint || '').includes('code') ? 'Report group code already exists' : 'Report group name already exists');
  }
  return err;
}

router.get('/', async (req, res) => ok(res, (await query(`${SELECT} ORDER BY g.code`)).rows.map(map)));
router.get('/by-code/:code', async (req, res) => {
  const r = await query(`${SELECT} WHERE lower(g.code)=lower($1)`, [req.params.code]);
  if (!r.rows[0]) throw notFound('Report group not found');
  ok(res, map(r.rows[0]));
});
router.get('/:id', async (req, res) => ok(res, map(await get(req.params.id))));

router.get('/:id/reports', async (req, res) => {
  await get(req.params.id);
  const r = await query(`SELECT id, group_id, name, description, chart_type, connection_id FROM rd_reports WHERE group_id=$1 ORDER BY name`, [req.params.id]);
  ok(res, r.rows.map((x) => ({ id: x.id, groupId: x.group_id, name: x.name, description: x.description, chartType: x.chart_type, connectionId: x.connection_id })));
});

router.post('/', async (req, res) => {
  const b = body(req.body);
  try {
    const r = await query('INSERT INTO rd_report_groups (code, name, description) VALUES ($1,$2,$3) RETURNING id', [b.code, b.name, b.description]);
    ok(res, map(await get(r.rows[0].id)), 201);
  } catch (err) {
    throw mapUnique(err);
  }
});
router.put('/:id', async (req, res) => {
  await get(req.params.id);
  const b = body(req.body);
  try {
    await query('UPDATE rd_report_groups SET code=$1, name=$2, description=$3, updated_at=now() WHERE id=$4', [b.code, b.name, b.description, req.params.id]);
  } catch (err) {
    throw mapUnique(err);
  }
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
