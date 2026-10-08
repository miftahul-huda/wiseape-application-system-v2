/**
 * Unified Repository to communicate with Wiseape HRIS Microservice REST API Backend
 * (server/applications/HRIS running on port 4001)
 */

class HrisApiRepository {
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
        throw new Error(`Tidak dapat terhubung ke Backend Service HRIS di ${this.baseUrl}. Pastikan service server/applications/HRIS sedang berjalan.`);
      }
      throw err;
    }
  }

  // ==========================================
  // Master Data API
  // ==========================================

  async listMasterDataCategories() {
    const res = await this.request('/master-data/types');
    return res.data || [];
  }

  async listMasterData(query = {}) {
    const params = new URLSearchParams();
    if (query.dataType && query.dataType !== 'ALL') params.append('dataType', query.dataType);
    if (query.search) params.append('search', query.search);
    if (query.isActive !== undefined && query.isActive !== 'ALL' && query.isActive !== '') params.append('isActive', query.isActive);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request(`/master-data${qs}`);
    return {
      rows: res.data || [],
      meta: res.meta || { total: (res.data || []).length }
    };
  }

  async getMasterDataById(id) {
    const res = await this.request(`/master-data/${id}`);
    return res.data;
  }

  async createMasterData(data) {
    const res = await this.request('/master-data', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateMasterData(id, data) {
    const res = await this.request(`/master-data/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deactivateMasterData(id) {
    const res = await this.request(`/master-data/${id}/deactivate`, {
      method: 'PATCH'
    });
    return res.data;
  }

  async activateMasterData(id) {
    const res = await this.request(`/master-data/${id}/activate`, {
      method: 'PATCH'
    });
    return res.data;
  }

  async deleteMasterData(id) {
    const res = await this.request(`/master-data/${id}`, {
      method: 'DELETE'
    });
    return res;
  }

  // ==========================================
  // Organization API
  // ==========================================

  async listOrganizations(query = {}) {
    const params = new URLSearchParams();
    if (query.type && query.type !== 'ALL') params.append('type', query.type);
    if (query.parentId !== undefined && query.parentId !== 'ALL') params.append('parentId', query.parentId);
    if (query.search) params.append('search', query.search);
    if (query.isActive !== undefined && query.isActive !== 'ALL' && query.isActive !== '') params.append('isActive', query.isActive);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request(`/organizations${qs}`);
    return {
      rows: res.data || [],
      meta: res.meta || { total: (res.data || []).length }
    };
  }

  async getOrganizationTree() {
    const res = await this.request('/organizations/tree');
    return res.data || [];
  }

  async getOrganizationById(id) {
    const res = await this.request(`/organizations/${id}`);
    return res.data;
  }

  async createOrganization(data) {
    const res = await this.request('/organizations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateOrganization(id, data) {
    const res = await this.request(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deactivateOrganization(id) {
    const res = await this.request(`/organizations/${id}/deactivate`, {
      method: 'PATCH'
    });
    return res.data;
  }

  async activateOrganization(id) {
    const res = await this.request(`/organizations/${id}/activate`, {
      method: 'PATCH'
    });
    return res.data;
  }

  async deleteOrganization(id) {
    const res = await this.request(`/organizations/${id}`, {
      method: 'DELETE'
    });
    return res;
  }

  // ==========================================
  // Job Levels API
  // ==========================================

  async listJobLevels(query = {}) {
    const params = new URLSearchParams();
    if (query.search) params.append('search', query.search);
    if (query.isActive !== undefined && query.isActive !== 'ALL' && query.isActive !== '') params.append('isActive', query.isActive);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request(`/job-levels${qs}`);
    return {
      rows: res.data || [],
      meta: res.meta || { total: (res.data || []).length }
    };
  }

  async getJobLevelById(id) {
    const res = await this.request(`/job-levels/${id}`);
    return res.data;
  }

  async createJobLevel(data) {
    const res = await this.request('/job-levels', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateJobLevel(id, data) {
    const res = await this.request(`/job-levels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deactivateJobLevel(id) {
    const res = await this.request(`/job-levels/${id}/deactivate`, {
      method: 'PATCH'
    });
    return res.data;
  }

  async activateJobLevel(id) {
    const res = await this.request(`/job-levels/${id}/activate`, {
      method: 'PATCH'
    });
    return res.data;
  }

  async deleteJobLevel(id) {
    const res = await this.request(`/job-levels/${id}`, {
      method: 'DELETE'
    });
    return res;
  }

  // ==========================================
  // Job Positions (Jabatan) API
  // ==========================================

  async listPositions(query = {}) {
    const params = new URLSearchParams();
    if (query.organizationId && query.organizationId !== 'ALL') params.append('organizationId', query.organizationId);
    if (query.jobLevelId && query.jobLevelId !== 'ALL') params.append('jobLevelId', query.jobLevelId);
    if (query.department && query.department !== 'ALL') params.append('department', query.department);
    if (query.search) params.append('search', query.search);
    if (query.isActive !== undefined && query.isActive !== 'ALL' && query.isActive !== '') params.append('isActive', query.isActive);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request(`/positions${qs}`);
    return {
      rows: res.data || [],
      meta: res.meta || { total: (res.data || []).length }
    };
  }

  async getPositionById(id) {
    const res = await this.request(`/positions/${id}`);
    return res.data;
  }

  async createPosition(data) {
    const res = await this.request('/positions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updatePosition(id, data) {
    const res = await this.request(`/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deactivatePosition(id) {
    const res = await this.request(`/positions/${id}/deactivate`, {
      method: 'PATCH'
    });
    return res.data;
  }

  async activatePosition(id) {
    const res = await this.request(`/positions/${id}/activate`, {
      method: 'PATCH'
    });
    return res.data;
  }

  async deletePosition(id) {
    const res = await this.request(`/positions/${id}`, {
      method: 'DELETE'
    });
    return res;
  }

  // ==========================================
  // Employees API
  // ==========================================

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
    const res = await this.request(`/employees/${id}${force ? '?force=true' : ''}`, {
      method: 'DELETE'
    });
    return res;
  }

  // ==========================================
  // Sub-records (Documents, Education, etc.)
  // ==========================================

  async listDocuments(employeeId) {
    const res = await this.request(`/employees/${employeeId}/documents`);
    return res.data || [];
  }

  async createDocument(employeeId, data) {
    const res = await this.request(`/employees/${employeeId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async addDocument(employeeId, data) {
    return this.createDocument(employeeId, data);
  }

  async updateDocument(id, data) {
    const res = await this.request(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async uploadDocument(employeeId, formData) {
    const url = `${this.baseUrl}/employees/${employeeId}/documents`;
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

  async deleteDocument(id) {
    return this.request(`/documents/${id}`, { method: 'DELETE' });
  }

  async listWorkExperiences(employeeId) {
    const res = await this.request(`/employees/${employeeId}/work-experiences`);
    return res.data || [];
  }

  async createWorkExperience(employeeId, data) {
    const res = await this.request(`/employees/${employeeId}/work-experiences`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async addWorkExperience(employeeId, data) {
    return this.createWorkExperience(employeeId, data);
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

  async listEducation(employeeId) {
    const res = await this.request(`/employees/${employeeId}/education`);
    return res.data || [];
  }

  async createEducation(employeeId, data) {
    const res = await this.request(`/employees/${employeeId}/education`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async addEducation(employeeId, data) {
    return this.createEducation(employeeId, data);
  }

  async addEducationHistory(employeeId, data) {
    return this.createEducation(employeeId, data);
  }

  async createEducationHistory(employeeId, data) {
    return this.createEducation(employeeId, data);
  }

  async updateEducation(id, data) {
    const res = await this.request(`/education/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateEducationHistory(id, data) {
    return this.updateEducation(id, data);
  }

  async deleteEducation(id) {
    return this.request(`/education/${id}`, { method: 'DELETE' });
  }

  async deleteEducationHistory(id) {
    return this.deleteEducation(id);
  }

  async listCareerHistory(employeeId) {
    const res = await this.request(`/employees/${employeeId}/career-history`);
    return res.data || [];
  }

  async createCareerHistory(employeeId, data) {
    const res = await this.request(`/employees/${employeeId}/career-history`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async addCareerHistory(employeeId, data) {
    return this.createCareerHistory(employeeId, data);
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

  async listFamily(employeeId) {
    const res = await this.request(`/employees/${employeeId}/family`);
    return res.data || [];
  }

  async createFamily(employeeId, data) {
    const res = await this.request(`/employees/${employeeId}/family`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async addFamily(employeeId, data) {
    return this.createFamily(employeeId, data);
  }

  async addFamilyMember(employeeId, data) {
    return this.createFamily(employeeId, data);
  }

  async createFamilyMember(employeeId, data) {
    return this.createFamily(employeeId, data);
  }

  async updateFamily(id, data) {
    const res = await this.request(`/family/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateFamilyMember(id, data) {
    return this.updateFamily(id, data);
  }

  async deleteFamily(id) {
    return this.request(`/family/${id}`, { method: 'DELETE' });
  }

  async deleteFamilyMember(id) {
    return this.deleteFamily(id);
  }
}

module.exports = HrisApiRepository;
