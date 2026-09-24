class ApiEmployeeRepository {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || process.env.API_BASE_URL || 'http://localhost:4000';
  }

  async listEmployees({ limit = 10, offset = 0, sortField = 'id', sortDirection = 'asc' } = {}) {
    try {
      const params = new URLSearchParams({ limit, offset, sortField, sortDirection });
      const response = await fetch(`${this.baseUrl}/api/employees?${params}`);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.warn('[WAS] Employee API unavailable.', error.message);
      return { rows: [], totalCount: 0 };
    }
  }

  async updateEmployee(id, fields) {
    const response = await fetch(`${this.baseUrl}/api/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data.employee;
  }
}

module.exports = ApiEmployeeRepository;
