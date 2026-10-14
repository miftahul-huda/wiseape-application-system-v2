/**
 * Repository to communicate with the Event Messaging REST API
 * (server/applications/EventMessagingApi, port 4004 directly; through Kong: /event-messaging/api).
 * Success => { success: true, data }, error => { success: false, message }.
 */

const t = (key, fallback) => {
  try {
    if (typeof window !== 'undefined' && window.WiseI18n) return window.WiseI18n.t(key);
  } catch (e) { /* ignore */ }
  return fallback;
};

class EventMessagingApiRepository {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || (typeof process !== 'undefined' && process.env && process.env.EVENT_MESSAGING_API_URL) || 'http://localhost:8000/event-messaging/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

    let response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (err) {
      const msg = (err && err.message) || '';
      if (err instanceof TypeError || msg.includes('fetch failed') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        throw new Error(`${t('EM_MSG_BACKEND_UNREACHABLE', 'Cannot reach the Event Messaging backend service at')} ${this.baseUrl}. server/applications/EventMessagingApi`);
      }
      throw err;
    }

    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.success === false) {
      const err = new Error(json.message || `API error ${response.status}: ${response.statusText}`);
      err.status = response.status;
      err.errors = json.errors;
      throw err;
    }
    return json;
  }

  _json(method, body) {
    return { method, body: JSON.stringify(body || {}) };
  }

  _qs(params) {
    const parts = Object.keys(params || {})
      .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`);
    return parts.length ? `?${parts.join('&')}` : '';
  }

  // ── Webhooks (topic -> url) ──────────────────────────────────
  // [{ id, topic, url, description, hasSecret, isActive, createdAt, updatedAt }]
  async listWebhooks(topic) {
    return (await this.request(`/webhooks${this._qs({ topic })}`)).data || [];
  }

  async getWebhook(id) {
    return (await this.request(`/webhooks/${id}`)).data;
  }

  // data: { topic, url, description, secret, isActive }
  async createWebhook(data) {
    return (await this.request('/webhooks', this._json('POST', data))).data;
  }

  // data: { topic?, url, description, secret, clearSecret, isActive } (empty secret keeps the stored one)
  async updateWebhook(id, data) {
    return (await this.request(`/webhooks/${id}`, this._json('PUT', data))).data;
  }

  async deleteWebhook(id) {
    return (await this.request(`/webhooks/${id}`, { method: 'DELETE' })).data;
  }

  // => { success, httpStatus, error, durationMs }. The API call itself succeeding
  // does not mean the webhook did: inspect `success` of the returned data.
  async testWebhook(id) {
    const json = await this.request(`/webhooks/${id}/test`, { method: 'POST', body: '{}' });
    return json.data !== undefined ? json.data : json;
  }

  // ── Deliveries ───────────────────────────────────────────────
  // filter: { webhookId, topic, status: 'success'|'failed', limit }
  async listDeliveries(filter = {}) {
    return (await this.request(`/deliveries${this._qs(filter)}`)).data || [];
  }

  // ── Kafka ────────────────────────────────────────────────────
  // ["topic-a", ...] (503 when Kafka is down)
  async listTopics() {
    return (await this.request('/topics')).data || [];
  }

  // data: { topic, key, payload } => { topic, partition, offset, eventId }
  async publishMessage(data) {
    return (await this.request('/messages', this._json('POST', data))).data;
  }

  // data: { application, event, data } => { topic, partition, offset, eventId }
  async publishClientApplicationEvent(data) {
    return (await this.request('/client-application-events', this._json('POST', data))).data;
  }

  // => { database, kafkaProducer, consumer: { running, topics } }
  async health() {
    const json = await this.request('/health');
    return json.data !== undefined ? json.data : json;
  }
}

export default EventMessagingApiRepository;
