const express = require('express');
const { Op } = require('sequelize');
const { UtilityLink, LINK_TYPES, TYPE_CODES } = require('../models/UtilityLink');

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const httpError = (status, message) => Object.assign(new Error(message), { status });

const toDto = (l) => ({
  id: l.id, type: l.type, name: l.name, url: l.url, description: l.description,
  isDefault: l.isDefault, createdAt: l.createdAt, updatedAt: l.updatedAt,
});

async function findOr404(id) {
  if (!/^\d+$/.test(String(id))) throw httpError(400, 'id must be a positive integer');
  const link = await UtilityLink.findByPk(Number(id));
  if (!link) throw httpError(404, `Link ${id} not found`);
  return link;
}

const asBool = (v) => v === true || v === 'true';

router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'Wiseape Utilities API',
    endpoints: [
      'GET    /api/links?type=kong_manager|kafka_manager',
      'GET    /api/links/:id',
      'POST   /api/links',
      'PUT    /api/links/:id',
      'DELETE /api/links/:id',
      'GET    /api/link-types',
    ],
  });
});

router.get('/link-types', (req, res) => res.json({ success: true, data: LINK_TYPES }));

router.get('/links', wrap(async (req, res) => {
  const where = {};
  if (req.query.type !== undefined && req.query.type !== '') {
    if (!TYPE_CODES.includes(req.query.type)) throw httpError(400, `type must be one of: ${TYPE_CODES.join(', ')}`);
    where.type = req.query.type;
  }
  const rows = await UtilityLink.findAll({ where, order: [['isDefault', 'DESC'], ['name', 'ASC']] });
  res.json({ success: true, data: rows.map(toDto) });
}));

router.get('/links/:id', wrap(async (req, res) => {
  res.json({ success: true, data: toDto(await findOr404(req.params.id)) });
}));

router.post('/links', wrap(async (req, res) => {
  const b = req.body || {};
  const link = UtilityLink.build({
    type: b.type, name: b.name, url: b.url,
    description: b.description === undefined || b.description === '' ? null : b.description,
    isDefault: asBool(b.isDefault),
  });
  await link.validate();
  await UtilityLink.saveWithDefault(link);
  res.status(201).json({ success: true, data: toDto(link) });
}));

router.put('/links/:id', wrap(async (req, res) => {
  const link = await findOr404(req.params.id);
  const b = req.body || {};
  if (b.type !== undefined && b.type !== link.type) throw httpError(400, 'type cannot be changed');
  if (b.name !== undefined) link.name = b.name;
  if (b.url !== undefined) link.url = b.url;
  if (b.description !== undefined) link.description = b.description === '' ? null : b.description;
  if (b.isDefault !== undefined) link.isDefault = asBool(b.isDefault);
  await link.validate();
  await UtilityLink.saveWithDefault(link);
  res.json({ success: true, data: toDto(link) });
}));

router.delete('/links/:id', wrap(async (req, res) => {
  const link = await findOr404(req.params.id);
  await link.destroy();
  res.json({ success: true, data: { id: link.id } });
}));

router.use((req, res) => res.status(404).json({ success: false, message: `Endpoint '${req.method} ${req.originalUrl}' not found` }));

module.exports = router;
