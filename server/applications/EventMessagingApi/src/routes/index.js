const express = require('express');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, TopicWebhook, WebhookDelivery } = require('../models');
const kafkaService = require('../services/kafkaService');
const consumer = require('../services/consumer');
const { deliverAndRecord } = require('../services/deliveryService');
const { httpError, assertTopic } = require('../utils/validators');

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const asBool = (v) => v === true || v === 'true';

const toDto = (w) => ({
  id: w.id, topic: w.topic, url: w.url, description: w.description,
  hasSecret: !!w.secret, isActive: w.isActive, createdAt: w.createdAt, updatedAt: w.updatedAt,
});

async function findOr404(id) {
  if (!/^\d+$/.test(String(id))) throw httpError(400, 'id must be a positive integer');
  const w = await TopicWebhook.findByPk(Number(id));
  if (!w) throw httpError(404, `Webhook ${id} not found`);
  return w;
}

router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'Wiseape Event Messaging API',
    endpoints: [
      'POST   /api/messages                  {topic,key?,payload,headers?}',
      'POST   /api/client-application-events {application,event,data?,key?}',
      'GET    /api/webhooks?topic=',
      'GET    /api/webhooks/:id',
      'POST   /api/webhooks                  {topic,url,description?,secret?,isActive?}',
      'PUT    /api/webhooks/:id              {topic?,url?,description?,secret?,clearSecret?,isActive?}',
      'DELETE /api/webhooks/:id',
      'POST   /api/webhooks/:id/test',
      'GET    /api/deliveries?webhookId=&topic=&status=&limit=',
      'GET    /api/topics',
      'GET    /api/health',
    ],
  });
});

// ---- publishing ----
async function publish(topic, key, payload, headers, eventId) {
  const value = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const h = { ...(headers || {}), 'x-event-id': eventId };
  const r = await kafkaService.publish({ topic, key, value, headers: h });
  consumer.noteTopic(topic);
  return { topic: r.topic, partition: r.partition, offset: r.offset, eventId };
}

router.post('/messages', wrap(async (req, res) => {
  const b = req.body || {};
  assertTopic(b.topic);
  if (b.payload === undefined) throw httpError(400, 'payload is required');
  if (b.key !== undefined && b.key !== null && !['string', 'number'].includes(typeof b.key)) throw httpError(400, 'key must be a string');
  let headers;
  if (b.headers !== undefined && b.headers !== null) {
    if (!isObj(b.headers)) throw httpError(400, 'headers must be an object of strings');
    for (const [k, v] of Object.entries(b.headers)) {
      if (typeof v !== 'string') throw httpError(400, `header '${k}' must be a string`);
    }
    headers = b.headers;
  }
  const eventId = (headers && headers['x-event-id']) || crypto.randomUUID();
  res.status(201).json({ success: true, data: await publish(b.topic, b.key, b.payload, headers, eventId) });
}));

router.post('/client-application-events', wrap(async (req, res) => {
  const b = req.body || {};
  for (const f of ['application', 'event']) {
    if (typeof b[f] !== 'string' || b[f].trim() === '') throw httpError(400, `${f} is required and must be a non-empty string`);
  }
  if (b.key !== undefined && b.key !== null && !['string', 'number'].includes(typeof b.key)) throw httpError(400, 'key must be a string');
  const eventId = crypto.randomUUID();
  const body = { eventId, application: b.application, event: b.event, data: b.data === undefined ? null : b.data, occurredAt: new Date().toISOString() };
  res.status(201).json({ success: true, data: await publish('CLIENT_APPLICATION_EVENT', b.key, body, undefined, eventId) });
}));

// ---- webhooks ----
router.get('/webhooks', wrap(async (req, res) => {
  const where = {};
  if (req.query.topic) where.topic = String(req.query.topic);
  const rows = await TopicWebhook.findAll({ where, order: [['topic', 'ASC'], ['id', 'ASC']] });
  res.json({ success: true, data: rows.map(toDto) });
}));

router.get('/webhooks/:id', wrap(async (req, res) => {
  res.json({ success: true, data: toDto(await findOr404(req.params.id)) });
}));

router.post('/webhooks', wrap(async (req, res) => {
  const b = req.body || {};
  const w = TopicWebhook.build({
    topic: b.topic, url: b.url,
    description: b.description === undefined || b.description === '' ? null : b.description,
    secret: typeof b.secret === 'string' && b.secret !== '' ? b.secret : null,
    isActive: b.isActive === undefined ? true : asBool(b.isActive),
  });
  await w.save();
  res.status(201).json({ success: true, data: toDto(w) });
}));

router.put('/webhooks/:id', wrap(async (req, res) => {
  const w = await findOr404(req.params.id);
  const b = req.body || {};
  if (b.topic !== undefined) w.topic = b.topic;
  if (b.url !== undefined) w.url = b.url;
  if (b.description !== undefined) w.description = b.description === '' ? null : b.description;
  if (b.isActive !== undefined) w.isActive = asBool(b.isActive);
  if (asBool(b.clearSecret)) w.secret = null;
  else if (typeof b.secret === 'string' && b.secret !== '') w.secret = b.secret;
  await w.save();
  res.json({ success: true, data: toDto(w) });
}));

router.delete('/webhooks/:id', wrap(async (req, res) => {
  const w = await findOr404(req.params.id);
  await w.destroy();
  res.json({ success: true, data: { id: w.id } });
}));

router.post('/webhooks/:id/test', wrap(async (req, res) => {
  const w = await findOr404(req.params.id);
  const event = {
    eventId: crypto.randomUUID(), topic: w.topic, test: true,
    timestamp: new Date().toISOString(), payload: { message: 'test' },
  };
  const r = await deliverAndRecord(w, event);
  res.json({ success: r.success, httpStatus: r.httpStatus, error: r.error, durationMs: r.durationMs });
}));

// ---- deliveries ----
router.get('/deliveries', wrap(async (req, res) => {
  const where = {};
  if (req.query.webhookId !== undefined && req.query.webhookId !== '') {
    if (!/^\d+$/.test(req.query.webhookId)) throw httpError(400, 'webhookId must be an integer');
    where.webhookId = Number(req.query.webhookId);
  }
  if (req.query.topic) where.topic = String(req.query.topic);
  if (req.query.status) {
    if (!['success', 'failed'].includes(req.query.status)) throw httpError(400, 'status must be success or failed');
    where.status = req.query.status;
  }
  let limit = 100;
  if (req.query.limit !== undefined && req.query.limit !== '') {
    if (!/^\d+$/.test(req.query.limit) || Number(req.query.limit) < 1) throw httpError(400, 'limit must be a positive integer');
    limit = Math.min(Number(req.query.limit), 500);
  }
  const rows = await WebhookDelivery.findAll({ where, order: [['id', 'DESC']], limit });
  res.json({ success: true, data: rows });
}));

// ---- kafka info ----
router.get('/topics', wrap(async (req, res) => {
  res.json({ success: true, data: await kafkaService.listTopics() });
}));

router.get('/health', wrap(async (req, res) => {
  let database = 'up';
  try { await sequelize.authenticate(); } catch { database = 'down'; }
  res.json({
    database,
    kafkaProducer: kafkaService.isProducerConnected() ? 'connected' : 'disconnected',
    consumer: consumer.status(),
  });
}));

router.use((req, res) => res.status(404).json({ success: false, message: `Endpoint '${req.method} ${req.originalUrl}' not found` }));

module.exports = router;
