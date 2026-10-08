/**
 * RecruitmentApiRepository
 * Unified Client API Service to communicate with HRIS Microservice Recruitment REST endpoints
 * Running on http://localhost:4001/api/recruitment
 */

class RecruitmentApiRepository {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || (typeof process !== 'undefined' && process.env && process.env.HRIS_API_URL) || 'http://localhost:4001/api';
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
        throw new Error(`Tidak dapat terhubung ke Backend Service HRIS di ${this.baseUrl}. Pastikan service server/applications/HRIS berjalan di port 4001.`);
      }
      throw err;
    }
  }

  // ==========================================
  // 1. Job Vacancies
  // ==========================================

  async listVacancies(query = {}) {
    const params = new URLSearchParams();
    if (query.search) params.append('search', query.search);
    if (query.department && query.department !== 'ALL') params.append('department', query.department);
    if (query.status && query.status !== 'ALL') params.append('status', query.status);
    if (query.page) params.append('page', query.page);
    if (query.limit) params.append('limit', query.limit);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request(`/recruitment/vacancies${qs}`);
    return {
      rows: res.data || [],
      total: res.meta ? res.meta.total : (res.data || []).length,
      page: res.meta ? res.meta.page : 1,
      totalPages: res.meta ? res.meta.totalPages : 1
    };
  }

  async getVacancy(id) {
    const res = await this.request(`/recruitment/vacancies/${id}`);
    return res.data;
  }

  async createVacancy(data) {
    const res = await this.request('/recruitment/vacancies', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateVacancy(id, data) {
    const res = await this.request(`/recruitment/vacancies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deleteVacancy(id) {
    const res = await this.request(`/recruitment/vacancies/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  }

  // ==========================================
  // 2. Job Applicants
  // ==========================================

  async listApplicants(query = {}) {
    const params = new URLSearchParams();
    if (query.search) params.append('search', query.search);
    if (query.jobVacancyId && query.jobVacancyId !== 'ALL') params.append('jobVacancyId', query.jobVacancyId);
    if (query.status && query.status !== 'ALL') params.append('status', query.status);
    if (query.page) params.append('page', query.page);
    if (query.limit) params.append('limit', query.limit);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request(`/recruitment/applicants${qs}`);
    return {
      rows: res.data || [],
      total: res.meta ? res.meta.total : (res.data || []).length,
      page: res.meta ? res.meta.page : 1,
      totalPages: res.meta ? res.meta.totalPages : 1
    };
  }

  async getApplicant(id) {
    const res = await this.request(`/recruitment/applicants/${id}`);
    return res.data;
  }

  async createApplicant(data) {
    const res = await this.request('/recruitment/applicants', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateApplicant(id, data) {
    const res = await this.request(`/recruitment/applicants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deleteApplicant(id) {
    const res = await this.request(`/recruitment/applicants/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  }

  // ==========================================
  // 3. Applicant Processes
  // ==========================================

  async listProcesses(applicantId) {
    const res = await this.request(`/recruitment/applicants/${applicantId}/processes`);
    return res.data || [];
  }

  async getProcess(id) {
    const res = await this.request(`/recruitment/processes/${id}`);
    return res.data;
  }

  async createProcess(data) {
    const res = await this.request('/recruitment/processes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateProcess(id, data) {
    const res = await this.request(`/recruitment/processes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deleteProcess(id) {
    const res = await this.request(`/recruitment/processes/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  }

  async uploadProcessDocument(processId, formData) {
    const url = `${this.baseUrl}/recruitment/processes/${processId}/documents`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.message || `Upload error: ${response.statusText}`);
    }
    return json.data;
  }

  async deleteProcessDocument(processId, docId) {
    const res = await this.request(`/recruitment/processes/${processId}/documents/${docId}`, {
      method: 'DELETE'
    });
    return res.data;
  }

  // ==========================================
  // 4. Stage Templates
  // ==========================================

  async listStageTemplates(query = {}) {
    const params = new URLSearchParams();
    if (query.search) params.append('search', query.search);
    if (query.isActive !== undefined && query.isActive !== 'ALL') params.append('isActive', query.isActive);
    if (query.page) params.append('page', query.page);
    if (query.limit) params.append('limit', query.limit);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request(`/recruitment/stage-templates${qs}`);
    return {
      rows: res.data || [],
      total: res.meta ? res.meta.total : (res.data || []).length
    };
  }

  async getStageTemplate(id) {
    const res = await this.request(`/recruitment/stage-templates/${id}`);
    return res.data;
  }

  async createStageTemplate(data) {
    const res = await this.request('/recruitment/stage-templates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateStageTemplate(id, data) {
    const res = await this.request(`/recruitment/stage-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deleteStageTemplate(id) {
    const res = await this.request(`/recruitment/stage-templates/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  }

  // ==========================================
  // 5. Matrix Templates
  // ==========================================

  async listMatrixTemplates(query = {}) {
    const params = new URLSearchParams();
    if (query.search) params.append('search', query.search);
    if (query.isActive !== undefined && query.isActive !== 'ALL') params.append('isActive', query.isActive);
    if (query.page) params.append('page', query.page);
    if (query.limit) params.append('limit', query.limit);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request(`/recruitment/matrix-templates${qs}`);
    return {
      rows: res.data || [],
      total: res.meta ? res.meta.total : (res.data || []).length
    };
  }

  async getMatrixTemplate(id) {
    const res = await this.request(`/recruitment/matrix-templates/${id}`);
    return res.data;
  }

  async createMatrixTemplate(data) {
    const res = await this.request('/recruitment/matrix-templates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateMatrixTemplate(id, data) {
    const res = await this.request(`/recruitment/matrix-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deleteMatrixTemplate(id) {
    const res = await this.request(`/recruitment/matrix-templates/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  }

  // ==========================================
  // 6. Organization & Master Data Helpers
  // ==========================================

  async listOrganizations() {
    try {
      const res = await this.request('/organizations');
      return res.data || [];
    } catch (e) {
      return [];
    }
  }

  async listPositions() {
    try {
      const res = await this.request('/positions?limit=100');
      return (res.data && res.data.rows) ? res.data.rows : (res.data || []);
    } catch (e) {
      return [];
    }
  }
}

module.exports = RecruitmentApiRepository;
