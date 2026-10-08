const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseFrame = require('../../../../system/controls/WiseFrame');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

const WinJobVacancyEdit = require('./WinJobVacancyEdit');
const RecruitmentApiRepository = require('../services/RecruitmentApiRepository');
const api = new RecruitmentApiRepository();

class WinJobVacancyList extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('Job Vacancy Posting — Wise Recruitment');
    this.appIcon = options.appIcon || '💼';
    this.width = options.width || '92%';
    this.height = options.height || '86%';
    this.centered = true;

    this.selectedVacancy = null;
    this.cachedVacancies = [];
    this._currentFilters = {};
  }

  onWindowInit() {
    this.controls = [];

    // 1. Action Toolbar Buttons
    const actionToolbar = new WiseFrame('', {
      id: 'frameVacancyActions',
      style: {
        display: 'flex',
        gap: '8px',
        marginBottom: '10px'
      }
    });

    actionToolbar.addControl(new WiseButton(WiseI18n.t('➕ Tambah Lowongan'), {
      id: 'btnVacAdd',
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('✏️ Edit Lowongan'), {
      id: 'btnVacEdit',
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('👥 Lihat Pelamar'), {
      id: 'btnVacViewApplicants',
      onClick: this.onViewApplicantsClick.bind(this),
      style: {
        background: 'color-mix(in srgb, var(--accent) 20%, #475569)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    actionToolbar.addControl(new WiseButton(WiseI18n.t('🗑️ Hapus Lowongan'), {
      id: 'btnVacDelete',
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('🔄 Segarkan'), {
      id: 'btnVacRefresh',
      onClick: () => this.loadVacanciesTable(1, this.dtVacancies ? this.dtVacancies.pageSize : 10),
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

    // 2. Data Table for Vacancies
    this.dtVacancies = new WiseDataTable({
      id: 'dtVacancies',
      pageSize: 10,
      currentPage: 1,
      multiSelect: false,
      style: { width: '100%' },
      onDataFilterChanged: (pageSize, pageNum) => this.loadVacanciesTable(pageNum, pageSize),
      onRowSelect: this.onRowSelect.bind(this),
      onClick: this.onRowClick.bind(this)
    });

    this.dtVacancies.columns = [
      { key: 'code', title: WiseI18n.t('Kode'), width: '110px' },
      { key: 'title', title: WiseI18n.t('Judul Lowongan'), width: '260px' },
      { key: 'department', title: WiseI18n.t('Departemen'), width: '180px' },
      { key: 'division', title: WiseI18n.t('Divisi'), width: '160px' },
      { key: 'position', title: WiseI18n.t('Posisi Jabatan'), width: '180px' },
      { key: 'workLocation', title: WiseI18n.t('Lokasi Kerja'), width: '120px' },
      { key: 'activePeriod', title: WiseI18n.t('Periode Aktif'), width: '190px' },
      { key: 'applicantCountBadge', title: WiseI18n.t('Pelamar'), width: '90px' },
      { key: 'statusBadge', title: WiseI18n.t('Status'), width: '110px' }
    ];

    this.dtVacancies.filterControls = [
      {
        id: 'search',
        type: 'text',
        label: WiseI18n.t('Pencarian'),
        placeholder: WiseI18n.t('Cari judul, divisi, posisi...'),
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'status',
        type: 'select',
        label: WiseI18n.t('Status Lowongan'),
        items: [
          { value: '', label: WiseI18n.t('Semua Status') },
          { value: 'ACTIVE', label: '🟢 ACTIVE' },
          { value: 'DRAFT', label: '🟡 DRAFT' },
          { value: 'CLOSED', label: '🔴 CLOSED' }
        ],
        onChange: this.onTableFilterInputChanged.bind(this)
      }
    ];

    this.dtVacancies.contextMenuItems = [
      { id: 'edit', label: WiseI18n.t('Edit Lowongan'), icon: '✏️', onClick: this.onEditClick.bind(this) },
      { id: 'viewApplicants', label: WiseI18n.t('Lihat Daftar Pelamar'), icon: '👥', onClick: this.onViewApplicantsClick.bind(this) },
      { id: 'delete', label: WiseI18n.t('Hapus Lowongan'), icon: '🗑️', onClick: this.onDeleteClick.bind(this) }
    ];

    this.addControl(this.dtVacancies);

    // 3. Status Bar Label
    this.lblStatus = new WiseLabel(WiseI18n.t('Memuat data lowongan...'), {
      id: 'lblVacancyStatus',
      style: { color: '#64748b', display: 'block', marginTop: '8px' }
    });
    this.addControl(this.lblStatus);

    return this;
  }

  async loadInitialData() {
    await this.loadVacanciesTable(1, 10);
  }

  async loadVacanciesTable(page = 1, limit = 10) {
    try {
      if (this.lblStatus) this.lblStatus.setText('Memuat data lowongan...');
      const filters = { page, limit, ...this._currentFilters };
      const res = await api.listVacancies(filters);

      const rows = res.rows || [];
      this.cachedVacancies = rows;

      const formattedData = rows.map((v) => {
        const periodStr = `${v.startDate || '-'} s/d ${v.endDate || 'Selesai'}`;
        let statusBadge = '🟢 Aktif';
        if (v.status === 'DRAFT') statusBadge = '🟡 Draft';
        else if (v.status === 'CLOSED') statusBadge = '🔴 Ditutup';

        return {
          id: v.id,
          code: v.code || `VAC-${v.id}`,
          title: v.title || '-',
          department: v.department || '-',
          division: v.division || '-',
          position: v.position || '-',
          workLocation: v.workLocation || '-',
          activePeriod: periodStr,
          applicantCountBadge: `👥 ${v.applicantCount || 0}`,
          statusBadge,
          _raw: v
        };
      });

      this.dtVacancies.data = formattedData;
      this.dtVacancies.totalCount = res.total || rows.length;
      this.dtVacancies.currentPage = page;
      this.dtVacancies.pageSize = limit;

      if (this.lblStatus) {
        this.lblStatus.setText(`Menampilkan ${rows.length} dari total ${res.total || rows.length} lowongan pekerjaan.`);
      }
    } catch (err) {
      if (this.lblStatus) this.lblStatus.setText(`Gagal memuat lowongan: ${err.message}`);
      this.showInfo('Error', err.message, 'error');
    }
  }

  onTableFilterInputChanged() {
    const filters = {};
    if (this.dtVacancies && this.dtVacancies.filterControls) {
      this.dtVacancies.filterControls.forEach((f) => {
        if (f.value !== undefined && f.value !== null && f.value !== '') {
          filters[f.id] = f.value;
        }
      });
    }
    this._currentFilters = filters;
    this.loadVacanciesTable(1, this.dtVacancies.pageSize);
  }

  onRowSelect() {
    const idx = this.dtVacancies.selectedRowIndex;
    if (idx !== null && idx >= 0 && this.cachedVacancies[idx]) {
      this.selectedVacancy = this.cachedVacancies[idx];
    } else {
      this.selectedVacancy = null;
    }
  }

  onRowClick() {
    this.onRowSelect();
  }

  async onAddClick() {
    await this.openWindow(WinJobVacancyEdit, {
      vacancyId: null,
      onSaved: () => this.loadVacanciesTable(this.dtVacancies.currentPage, this.dtVacancies.pageSize)
    });
  }

  async onEditClick() {
    if (!this.selectedVacancy) {
      this.showInfo(WiseI18n.t('Pemberitahuan'), WiseI18n.t('Pilih salah satu baris lowongan terlebih dahulu.'), 'warning');
      return;
    }
    await this.openWindow(WinJobVacancyEdit, {
      vacancyId: this.selectedVacancy.id,
      onSaved: () => this.loadVacanciesTable(this.dtVacancies.currentPage, this.dtVacancies.pageSize)
    });
  }

  async onViewApplicantsClick() {
    if (!this.selectedVacancy) {
      this.showInfo(WiseI18n.t('Pemberitahuan'), WiseI18n.t('Pilih salah satu baris lowongan terlebih dahulu.'), 'warning');
      return;
    }
    const WinApplicantList = require('./WinApplicantList');
    await this.openWindow(WinApplicantList, {
      defaultVacancyId: this.selectedVacancy.id,
      defaultVacancyTitle: this.selectedVacancy.title
    });
  }

  async onDeleteClick() {
    if (!this.selectedVacancy) {
      this.showInfo(WiseI18n.t('Pemberitahuan'), WiseI18n.t('Pilih salah satu baris lowongan yang ingin dihapus.'), 'warning');
      return;
    }

    const conf = await this.confirm(
      WiseI18n.t('Konfirmasi Hapus'),
      `${WiseI18n.t('Apakah Anda yakin ingin menghapus lowongan')} "${this.selectedVacancy.title}"? ${WiseI18n.t('Tindakan ini tidak dapat dibatalkan.')}`
    );
    if (!conf) return;

    try {
      await api.deleteVacancy(this.selectedVacancy.id);
      this.showInfo(WiseI18n.t('Sukses'), WiseI18n.t('Lowongan pekerjaan berhasil dihapus.'), 'success');
      this.selectedVacancy = null;
      await this.loadVacanciesTable(1, this.dtVacancies.pageSize);
    } catch (err) {
      this.showInfo(WiseI18n.t('Gagal Menghapus'), err.message, 'error');
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinJobVacancyList;
