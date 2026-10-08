const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseFrame = require('../../../../system/controls/WiseFrame');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

const WinApplicantEdit = require('./WinApplicantEdit');
const WinApplicantDetail = require('./WinApplicantDetail');
const RecruitmentApiRepository = require('../services/RecruitmentApiRepository');
const api = new RecruitmentApiRepository();

class WinApplicantList extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('APPLICANT_MANAGEMENT_WISE_RECRUITMENT');
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

  onWindowInit() {
    this.controls = [];

    // 1. Action Toolbar
    const actionToolbar = new WiseFrame('', {
      id: 'frameApplicantActions',
      style: { display: 'flex', gap: '8px', marginBottom: '10px' }
    });

    actionToolbar.addControl(new WiseButton(WiseI18n.t('TAMBAH_PELAMAR_2'), {
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('EDIT_PELAMAR'), {
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('DETAIL_PROSES_SELEKSI'), {
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('HAPUS_PELAMAR_2'), {
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('SEGARKAN_3'), {
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
      { key: 'applicantNumber', title: WiseI18n.t('NO_PELAMAR'), width: '120px' },
      { key: 'fullName', title: WiseI18n.t('NAMA_LENGKAP_PELAMAR_2'), width: '220px' },
      { key: 'vacancyTitle', title: WiseI18n.t('LOWONGAN_TARGET'), width: '240px' },
      { key: 'department', title: WiseI18n.t('DEPARTEMEN'), width: '180px' },
      { key: 'contact', title: WiseI18n.t('KONTAK'), width: '200px' },
      { key: 'lastEducation', title: WiseI18n.t('PENDIDIKAN'), width: '110px' },
      { key: 'appliedDate', title: WiseI18n.t('TGL_LAMAR'), width: '110px' },
      { key: 'processesSummary', title: WiseI18n.t('PROGRES_TAHAPAN_SELEKSI'), width: '240px' },
      { key: 'statusBadge', title: WiseI18n.t('STATUS'), width: '130px' }
    ];

    this.dtApplicants.filterControls = [
      {
        id: 'search',
        type: 'text',
        label: WiseI18n.t('PENCARIAN'),
        placeholder: WiseI18n.t('CARI_NAMA_EMAIL_NOMOR'),
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'status',
        type: 'select',
        label: WiseI18n.t('STATUS_PELAMAR'),
        items: [
          { value: '', label: WiseI18n.t('SEMUA_STATUS') },
          { value: 'APPLIED', label: WiseI18n.t('MELAMAR') },
          { value: 'IN_PROCESS', label: WiseI18n.t('PROSES') },
          { value: 'OFFERED', label: WiseI18n.t('DITAWARKAN') },
          { value: 'HIRED', label: WiseI18n.t('DITERIMA') },
          { value: 'REJECTED', label: WiseI18n.t('DITOLAK') }
        ],
        onChange: this.onTableFilterInputChanged.bind(this)
      }
    ];

    this.dtApplicants.contextMenuItems = [
      { id: 'viewDetail', label: WiseI18n.t('DETAIL_PROSES_SELEKSI_2'), icon: '🔍', onClick: this.onViewDetailClick.bind(this) },
      { id: 'edit', label: WiseI18n.t('EDIT_PELAMAR_2'), icon: '✏️', onClick: this.onEditClick.bind(this) },
      { id: 'delete', label: WiseI18n.t('HAPUS_PELAMAR'), icon: '🗑️', onClick: this.onDeleteClick.bind(this) }
    ];

    this.addControl(this.dtApplicants);

    // 3. Status Bar
    this.lblStatus = new WiseLabel(WiseI18n.t('MEMUAT_DATA_PELAMAR'), {
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
        label: WiseI18n.t('FILTER_LOWONGAN'),
        items: [
          { value: '', label: WiseI18n.t('SEMUA_LOWONGAN') },
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
      if (this.lblStatus) this.lblStatus.setText(WiseI18n.t('MEMUAT_DATA_PELAMAR'));
      const filters = { page, limit, ...this._currentFilters };
      const res = await api.listApplicants(filters);

      const rows = res.rows || [];
      this.cachedApplicants = rows;

      this.dtApplicants.data = rows.map((app) => {
        let stBadge = app.status;
        if (stBadge === 'APPLIED') stBadge = WiseI18n.t('MELAMAR');
        else if (stBadge === 'IN_PROCESS') stBadge = WiseI18n.t('PROSES');
        else if (stBadge === 'OFFERED') stBadge = WiseI18n.t('DITAWARKAN');
        else if (stBadge === 'HIRED') stBadge = WiseI18n.t('DITERIMA');
        else if (stBadge === 'REJECTED') stBadge = WiseI18n.t('DITOLAK');
        else if (stBadge === 'WITHDRAWN') stBadge = WiseI18n.t('MENGUNDURKAN');

        const processes = Array.isArray(app.processes) ? app.processes : [];
        const doneCount = processes.filter((p) => p.status === 'Done').length;
        const currentActive = processes.find((p) => p.status === 'Ongoing');
        let procSummary = `${doneCount}/${processes.length} ${WiseI18n.t('TAHAPAN_SELESAI')}`;
        if (currentActive) {
          procSummary += ` (${WiseI18n.t('AKTIF_2')}: ${currentActive.stageName})`;
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
        this.lblStatus.setText(`${WiseI18n.t('MENAMPILKAN')} ${rows.length} ${WiseI18n.t('DARI_TOTAL')} ${res.total || rows.length} ${WiseI18n.t('PELAMAR_2')}`);
      }
    } catch (err) {
      if (this.lblStatus) this.lblStatus.setText(`${WiseI18n.t('GAGAL_MEMUAT_PELAMAR')}: ${err.message}`);
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
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
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_BARIS_PELAMAR_TERLEBIH_DAHULU'), 'warning');
      return;
    }

    await this.openWindow(WinApplicantEdit, {
      applicantId: this.selectedApplicant.id,
      onSaved: () => this.loadTable(this.dtApplicants.currentPage, this.dtApplicants.pageSize)
    });
  }

  async onViewDetailClick() {
    if (!this.selectedApplicant) {
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_BARIS_PELAMAR_TERLEBIH_DAHULU'), 'warning');
      return;
    }

    await this.openWindow(WinApplicantDetail, {
      applicantId: this.selectedApplicant.id
    });
  }

  async onDeleteClick() {
    if (!this.selectedApplicant) {
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_BARIS_PELAMAR_YANG_INGIN_DIHAPUS'), 'warning');
      return;
    }

    const conf = await this.confirm(
      WiseI18n.t('KONFIRMASI_HAPUS'),
      `${WiseI18n.t('APAKAH_ANDA_YAKIN_INGIN_MENGHAPUS_DATA_PELAMAR')} "${this.selectedApplicant.fullName}" ${WiseI18n.t('BESERTA_SELURUH_RIWAYAT_PROSES_SELEKSINYA')}`
    );
    if (!conf) return;

    try {
      await api.deleteApplicant(this.selectedApplicant.id);
      this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('DATA_PELAMAR_BERHASIL_DIHAPUS'), 'success');
      this.selectedApplicant = null;
      await this.loadTable(1, this.dtApplicants.pageSize);
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENGHAPUS'), err.message, 'error');
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinApplicantList;
