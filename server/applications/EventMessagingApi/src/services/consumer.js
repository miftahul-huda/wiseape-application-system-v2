const crypto = require('crypto');
const kafkaService = require('./kafkaService');
const { dispatch } = require('./deliveryService');

const GROUP_ID = process.env.KAFKA_GROUP_ID || 'event-messaging-webhooks';
const TAG = '[EventMessaging Consumer]';
const TICK_MS = 5000;           // how often we look at the state
const REFRESH_MS = 30000;       // how often topics are re-listed while running
const NON_INTERNAL = /^(?!__).+$/;

let consumer = null;
let running = false;
let subscribed = [];
let known = null;               // topics seen so far (null until first successful listing)
const fresh = new Set();        // topics created after startup: read them from the beginning if the group has no offset
let timer = null;
let busy = false;
let lastCheck = 0;
let stopping = false;
let lastLogged = '';

function logOnce(msg) { if (msg !== lastLogged) { console.warn(`${TAG} ${msg}`); lastLogged = msg; } }

function parseValue(buf) {
  if (buf === null || buf === undefined) return null;
  const s = buf.toString('utf8');
  try { return JSON.parse(s); } catch { return s; }
}

function buildEvent(topic, partition, message) {
  const headers = {};
  for (const [k, v] of Object.entries(message.headers || {})) {
    headers[k] = Array.isArray(v) ? v.map(String).join(',') : (v === undefined || v === null ? '' : v.toString());
  }
  const payload = parseValue(message.value);
  const fromPayload = payload && typeof payload === 'object' && !Array.isArray(payload) && typeof payload.eventId === 'string' ? payload.eventId : null;
  return {
    eventId: fromPayload || headers['x-event-id'] || crypto.randomUUID(),
    topic,
    partition,
    offset: message.offset,
    timestamp: new Date(Number(message.timestamp)).toISOString(),
    key: message.key ? message.key.toString('utf8') : null,
    headers,
    payload,
  };
}

async function handleMessage({ topic, partition, message }) {
  try {
    await dispatch(buildEvent(topic, partition, message));
  } catch (err) {
    console.error(`${TAG} error handling ${topic}[${partition}]@${message.offset}:`, err.message);
  }
}

async function stopConsumer() {
  const c = consumer;
  consumer = null;
  running = false;
  subscribed = [];
  if (c) { try { await c.disconnect(); } catch { /* ignore */ } }
}

async function startConsumer(topics) {
  await stopConsumer();
  const c = kafkaService.kafka.consumer({
    groupId: GROUP_ID,
    sessionTimeout: 30000,
    retry: { initialRetryTime: 300, retries: 5 },
  });
  c.on(c.events.CRASH, (e) => {
    if (consumer === c && !e.payload.restart) {
      console.error(`${TAG} crashed: ${e.payload.error && e.payload.error.message}; will restart`);
      consumer = null; running = false; subscribed = [];
      c.disconnect().catch(() => {});
    }
  });
  try {
    await c.connect();
    for (const t of topics) await c.subscribe({ topic: t, fromBeginning: fresh.has(t) });
    consumer = c;
    await c.run({ eachMessage: handleMessage });
    running = true;
    subscribed = topics.slice();
    lastLogged = '';
    console.log(`${TAG} running (group ${GROUP_ID}); ${topics.length} topic(s): ${topics.join(', ')}`);
  } catch (err) {
    consumer = null; running = false; subscribed = [];
    try { await c.disconnect(); } catch { /* ignore */ }
    throw err;
  }
}

async function refresh(force) {
  if (busy || stopping) return;
  if (!force && running && Date.now() - lastCheck < REFRESH_MS) return;
  busy = true;
  try {
    const topics = (await kafkaService.listTopics()).filter((t) => NON_INTERNAL.test(t));
    lastCheck = Date.now();
    if (known === null) known = new Set(topics);
    else for (const t of topics) if (!known.has(t)) { known.add(t); fresh.add(t); }
    const needs = topics.length > 0 && (!running || topics.some((t) => !subscribed.includes(t)));
    if (needs) {
      if (running) console.log(`${TAG} new topic(s) detected, re-subscribing: ${topics.filter((t) => !subscribed.includes(t)).join(', ')}`);
      await startConsumer(topics);
    }
  } catch (err) {
    logOnce(`not running (${err.message}); retrying in background`);
  } finally {
    busy = false;
  }
}

function start() {
  if (timer) return;
  refresh(true);
  timer = setInterval(() => refresh(false), TICK_MS);
  timer.unref();
}

// Called after publishing: pick up a brand-new topic without waiting for the periodic check.
function noteTopic(topic) {
  if (stopping) return;
  if (!known || !known.has(topic)) setTimeout(() => refresh(true), 500).unref();
}

async function stop() {
  stopping = true;
  if (timer) clearInterval(timer);
  await stopConsumer();
}

function status() {
  return { running, topics: subscribed.slice() };
}

module.exports = { start, stop, status, noteTopic };
