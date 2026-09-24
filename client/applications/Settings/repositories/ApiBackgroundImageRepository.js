class ApiBackgroundImageRepository {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || process.env.API_BASE_URL || 'http://localhost:4000';
  }

  async list(token, { limit = 10, offset = 0 } = {}) {
    const params = new URLSearchParams({ limit, offset });
    const response = await fetch(`${this.baseUrl}/api/background-images?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();
    return { rows: data.images || [], totalCount: data.totalCount || 0 };
  }

  async add(token, url) {
    const response = await fetch(`${this.baseUrl}/api/background-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data.image;
  }
}

module.exports = ApiBackgroundImageRepository;
