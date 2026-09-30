/**
 * Repository to communicate with Wiseape HRIS Microservice REST API Backend
 * (server/applications/HRIS running on port 4001)
 */

class HrisApiRepository {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || process.env.HRIS_API_URL || 'http://localhost:4001/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = json.message || `API error ${response.status}: ${response.statusText}`;
        const err = new Error(errorMsg);
        err.status = response.status;
        err.errors = json.errors;
        throw err;
      }

      return json;
    } catch (err) {
      if (err.message && err.message.includes('fetch failed')) {
        throw new Error(`Tidak dapat terhubung ke Backend Service HRIS di ${this.baseUrl}. Pastikan service server/applications/HRIS sedang berjalan (port 4001).`);
      }
      throw err;
    }
  }

  // --- Employees ---

  async getStatistics() {
    const res = await this.request('/employees/statistics');
    return res.data;
  }

  async listEmployees(query = {}) {
    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page);
    if (query.limit) params.append('limit', query.limit);
    if (query.search) params.append('search', query.search);
    if (query.department && query.department !== 'Semua' && query.department !== '') params.append('department', query.department);
    if (query.jobTitle && query.jobTitle !== 'Semua' && query.jobTitle !== '') params.append('jobTitle', query.jobTitle);
    if (query.employmentStatus && query.employmentStatus !== 'Semua' && query.employmentStatus !== '') params.append('employmentStatus', query.employmentStatus);
    if (query.isActive !== undefined && query.isActive !== 'Semua' && query.isActive !== '') params.append('isActive', query.isActive);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query.withDetails) params.append('withDetails', query.withDetails);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request(`/employees${qs}`);
    return {
      rows: res.data || [],
      meta: res.meta || { total: (res.data || []).length }
    };
  }

  async getEmployeeById(id) {
    const res = await this.request(`/employees/${id}`);
    return res.data;
  }

  async createEmployee(data) {
    const res = await this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateEmployee(id, data) {
    const res = await this.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deactivateEmployee(id, { reason, status, effectiveDate } = {}) {
    const res = await this.request(`/employees/${id}/deactivate`, {
      method: 'PATCH',
      body: JSON.stringify({ reason, status, effectiveDate })
    });
    return res.data;
  }

  async activateEmployee(id) {
    const res = await this.request(`/employees/${id}/activate`, {
      method: 'PATCH'
    });
    return res.data;
  }

  async deleteEmployee(id, force = false) {
    const qs = force ? '?force=true' : '';
    const res = await this.request(`/employees/${id}${qs}`, {
      method: 'DELETE'
    });
    return res;
  }

  // --- Documents ---

  async addDocument(employeeId, data) {
    const res = await this.request(`/employees/${employeeId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateDocument(id, data) {
    const res = await this.request(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deleteDocument(id) {
    return this.request(`/documents/${id}`, { method: 'DELETE' });
  }

  // --- Work Experiences ---

  async addWorkExperience(employeeId, data) {
    const res = await this.request(`/employees/${employeeId}/work-experiences`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateWorkExperience(id, data) {
    const res = await this.request(`/work-experiences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deleteWorkExperience(id) {
    return this.request(`/work-experiences/${id}`, { method: 'DELETE' });
  }

  // --- Education Histories ---

  async addEducationHistory(employeeId, data) {
    const res = await this.request(`/employees/${employeeId}/education`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateEducationHistory(id, data) {
    const res = await this.request(`/education/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deleteEducationHistory(id) {
    return this.request(`/education/${id}`, { method: 'DELETE' });
  }

  // --- Career Histories ---

  async addCareerHistory(employeeId, data) {
    const res = await this.request(`/employees/${employeeId}/career-history`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateCareerHistory(id, data) {
    const res = await this.request(`/career-history/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deleteCareerHistory(id) {
    return this.request(`/career-history/${id}`, { method: 'DELETE' });
  }
}

module.exports = HrisApiRepository;
