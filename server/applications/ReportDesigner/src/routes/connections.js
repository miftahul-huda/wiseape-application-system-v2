const router = require('express').Router();
const { query } = require('../db/pool');
const { badRequest, notFound, conflict } = require('../utils/httpError');
const svc = require('../services/connectionService');
const { getAdapter, limitSql } = require('../drivers');
const { validateReadOnlyQuery } = require('../services/queryGuard');

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });

async function loadType(id) {
  const r = await query('SELECT * FROM rd_database_types WHERE id=$1', [id]);
  return r.rows[0];
}

// Validates body, returns normalized fields (password may be undefined)
async function normalize(body, partialPassword = true) {
  const b = body || {};
  const typeId = parseInt(b.databaseTypeId, 10);
  const type = Number.isInteger(typeId) ? await loadType(typeId) : null;
  if (!type) throw badRequest('databaseTypeId is invalid');
  const missing = ['name', 'host', 'databaseName', 'username'].filter((k) => !String(b[k] ?? '').trim());
  if (missing.length) throw badRequest(`Required: ${missing.join(', ')}`);
  const port = b.port === undefined || b.port === null || b.port === '' ? type.default_port : parseInt(b.port, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw badRequest('port is invalid');
  const options = b.options && typeof b.options === 'object' && !Array.isArray(b.options) ? b.options : {};
  return {
    type, name: String(b.name).trim(), host: String(b.host).trim(), port,
    databaseName: String(b.databaseName).trim(), username: String(b.username).trim(),
    password: typeof b.password === 'string' && b.password !== '' ? b.password : undefined, options,
  };
}

router.get('/', async (req, res) => {
  const r = await query(`${svc.SELECT} ORDER BY c.name`);
  ok(res, r.rows.map(svc.toPublic));
});

router.post('/test', async (req, res) => {
  const n = await normalize(req.body);
  let password = n.password;
  if (password === undefined && req.body.id) {
    const row = await svc.getRow(parseInt(req.body.id, 10));
    password = svc.toRuntime(row).password;
  }
  const conn = { host: n.host, port: n.port, databaseName: n.databaseName, username: n.username, password: password || '', options: n.options };
  try {
    await getAdapter(n.type.driver).testConnection(conn);
    ok(res, { ok: true, message: 'Connection successful' });
  } catch (e) {
    ok(res, { ok: false, message: e.message || String(e) });
  }
});

router.get('/:id', async (req, res) => ok(res, svc.toPublic(await svc.getRow(req.params.id))));

router.post('/', async (req, res) => {
  const n = await normalize(req.body);
  const r = await query(
    `INSERT INTO rd_connections (name, database_type_id, host, port, database_name, username, password_enc, options)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [n.name, n.type.id, n.host, n.port, n.databaseName, n.username, svc.encrypt(n.password), JSON.stringify(n.options)]);
  ok(res, svc.toPublic(await svc.getRow(r.rows[0].id)), 201);
});

router.put('/:id', async (req, res) => {
  await svc.getRow(req.params.id);
  const n = await normalize(req.body);
  const params = [n.name, n.type.id, n.host, n.port, n.databaseName, n.username, JSON.stringify(n.options), req.params.id];
  let pw = '';
  if (n.password !== undefined) { params.push(svc.encrypt(n.password)); pw = ', password_enc = $9'; }
  await query(
    `UPDATE rd_connections SET name=$1, database_type_id=$2, host=$3, port=$4, database_name=$5, username=$6,
     options=$7, updated_at=now()${pw} WHERE id=$8`, params);
  ok(res, svc.toPublic(await svc.getRow(req.params.id)));
});

router.delete('/:id', async (req, res) => {
  await svc.getRow(req.params.id);
  const used = await query('SELECT count(*)::int AS n FROM rd_reports WHERE connection_id=$1', [req.params.id]);
  if (used.rows[0].n > 0) throw conflict(`Connection is used by ${used.rows[0].n} report(s); delete or reassign them first`);
  await query('DELETE FROM rd_connections WHERE id=$1', [req.params.id]);
  ok(res, { id: Number(req.params.id) });
});

router.get('/:id/tables', async (req, res) => {
  const { conn, adapter } = await svc.getRuntime(req.params.id);
  const tables = await adapter.listTables(conn);
  ok(res, tables.map((t) => ({ schema: t.schema, name: t.name, type: t.type, fullName: `${t.schema}.${t.name}` })));
});

router.get('/:id/columns', async (req, res) => {
  const table = req.query.table;
  if (!table) throw badRequest("Query param 'table' (schema.name) is required");
  const { conn, adapter } = await svc.getRuntime(req.params.id);
  const tables = await adapter.listTables(conn);
  if (!tables.some((t) => `${t.schema}.${t.name}` === table)) throw notFound(`Table '${table}' not found`);
  ok(res, await adapter.listColumns(conn, table));
});

router.post('/:id/query-columns', async (req, res) => {
  const clean = validateReadOnlyQuery(req.body && req.body.query);
  const { conn, adapter, driver } = await svc.getRuntime(req.params.id);
  // LIMIT 0 / TOP 0 returns column metadata without rows
  const result = await adapter.query(conn, limitSql(driver, clean, 0), [], { limit: 0 })
    .catch((e) => { throw badRequest(`Query failed: ${e.message}`); });
  ok(res, result.columns.map((name) => ({ name })));
});

module.exports = router;
