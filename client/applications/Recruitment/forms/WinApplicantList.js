const WiseWindow = require('../../../system/WiseWindow');
const WiseLabel = require('../../../system/controls/WiseLabel');
const WiseButton = require('../../../system/controls/WiseButton');
const WiseFrame = require('../../../system/controls/WiseFrame');
const WiseDataTable = require('../../../system/controls/WiseDataTable');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../system/WiseI18n');

const WinApplicantEdit = require('./WinApplicantEdit');
const WinApplicantDetail = require('./WinApplicantDetail');
const RecruitmentApiRepository = require('../services/RecruitmentApiRepository');
const api = new RecruitmentApiRepository();

class WinApplicantList extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = 'Applicant Management — Wise Recruitment';
    this.appIcon = options.appIcon || '👥';
    this.width = options.width || '92%';
    this.height = options.height || '86%';
    this.centered = true;

    this.defaultVacancyId = options.defaultVacancyId || null;
    this.defaultVacancyTitle = options.defaultVacancyTitle || null;

    this.selectedApplicant = null;
    this.cachedApplicants = [];
    this.vacanciesList = [];
    this._currentFilters = {};
  }

  t(key) {
    if (typeof WiseI18n !== 'undefined' && WiseI18n && typeof WiseI18n.t === 'function') {
      return WiseI18n.t(key);
    }
    return key;
  }

  onWindowInit() {
    this.controls = [];

    // 1. Action Toolbar
    const actionToolbar = new WiseFrame('', {
      id: 'frameApplicantActions',
      style: { display: 'flex', gap: '8px', marginBottom: '10px' }
    });

    actionToolbar.addControl(new WiseButton(this.t('➕ Tambah Pelamar'), {
      id: 'btnAppAdd',
      onClick: this.onAddClick.bind(this),
      style: {
        background: 'var(--accent)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    actionToolbar.addControl(new WiseButton(this.t('✏️ Edit Pelamar'), {
      id: 'btnAppEdit',
      onClick: this.onEditClick.bind(this),
      style: {
        background: 'var(--accent-dark)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    actionToolbar.addControl(new WiseButton(this.t('🔍 Detail & Proses Seleksi'), {
      id: 'btnAppViewDetail',
      onClick: this.onViewDetailClick.bind(this),
      style: {
        background: 'color-mix(in srgb, var(--accent) 20%, #334155)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    actionToolbar.addControl(new WiseButton(this.t('🗑️ Hapus Pelamar'), {
      id: 'btnAppDelete',
      onClick: this.onDeleteClick.bind(this),
      style: {
        background: '#ef4444',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    actionToolbar.addControl(new WiseButton(this.t('🔄 Segarkan'), {
      id: 'btnAppRefresh',
      onClick: () => this.loadTable(1, this.dtApplicants ? this.dtApplicants.pageSize : 10),
      style: {
        background: 'color-mix(in srgb, var(--accent) 15%, white)',
        color: 'var(--accent-dark)',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    this.addControl(actionToolbar);

    // 2. Data Table for Applicants
    this.dtApplicants = new WiseDataTable({
      id: 'dtApplicants',
      pageSize: 10,
      currentPage: 1,
      multiSelect: false,
      style: { width: '100%' },
      onDataFilterChanged: (pageSize, pageNum) => this.loadTable(pageNum, pageSize),
      onRowSelect: this.onRowSelect.bind(this),
      onClick: this.onRowClick.bind(this)
    });

    this.dtApplicants.columns = [
      { key: 'applicantNumber', title: 'No. Pelamar', width: '120px' },
      { key: 'fullName', title: 'Nama Lengkap Pelamar', width: '220px' },
      { key: 'vacancyTitle', title: 'Lowongan Target', width: '240px' },
      { key: 'department', title: 'Departemen', width: '180px' },
      { key: 'contact', title: 'Kontak', width: '200px' },
      { key: 'lastEducation', title: 'Pendidikan', width: '110px' },
      { key: 'appliedDate', title: 'Tgl Lamar', width: '110px' },
      { key: 'processesSummary', title: 'Progres Tahapan Seleksi', width: '240px' },
      { key: 'statusBadge', title: 'Status', width: '130px' }
    ];

    this.dtApplicants.filterControls = [
      {
        id: 'search',
        type: 'text',
        label: 'Pencarian',
        placeholder: 'Cari nama, email, nomor...',
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'status',
        type: 'select',
        label: 'Status Pelamar',
        items: [
          { value: '', label: 'Semua Status' },
          { value: 'APPLIED', label: '🟡 APPLIED' },
          { value: 'IN_PROCESS', label: '🔵 IN_PROCESS' },
          { value: 'OFFERED', label: '🟣 OFFERED' },
          { value: 'HIRED', label: '🟢 HIRED' },
          { value: 'REJECTED', label: '🔴 REJECTED' }
        ],
        onChange: this.onTableFilterInputChanged.bind(this)
      }
    ];

    this.dtApplicants.contextMenuItems = [
      { id: 'viewDetail', label: 'Detail & Proses Seleksi', icon: '🔍', onClick: this.onViewDetailClick.bind(this) },
      { id: 'edit', label: 'Edit Pelamar', icon: '✏️', onClick: this.onEditClick.bind(this) },
      { id: 'delete', label: 'Hapus Pelamar', icon: '🗑️', onClick: this.onDeleteClick.bind(this) }
    ];

    this.addControl(this.dtApplicants);

    // 3. Status Bar
    this.lblStatus = new WiseLabel('Memuat data pelamar...', {
      id: 'lblApplicantStatus',
      style: { color: '#64748b', display: 'block', marginTop: '8px' }
    });
    this.addControl(this.lblStatus);

    return this;
  }

  async loadInitialData() {
    try {
      const vacRes = await api.listVacancies({ limit: 100, status: 'ALL' });
      this.vacanciesList = vacRes.rows || [];

      // Add vacancy filter to filterControls if available
      const vacFilter = {
        id: 'jobVacancyId',
        type: 'select',
        label: 'Filter Lowongan',
        items: [
          { value: '', label: 'Semua Lowongan' },
          ...this.vacanciesList.map((v) => ({ value: String(v.id), label: v.title }))
        ],
        onChange: this.onTableFilterInputChanged.bind(this)
      };

      if (this.defaultVacancyId) {
        vacFilter.value = String(this.defaultVacancyId);
        this._currentFilters.jobVacancyId = String(this.defaultVacancyId);
      }

      const existingFilters = this.dtApplicants.filterControls || [];
      if (!existingFilters.some((f) => f.id === 'jobVacancyId')) {
        this.dtApplicants.filterControls = [existingFilters[0], vacFilter, existingFilters[1]];
      }

      await this.loadTable(1, 10);
    } catch (err) {
      console.warn('Failed to load initial vacancies for applicants filter:', err.message);
      await this.loadTable(1, 10);
    }
  }

  async loadTable(page = 1, limit = 10) {
    try {
      if (this.lblStatus) this.lblStatus.setText('Memuat data pelamar...');
      const filters = { page, limit, ...this._currentFilters };
      const res = await api.listApplicants(filters);

      const rows = res.rows || [];
      this.cachedApplicants = rows;

      this.dtApplicants.data = rows.map((app) => {
        let stBadge = app.status;
        if (stBadge === 'APPLIED') stBadge = '🟡 Melamar';
        else if (stBadge === 'IN_PROCESS') stBadge = '🔵 Proses';
        else if (stBadge === 'OFFERED') stBadge = '🟣 Ditawarkan';
        else if (stBadge === 'HIRED') stBadge = '🟢 Diterima';
        else if (stBadge === 'REJECTED') stBadge = '🔴 Ditolak';
        else if (stBadge === 'WITHDRAWN') stBadge = '⚪ Mengundurkan';

        const processes = Array.isArray(app.processes) ? app.processes : [];
        const doneCount = processes.filter((p) => p.status === 'Done').length;
        const currentActive = processes.find((p) => p.status === 'Ongoing');
        let procSummary = `${doneCount}/${processes.length} Tahapan Selesai`;
        if (currentActive) {
          procSummary += ` (Aktif: ${currentActive.stageName})`;
        }

        return {
          id: app.id,
          applicantNumber: app.applicantNumber || `APP-${app.id}`,
          fullName: app.fullName || '-',
          vacancyTitle: app.vacancy ? app.vacancy.title : '-',
          department: app.vacancy ? app.vacancy.department : '-',
          contact: `${app.email || '-'} / ${app.phone || '-'}`,
          lastEducation: `${app.lastEducation || '-'} ${app.major ? `(${app.major})` : ''}`,
          appliedDate: app.appliedDate || '-',
          processesSummary: procSummary,
          statusBadge: stBadge,
          _raw: app
        };
      });

      this.dtApplicants.totalCount = res.total || rows.length;
      this.dtApplicants.currentPage = page;
      this.dtApplicants.pageSize = limit;

      if (this.lblStatus) {
        this.lblStatus.setText(`Menampilkan ${rows.length} dari total ${res.total || rows.length} pelamar.`);
      }
    } catch (err) {
      if (this.lblStatus) this.lblStatus.setText(`Gagal memuat pelamar: ${err.message}`);
      this.showInfo('Error', err.message, 'error');
    }
  }

  onTableFilterInputChanged() {
    const filters = {};
    if (this.dtApplicants && this.dtApplicants.filterControls) {
      this.dtApplicants.filterControls.forEach((f) => {
        if (f.value !== undefined && f.value !== null && f.value !== '') {
          filters[f.id] = f.value;
        }
      });
    }
    this._currentFilters = filters;
    this.loadTable(1, this.dtApplicants.pageSize);
  }

  onRowSelect() {
    const idx = this.dtApplicants.selectedRowIndex;
    if (idx !== null && idx >= 0 && this.cachedApplicants[idx]) {
      this.selectedApplicant = this.cachedApplicants[idx];
    } else {
      this.selectedApplicant = null;
    }
  }

  onRowClick() {
    this.onRowSelect();
  }

  async onAddClick() {
    await this.openWindow(WinApplicantEdit, {
      applicantId: null,
      defaultVacancyId: this.defaultVacancyId || (this._currentFilters.jobVacancyId || null),
      onSaved: () => this.loadTable(this.dtApplicants.currentPage, this.dtApplicants.pageSize)
    });
  }

  async onEditClick() {
    if (!this.selectedApplicant) {
      this.showInfo('Pemberitahuan', 'Pilih salah satu baris pelamar terlebih dahulu.', 'warning');
      return;
    }

    await this.openWindow(WinApplicantEdit, {
      applicantId: this.selectedApplicant.id,
      onSaved: () => this.loadTable(this.dtApplicants.currentPage, this.dtApplicants.pageSize)
    });
  }

  async onViewDetailClick() {
    if (!this.selectedApplicant) {
      this.showInfo('Pemberitahuan', 'Pilih salah satu baris pelamar terlebih dahulu.', 'warning');
      return;
    }

    await this.openWindow(WinApplicantDetail, {
      applicantId: this.selectedApplicant.id
    });
  }

  async onDeleteClick() {
    if (!this.selectedApplicant) {
      this.showInfo('Pemberitahuan', 'Pilih salah satu baris pelamar yang ingin dihapus.', 'warning');
      return;
    }

    const conf = await this.confirm(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus data pelamar "${this.selectedApplicant.fullName}" beserta seluruh riwayat proses seleksinya?`
    );
    if (!conf) return;

    try {
      await api.deleteApplicant(this.selectedApplicant.id);
      this.showInfo('Sukses', 'Data pelamar berhasil dihapus.', 'success');
      this.selectedApplicant = null;
      await this.loadTable(1, this.dtApplicants.pageSize);
    } catch (err) {
      this.showInfo('Gagal Menghapus', err.message, 'error');
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinApplicantList;
