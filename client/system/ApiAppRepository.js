class ApiAppRepository {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || process.env.API_BASE_URL || 'http://localhost:4000';
  }

  async listApplications() {
    const response = await fetch(`${this.baseUrl}/api/apps`);
    if (!response.ok) {
      throw new Error(`[WAS] Failed to load application list: HTTP ${response.status}`);
    }

    const apps = await response.json();
    if (!Array.isArray(apps)) {
      throw new Error('[WAS] Invalid response from /api/apps: expected an array');
    }

    return apps.map((app) => ({
      ...app,
      appIcon: app.appIcon || '◫',
    }));
  }
}

module.exports = ApiAppRepository;
