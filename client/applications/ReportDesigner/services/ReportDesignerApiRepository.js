/**
 * Repository to communicate with the Report Designer REST API
 * (server/applications/ReportDesigner running on port 4002).
 * Success => { success: true, data }, error => { success: false, message }.
 */

const t = (key, fallback) => {
  try {
    if (typeof window !== 'undefined' && window.WiseI18n) return window.WiseI18n.t(key);
  } catch (e) { /* ignore */ }
  return fallback;
};

class ReportDesignerApiRepository {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || (typeof process !== 'undefined' && process.env && process.env.REPORT_DESIGNER_API_URL) || 'http://localhost:4002/api';
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
        throw new Error(`${t('RD_MSG_BACKEND_UNREACHABLE', 'Cannot reach the Report Designer backend service at')} ${this.baseUrl}. server/applications/ReportDesigner`);
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

  // ── Database types ──────────────────────────────────────────
  async listDatabaseTypes() {
    return (await this.request('/database-types')).data || [];
  }

  // ── Connections ─────────────────────────────────────────────
  async listConnections() {
    return (await this.request('/connections')).data || [];
  }

  async getConnection(id) {
    return (await this.request(`/connections/${id}`)).data;
  }

  async createConnection(data) {
    return (await this.request('/connections', this._json('POST', data))).data;
  }

  async updateConnection(id, data) {
    return (await this.request(`/connections/${id}`, this._json('PUT', data))).data;
  }

  async deleteConnection(id) {
    return (await this.request(`/connections/${id}`, { method: 'DELETE' })).data;
  }

  // body = connection form body (+ optional id); resolves to { ok, message }
  async testConnection(data) {
    const json = await this.request('/connections/test', this._json('POST', data));
    return json.data !== undefined ? json.data : json;
  }

  async listTables(connectionId) {
    return (await this.request(`/connections/${connectionId}/tables`)).data || [];
  }

  async listColumns(connectionId, table) {
    return (await this.request(`/connections/${connectionId}/columns?table=${encodeURIComponent(table)}`)).data || [];
  }

  async queryColumns(connectionId, query) {
    return (await this.request(`/connections/${connectionId}/query-columns`, this._json('POST', { query }))).data || [];
  }

  // ── Report groups ───────────────────────────────────────────
  async listReportGroups() {
    return (await this.request('/report-groups')).data || [];
  }

  async getReportGroup(id) {
    return (await this.request(`/report-groups/${id}`)).data;
  }

  async createReportGroup(data) {
    return (await this.request('/report-groups', this._json('POST', data))).data;
  }

  async updateReportGroup(id, data) {
    return (await this.request(`/report-groups/${id}`, this._json('PUT', data))).data;
  }

  // The API answers 409 unless force=true when the group still has reports.
  async deleteReportGroup(id, force = false) {
    return (await this.request(`/report-groups/${id}${force ? '?force=true' : ''}`, { method: 'DELETE' })).data;
  }

  async listGroupReports(groupId) {
    return (await this.request(`/report-groups/${groupId}/reports`)).data || [];
  }

  // ── Reports ─────────────────────────────────────────────────
  async listReports(groupId) {
    const qs = groupId ? `?groupId=${encodeURIComponent(groupId)}` : '';
    return (await this.request(`/reports${qs}`)).data || [];
  }

  async getReport(id) {
    return (await this.request(`/reports/${id}`)).data;
  }

  async createReport(data) {
    return (await this.request('/reports', this._json('POST', data))).data;
  }

  async updateReport(id, data) {
    return (await this.request(`/reports/${id}`, this._json('PUT', data))).data;
  }

  async deleteReport(id) {
    return (await this.request(`/reports/${id}`, { method: 'DELETE' })).data;
  }

  // Resolves to { columns, rows, sql, chart }
  async getReportData(id) {
    return (await this.request(`/reports/${id}/data`)).data;
  }

  async previewReport(definition) {
    return (await this.request('/reports/preview', this._json('POST', definition))).data;
  }
}

export default ReportDesignerApiRepository;
