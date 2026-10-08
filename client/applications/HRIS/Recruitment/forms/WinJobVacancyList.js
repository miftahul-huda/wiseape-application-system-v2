const fs = require('fs');
const path = require('path');

const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseIconMenu = require('../../../../system/controls/WiseIconMenu');
const WiseIconMenuGroup = require('../../../../system/controls/WiseIconMenuGroup');
const WiseVerticalSeparator = require('../../../../system/controls/WiseVerticalSeparator');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

const WinJobVacancyEdit = require('./WinJobVacancyEdit');
const RecruitmentApiRepository = require('../services/RecruitmentApiRepository');
const api = new RecruitmentApiRepository();

// Toolbar icons -- same asset files (and loading convention) as
// WinEmployeeManagement.js: read once at module load and inlined as markup,
// since WiseIconMenu renders an `icon` starting with "<svg" directly rather
// than fetching it as an <img> src.
const ICONS_DIR = path.join(__dirname, '..', 'assets', 'icons');
const loadIcon = (fileName) => {
  const raw = fs.readFileSync(path.join(ICONS_DIR, fileName), 'utf8');
  return raw
    .replace(/<\?xml[^?]*\?>/gi, '')   // strip <?xml ... ?>
    .replace(/<!--[\s\S]*?-->/g, '')    // strip <!-- ... --> comments
    .trim();
};
const MENU_ICONS = {
  displayAll: loadIcon('display-all.svg'),
  detail: loadIcon('detail.svg'),
  add: loadIcon('add.svg'),
  edit: loadIcon('edit.svg'),
  find: loadIcon('find.svg')
};

