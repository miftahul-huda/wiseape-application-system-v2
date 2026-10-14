/**
 * Repository to communicate with the Utilities REST API
 * (server/applications/Utilities, port 4003 directly; through Kong: /utilities/api).
 * Success => { success: true, data }, error => { success: false, message }.
 */

const t = (key, fallback) => {
  try {
    if (typeof window !== 'undefined' && window.WiseI18n) return window.WiseI18n.t(key);
  } catch (e) { /* ignore */ }
  return fallback;
};

class UtilitiesApiRepository {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || (typeof process !== 'undefined' && process.env && process.env.UTILITIES_API_URL) || 'http://localhost:8000/utilities/api';
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
        throw new Error(`${t('UT_MSG_BACKEND_UNREACHABLE', 'Cannot reach the Utilities backend service at')} ${this.baseUrl}. server/applications/Utilities`);
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

  // [{ code: 'kong_manager', name }, { code: 'kafka_manager', name }]
  async listLinkTypes() {
    return (await this.request('/link-types')).data || [];
  }

  // type: 'kong_manager' | 'kafka_manager' (default link first)
  async listLinks(type) {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    return (await this.request(`/links${qs}`)).data || [];
  }

  async getLink(id) {
    return (await this.request(`/links/${id}`)).data;
  }

  // data: { type, name, url, description, isDefault }
  async createLink(data) {
    return (await this.request('/links', this._json('POST', data))).data;
  }

  // data: { name, url, description, isDefault }
  async updateLink(id, data) {
    return (await this.request(`/links/${id}`, this._json('PUT', data))).data;
  }

  async deleteLink(id) {
    return (await this.request(`/links/${id}`, { method: 'DELETE' })).data;
  }
}

export default UtilitiesApiRepository;
