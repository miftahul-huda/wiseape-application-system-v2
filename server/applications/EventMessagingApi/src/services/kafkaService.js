const { Kafka, logLevel } = require('kafkajs');
const { httpError } = require('../utils/validators');

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',').map((s) => s.trim()).filter(Boolean);
const clientId = process.env.KAFKA_CLIENT_ID || 'event-messaging-api';
const TAG = '[EventMessaging Kafka]';

const kafka = new Kafka({
  clientId,
  brokers,
  logLevel: logLevel.NOTHING,
  connectionTimeout: 3000,
  requestTimeout: 10000,
  retry: { initialRetryTime: 300, retries: 3 },
});

let producer = null;
let producerConnected = false;
let admin = null;
let adminConnected = false;
let retryTimer = null;
let stopped = false;
let lastLogged = '';

function logOnce(msg) {
  if (msg !== lastLogged) { console.warn(`${TAG} ${msg}`); lastLogged = msg; }
}

function newProducer() {
  const p = kafka.producer({ allowAutoTopicCreation: true });
  p.on(p.events.DISCONNECT, () => {
    producerConnected = false;
    if (!stopped) { logOnce('producer disconnected; reconnecting in background'); scheduleProducerConnect(); }
  });
  return p;
}

async function connectProducer() {
  if (stopped || producerConnected) return;
  try {
    if (!producer) producer = newProducer();
    await producer.connect();
    producerConnected = true;
    lastLogged = '';
    console.log(`${TAG} producer connected (${brokers.join(',')})`);
  } catch (err) {
    producerConnected = false;
    logOnce(`producer cannot connect to ${brokers.join(',')}: ${err.message}; retrying in background`);
    try { await producer.disconnect(); } catch { /* ignore */ }
    producer = null;
    scheduleProducerConnect();
  }
}

function scheduleProducerConnect() {
  if (stopped || retryTimer) return;
  retryTimer = setTimeout(() => { retryTimer = null; connectProducer(); }, 5000);
  retryTimer.unref();
}

function start() { connectProducer(); }

const unavailable = (detail) => httpError(503, `Kafka is unavailable${detail ? `: ${detail}` : ''}`);

async function publish({ topic, key, value, headers }) {
  if (!producerConnected) throw unavailable('producer is not connected');
  try {
    const result = await producer.send({
      topic,
      acks: -1,
      messages: [{ key: key === undefined || key === null ? null : String(key), value, headers }],
    });
    const r = result[0];
    return { topic, partition: r.partition, offset: r.baseOffset };
  } catch (err) {
    if (err.type === 'INVALID_TOPIC_EXCEPTION') throw httpError(400, `Kafka rejected the topic name: ${err.message}`);
    throw unavailable(err.message);
  }
}

async function getAdmin() {
  if (!admin) {
    admin = kafka.admin();
    admin.on(admin.events.DISCONNECT, () => { adminConnected = false; });
  }
  if (!adminConnected) {
    try {
      await admin.connect();
      adminConnected = true;
    } catch (err) {
      adminConnected = false;
      try { await admin.disconnect(); } catch { /* ignore */ }
      admin = null;
      throw unavailable(err.message);
    }
  }
  return admin;
}

// Non-internal topic names, sorted.
async function listTopics() {
  const a = await getAdmin();
  try {
    const all = await a.listTopics();
    return all.filter((t) => !t.startsWith('__')).sort();
  } catch (err) {
    adminConnected = false;
    throw unavailable(err.message);
  }
}

async function stop() {
  stopped = true;
  if (retryTimer) clearTimeout(retryTimer);
  try { if (producer) await producer.disconnect(); } catch { /* ignore */ }
  try { if (admin) await admin.disconnect(); } catch { /* ignore */ }
  producerConnected = false;
  adminConnected = false;
}

module.exports = {
  kafka, start, stop, publish, listTopics,
  isProducerConnected: () => producerConnected,
};
