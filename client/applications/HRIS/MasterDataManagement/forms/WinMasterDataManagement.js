const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseFrame = require('../../../../system/controls/WiseFrame');

const WinMasterDataEdit = require('./WinMasterDataEdit');
const HrisApiRepository = require('../../services/HrisApiRepository');
const api = new HrisApiRepository();

const WiseI18n = typeof window !== 'undefined' ? window.WiseI18n : require('../../../../system/WiseI18n');

const CATEGORIES = () => {
  const t = (k) => WiseI18n.t(k);
  return [
    { value: 'ALL', label: t('📁 Semua Kategori') },
    { value: 'RELATIONSHIP', label: t('👨‍👩‍👧‍👦 Hubungan Keluarga (Relationship)') },
    { value: 'RELIGION', label: t('🕊️ Agama (Religion)') },
    { value: 'EMPLOYMENT_STATUS', label: t('📋 Status Kepegawaian (Employment Status)') },
    { value: 'WORK_LOCATION', label: t('📍 Lokasi Kerja (Work Location)') },
    { value: 'BANK', label: t('🏦 Bank Payroll (Bank)') },
    { value: 'DOCUMENT_TYPE', label: t('📄 Jenis Dokumen (Document Type)') },
    { value: 'DEGREE_LEVEL', label: t('🎓 Jenjang Pendidikan (Degree Level)') },
    { value: 'GENDER', label: t('🚻 Jenis Kelamin (Gender)') }
  ];
};

const CAT_MAP = () => {
  const t = (k) => WiseI18n.t(k);
  return {
    RELATIONSHIP: t('👨‍👩‍👧‍👦 Hubungan Keluarga (Relationship)'),
    RELIGION: t('🕊️ Agama (Religion)'),
    EMPLOYMENT_STATUS: t('📋 Status Kepegawaian (Employment Status)'),
    WORK_LOCATION: t('📍 Lokasi Kerja (Work Location)'),
    BANK: t('🏦 Bank Payroll (Bank)'),
    DOCUMENT_TYPE: t('📄 Jenis Dokumen (Document Type)'),
    DEGREE_LEVEL: t('🎓 Jenjang Pendidikan (Degree Level)'),
    GENDER: t('🚻 Jenis Kelamin (Gender)')
  };
};