class WinJobVacancyList extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('POSTING_LOWONGAN_KERJA_WISE_RECRUITMENT');
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

    // 1. Icon Menu Group Toolbar -- same look/asset-loading pattern as
    // WinEmployeeManagement.js's toolbar.
    const iconMenuGroup = new WiseIconMenuGroup('', [
      new WiseIconMenu(WiseI18n.t('TAMPILKAN_SEMUA'), {
        id: 'btnMenuDisplayAll',
        icon: MENU_ICONS.displayAll,
        description: WiseI18n.t('TAMPILKAN_SEMUA'),
        onClick: this.onDisplayAllClick.bind(this)
      }),
      new WiseVerticalSeparator({ height: 26 }),
      new WiseIconMenu(WiseI18n.t('LIHAT_PELAMAR'), {
        id: 'btnMenuViewApplicants',
        icon: MENU_ICONS.detail,
        description: WiseI18n.t('LIHAT_PELAMAR'),
        onClick: this.onViewApplicantsClick.bind(this)
      }),
      new WiseIconMenu(WiseI18n.t('TAMBAH_LOWONGAN_2'), {
        id: 'btnMenuAdd',
        icon: MENU_ICONS.add,
        description: WiseI18n.t('TAMBAH_LOWONGAN_2'),
        onClick: this.onAddClick.bind(this)
      }),
      new WiseIconMenu(WiseI18n.t('EDIT_LOWONGAN_2'), {
        id: 'btnMenuEdit',
        icon: MENU_ICONS.edit,
        description: WiseI18n.t('EDIT_LOWONGAN_2'),
        onClick: this.onEditClick.bind(this)
      }),
      new WiseVerticalSeparator({ height: 26 }),
      new WiseIconMenu(WiseI18n.t('SEGARKAN_3'), {
        id: 'btnMenuRefresh',
        icon: MENU_ICONS.find,
        description: WiseI18n.t('SEGARKAN_3'),
        onClick: this.onRefreshMenuClick.bind(this)
      })
    ], {
      id: 'groupIconMenu',
      layout: 'horizontal',
      style: {
        marginBottom: '10px',
        position: 'relative',
        zIndex: 40,
        backgroundColor: 'transparent',
        backdropFilter: 'none',
        border: 'none',
        boxShadow: 'none'
      }
    });

    this.addControl(iconMenuGroup);

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
      { key: 'code', title: WiseI18n.t('KODE'), width: '110px' },
      { key: 'title', title: WiseI18n.t('JUDUL_LOWONGAN'), width: '260px' },
      { key: 'department', title: WiseI18n.t('DEPARTEMEN'), width: '180px' },
      { key: 'division', title: WiseI18n.t('DIVISI'), width: '160px' },
      { key: 'position', title: WiseI18n.t('POSISI_JABATAN_2'), width: '180px' },
      { key: 'workLocation', title: WiseI18n.t('LOKASI_KERJA'), width: '120px' },
      { key: 'activePeriod', title: WiseI18n.t('PERIODE_AKTIF'), width: '190px' },
      { key: 'applicantCountBadge', title: WiseI18n.t('PELAMAR'), width: '90px' },
      { key: 'statusBadge', title: WiseI18n.t('STATUS'), width: '110px' }
    ];

    this.dtVacancies.filterControls = [
      {
        id: 'search',
        type: 'text',
        label: WiseI18n.t('PENCARIAN'),
        placeholder: WiseI18n.t('CARI_JUDUL_DIVISI_POSISI'),
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'status',
        type: 'select',
        label: WiseI18n.t('STATUS_LOWONGAN'),
        items: [
          { value: '', label: WiseI18n.t('SEMUA_STATUS') },
          { value: 'ACTIVE', label: '🟢 ACTIVE' },
          { value: 'DRAFT', label: '🟡 DRAFT' },
          { value: 'CLOSED', label: '🔴 CLOSED' }
        ],
        onChange: this.onTableFilterInputChanged.bind(this)
      }
    ];

    this.dtVacancies.contextMenuItems = [
      { id: 'edit', label: WiseI18n.t('EDIT_LOWONGAN'), icon: '✏️', onClick: this.onEditClick.bind(this) },
      { id: 'viewApplicants', label: WiseI18n.t('LIHAT_DAFTAR_PELAMAR'), icon: '👥', onClick: this.onViewApplicantsClick.bind(this) },
      { id: 'delete', label: WiseI18n.t('HAPUS_LOWONGAN'), icon: '🗑️', onClick: this.onDeleteClick.bind(this) }
    ];

    this.addControl(this.dtVacancies);

    // 3. Status Bar Label
    this.lblStatus = new WiseLabel(WiseI18n.t('MEMUAT_DATA_LOWONGAN'), {
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

  async onDisplayAllClick() {
    this._currentFilters = {};
    if (this.dtVacancies) {
      this.dtVacancies.clearFilterValues();
    }
    await this.loadVacanciesTable(1, this.dtVacancies ? this.dtVacancies.pageSize : 10);
  }

  async onRefreshMenuClick() {
    await this.loadVacanciesTable(1, this.dtVacancies ? this.dtVacancies.pageSize : 10);
    this.showInfo(WiseI18n.t('SEGARKAN_3'), WiseI18n.t('DATA_LOWONGAN_TELAH_DISEGARKAN'), 'information');
  }

  async onAddClick() {
    await this.openWindow(WinJobVacancyEdit, {
      vacancyId: null,
      onSaved: () => this.loadVacanciesTable(this.dtVacancies.currentPage, this.dtVacancies.pageSize)
    });
  }

  async onEditClick() {
    if (!this.selectedVacancy) {
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_BARIS_LOWONGAN_TERLEBIH_DAHULU'), 'warning');
      return;
    }
    await this.openWindow(WinJobVacancyEdit, {
      vacancyId: this.selectedVacancy.id,
      onSaved: () => this.loadVacanciesTable(this.dtVacancies.currentPage, this.dtVacancies.pageSize)
    });
  }

  async onViewApplicantsClick() {
    if (!this.selectedVacancy) {
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_BARIS_LOWONGAN_TERLEBIH_DAHULU'), 'warning');
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
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_BARIS_LOWONGAN_PEKERJAAN_YANG_INGIN'), 'warning');
      return;
    }

    const conf = await this.confirm(
      WiseI18n.t('KONFIRMASI_HAPUS'),
      `${WiseI18n.t('APAKAH_ANDA_YAKIN_INGIN_MENGHAPUS_LOWONGAN_PEKERJAAN')} "${this.selectedVacancy.title}"? ${WiseI18n.t('TINDAKAN_INI_TIDAK_DAPAT_DIBATALKAN')}`
    );
    if (!conf) return;

    try {
      await api.deleteVacancy(this.selectedVacancy.id);
      this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('LOWONGAN_PEKERJAAN_BERHASIL_DIHAPUS'), 'success');
      this.selectedVacancy = null;
      await this.loadVacanciesTable(1, this.dtVacancies.pageSize);
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

module.exports = WinJobVacancyList;
