const crypto = require('crypto');
const { TopicWebhook, WebhookDelivery } = require('../models');

const TIMEOUT_MS = parseInt(process.env.WEBHOOK_TIMEOUT_MS || '10000', 10);
const MAX_ATTEMPTS = Math.max(1, parseInt(process.env.WEBHOOK_MAX_ATTEMPTS || '3', 10));
const BACKOFF_MS = [1000, 3000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sign(rawBody, secret) {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

function describeError(err) {
  if (err && err.name === 'AbortError') return `timeout after ${TIMEOUT_MS}ms`;
  const cause = err && err.cause && (err.cause.code || err.cause.message);
  return `${err && err.message ? err.message : String(err)}${cause ? ` (${cause})` : ''}`;
}

// One HTTP attempt. Never throws; returns { ok, httpStatus, error, retryable }.
async function attempt(webhook, event, rawBody) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Event-Id': String(event.eventId),
    'X-Event-Topic': event.topic,
    'X-Event-Timestamp': String(event.timestamp || new Date().toISOString()),
  };
  if (webhook.secret) headers['X-Event-Signature'] = sign(rawBody, webhook.secret);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(webhook.url, { method: 'POST', headers, body: rawBody, signal: ac.signal });
    try { await res.arrayBuffer(); } catch { /* ignore body errors */ }
    if (res.status >= 200 && res.status < 300) return { ok: true, httpStatus: res.status };
    return {
      ok: false,
      httpStatus: res.status,
      error: `HTTP ${res.status}`,
      retryable: res.status >= 500 || res.status === 429,
    };
  } catch (err) {
    return { ok: false, httpStatus: null, error: describeError(err), retryable: true };
  } finally {
    clearTimeout(timer);
  }
}

// Deliver with retries. Returns { success, httpStatus, error, durationMs, attempts }.
async function deliver(webhook, event) {
  const rawBody = JSON.stringify(event);
  const started = Date.now();
  let result;
  let attempts = 0;
  while (attempts < MAX_ATTEMPTS) {
    attempts += 1;
    result = await attempt(webhook, event, rawBody);
    if (result.ok || !result.retryable || attempts >= MAX_ATTEMPTS) break;
    await sleep(BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)]);
  }
  return {
    success: result.ok,
    httpStatus: result.httpStatus,
    error: result.ok ? null : result.error,
    durationMs: Date.now() - started,
    attempts,
  };
}

async function record(webhook, event, r) {
  try {
    await WebhookDelivery.create({
      webhookId: webhook.id,
      topic: event.topic,
      partition: event.partition === undefined ? null : event.partition,
      offset: event.offset === undefined ? null : String(event.offset),
      eventId: event.eventId ? String(event.eventId) : null,
      status: r.success ? 'success' : 'failed',
      httpStatus: r.httpStatus,
      attempts: r.attempts,
      error: r.error ? String(r.error).slice(0, 1000) : null,
      durationMs: r.durationMs,
    });
    await WebhookDelivery.prune();
  } catch (err) {
    console.error('[EventMessaging Delivery] could not record delivery:', err.message);
  }
}

// Deliver + record. Never throws.
async function deliverAndRecord(webhook, event) {
  let r;
  try {
    r = await deliver(webhook, event);
  } catch (err) {
    r = { success: false, httpStatus: null, error: describeError(err), durationMs: 0, attempts: 1 };
  }
  await record(webhook, event, r);
  return r;
}

// Fan an event out to every ACTIVE webhook of its topic, concurrently. Never throws.
async function dispatch(event) {
  let hooks;
  try {
    hooks = await TopicWebhook.findAll({ where: { topic: event.topic, isActive: true } });
  } catch (err) {
    console.error('[EventMessaging Delivery] could not load webhooks:', err.message);
    return;
  }
  if (!hooks.length) return;
  await Promise.allSettled(hooks.map((h) => deliverAndRecord(h, event)));
}

module.exports = { deliver, deliverAndRecord, dispatch, sign };