class WinMasterDataManagement extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('Master Data Management — Wise HRIS');
    this.appTitle = options.appTitle || WiseI18n.t('Master Data Management — Wise HRIS');
    this.appIcon = options.appIcon || '🗂️';
    this.width = options.width || '88%';
    this.height = options.height || 700;
    this.positionX = options.positionX !== undefined ? options.positionX : 80;
    this.positionY = options.positionY !== undefined ? options.positionY : 50;
    this.centered = true;

    this.selectedItem = null;
    this.cachedData = [];
    this._currentFilters = {};
  }

  onWindowInit() {
    this.controls = [];

    // 1. Action Toolbar Buttons
    const actionToolbar = new WiseFrame('', {
      id: 'frameMasterActions',
      style: {
        display: 'flex',
        gap: '8px',
        marginBottom: '10px'
      }
    });

    actionToolbar.addControl(new WiseButton(WiseI18n.t('➕ Tambah Data'), {
      id: 'btnMasterAdd',
      onClick: this.onAddClick.bind(this),
      style: {
        background: 'var(--accent)',
        color: '#ffffff',
        fontWeight: 700,
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer'
      }
    }));

    actionToolbar.addControl(new WiseButton(WiseI18n.t('✏️ Edit Data'), {
      id: 'btnMasterEdit',
      onClick: this.onEditClick.bind(this),
      style: {
        background: 'var(--accent-dark)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer'
      }
    }));

    actionToolbar.addControl(new WiseButton(WiseI18n.t('🔄 Toggle Aktif/Nonaktif'), {
      id: 'btnMasterToggle',
      onClick: this.onToggleActiveClick.bind(this),
      style: {
        background: '#f59e0b',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer'
      }
    }));

    actionToolbar.addControl(new WiseButton(WiseI18n.t('🗑️ Hapus'), {
      id: 'btnMasterDelete',
      onClick: this.onDeleteClick.bind(this),
      style: {
        background: '#ef4444',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer'
      }
    }));

    actionToolbar.addControl(new WiseButton(WiseI18n.t('🔄 Segarkan (Refresh)'), {
      id: 'btnMasterRefresh',
      onClick: () => this.loadMasterTable(1, 15, this._currentFilters),
      style: {
        background: '#64748b',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer'
      }
    }));

    this.addControl(actionToolbar);

    // 3. Data Table with Integrated Filter Bar
    this.dtMaster = new WiseDataTable({
      id: 'dtMaster',
      pageSize: 15,
      pageSizeOptions: [10, 15, 25, 50],
      maxHeight: '52vh',
      onDataFilterChanged: this.onTableFilterChanged.bind(this),
      onRowSelect: this.onMasterRowSelect.bind(this)
    });

    this.dtMaster.setColumns([
      { dataField: 'no', header: '#', width: 50 },
      { dataField: 'dataTypeLabel', header: WiseI18n.t('Kategori'), width: 180 },
      { dataField: 'code', header: WiseI18n.t('Kode'), width: 130 },
      { dataField: 'name', header: WiseI18n.t('Nama Master Data'), width: 230 },
      { dataField: 'description', header: WiseI18n.t('Keterangan'), width: 'auto' },
      { dataField: 'sortOrder', header: WiseI18n.t('Urutan'), width: 70 },
      { dataField: 'statusBadge', header: WiseI18n.t('Status'), width: 110 }
    ]);

    this.dtMaster.addFilters([
      {
        id: 'category',
        type: 'select',
        label: WiseI18n.t('Kategori Master'),
        items: CATEGORIES().map((c) => ({ value: c.value, label: c.label })),
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'search',
        type: 'text',
        label: WiseI18n.t('Pencarian'),
        placeholder: WiseI18n.t('Cari kode, nama, atau keterangan...'),
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'isActive',
        type: 'select',
        label: WiseI18n.t('Status'),
        items: [
          { value: '', label: WiseI18n.t('Semua Status') },
          { value: 'true', label: '🟢 ' + WiseI18n.t('Aktif') },
          { value: 'false', label: '🔴 ' + WiseI18n.t('Nonaktif') }
        ],
        onChange: this.onTableFilterInputChanged.bind(this)
      }
    ]);

    this.dtMaster.addContextMenu([
      { id: 'edit', label: WiseI18n.t('Edit'), onClick: (row) => this.onEditClick(row) },
      { id: 'toggle', label: WiseI18n.t('Toggle Status'), onClick: (row) => this.onToggleActiveClick(row) },
      { id: 'delete', label: WiseI18n.t('Hapus'), onClick: (row) => this.onDeleteClick(row) }
    ]);

    this.addControl(this.dtMaster);

    // 4. Status Bar / Selection Info
    this.lblSummary = new WiseLabel(WiseI18n.t('Memuat data master...'), {
      id: 'lblMasterSummary',
      style: { color: '#64748b', fontWeight: 500, display: 'block', marginTop: '8px' }
    });
    this.addControl(this.lblSummary);

    return this;
  }

  async loadInitialData() {
    await this.loadMasterTable(1, 15, {});
  }

  async loadMasterTable(page = 1, limit = 15, filters = {}) {
    try {
      const category = filters.category || 'ALL';
      const search = (filters.search || '').trim();
      const isActive = filters.isActive !== undefined && filters.isActive !== '' ? filters.isActive : 'ALL';

      const res = await api.listMasterData({
        dataType: category,
        search,
        isActive,
        sortBy: 'sort_order',
        sortOrder: 'ASC'
      });

      this.cachedData = res.rows || [];
      const totalCount = res.meta?.total || this.cachedData.length;
      const catMap = CAT_MAP();

      const formattedRows = this.cachedData.map((item, idx) => ({
        ...item,
        no: idx + 1,
        dataTypeLabel: catMap[item.dataType] || item.dataType,
        statusBadge: item.isActive ? ('🟢 ' + WiseI18n.t('Aktif')) : ('🔴 ' + WiseI18n.t('Nonaktif'))
      }));

      this.dtMaster.pageSize = limit;
      this.dtMaster.currentPage = page;
      this.dtMaster.setData(formattedRows, totalCount);

      this._currentFilters = filters;

      const activeCount = this.cachedData.filter((i) => i.isActive).length;
      const inactiveCount = this.cachedData.length - activeCount;
      if (this.lblSummary) {
        this.lblSummary.text = `${WiseI18n.t('Menampilkan')} ${this.cachedData.length} ${WiseI18n.t('item data')} (${activeCount} ${WiseI18n.t('Aktif')}, ${inactiveCount} ${WiseI18n.t('Nonaktif')}).`;
      }
    } catch (err) {
      console.error('Error loading master table:', err);
      if (this.lblSummary) {
        this.lblSummary.text = `⚠️ ${err.message}`;
      }
    }
  }

  async onTableFilterChanged(pageSize, page) {
    await this.loadMasterTable(page, pageSize, this._currentFilters || {});
  }

  async onTableFilterInputChanged(filterValues) {
    const { _triggerId, ...filters } = filterValues;
    await this.loadMasterTable(1, this.dtMaster ? this.dtMaster.pageSize : 15, filters);
  }

  onMasterRowSelect(row, selectedRows = []) {
    const rows = selectedRows && selectedRows.length > 0 ? selectedRows : (row ? [row] : []);
    if (rows.length === 0) {
      this.selectedItem = null;
      return;
    }
    this.selectedItem = rows[0];
    const catMap = CAT_MAP();
    if (this.lblSummary && this.selectedItem) {
      this.lblSummary.text = `${WiseI18n.t('Dipilih')}: [${this.selectedItem.code}] ${this.selectedItem.name} (${catMap[this.selectedItem.dataType] || this.selectedItem.dataType})`;
    }
  }

  onAddClick() {
    const initialType = this._currentFilters && this._currentFilters.category && this._currentFilters.category !== 'ALL'
      ? this._currentFilters.category
      : 'RELATIONSHIP';

    this.openWindow(WinMasterDataEdit, {
      isNew: true,
      dataType: initialType,
      onSaved: async () => {
        await this.loadMasterTable(1, this.dtMaster ? this.dtMaster.pageSize : 15, this._currentFilters || {});
      }
    });
  }

  onEditClick(targetRow = null) {
    const item = targetRow || this.selectedItem;
    if (!item) {
      alert(WiseI18n.t('Pilih salah satu baris master data yang ingin diedit terlebih dahulu.'));
      return;
    }

    this.openWindow(WinMasterDataEdit, {
      isNew: false,
      masterDataId: item.id,
      dataType: item.dataType,
      data: item,
      onSaved: async () => {
        await this.loadMasterTable(1, this.dtMaster ? this.dtMaster.pageSize : 15, this._currentFilters || {});
      }
    });
  }

  async onToggleActiveClick(targetRow = null) {
    const item = targetRow || this.selectedItem;
    if (!item) {
      alert(WiseI18n.t('Pilih salah satu baris master data terlebih dahulu.'));
      return;
    }

    try {
      if (item.isActive) {
        await api.deactivateMasterData(item.id);
      } else {
        await api.activateMasterData(item.id);
      }
      await this.loadMasterTable(1, this.dtMaster ? this.dtMaster.pageSize : 15, this._currentFilters || {});
    } catch (err) {
      alert(`${err.message}`);
    }
  }

  async onDeleteClick(targetRow = null) {
    const item = targetRow || this.selectedItem;
    if (!item) {
      alert(WiseI18n.t('Pilih baris master data yang ingin dihapus terlebih dahulu.'));
      return;
    }

    const confirmed = window.confirm(`${item.name} (${item.code})`);
    if (!confirmed) return;

    try {
      await api.deleteMasterData(item.id);
      this.selectedItem = null;
      await this.loadMasterTable(1, this.dtMaster ? this.dtMaster.pageSize : 15, this._currentFilters || {});
    } catch (err) {
      alert(`${err.message}`);
    }
  }
}

module.exports = WinMasterDataManagement;
