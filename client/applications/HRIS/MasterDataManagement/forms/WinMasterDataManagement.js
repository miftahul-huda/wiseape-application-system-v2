import {
  WiseWindow,
  WiseLabel,
  WiseButton,
  WiseDataTable,
  WiseFrame,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

import WinMasterDataEdit from './WinMasterDataEdit';
import HrisApiRepository from '../../services/HrisApiRepository';
const api = new HrisApiRepository();


const CATEGORIES = () => [
  { value: 'ALL', label: WiseI18n.t('SEMUA_KATEGORI') },
  { value: 'RELATIONSHIP', label: WiseI18n.t('HUBUNGAN_KELUARGA_RELATIONSHIP') },
  { value: 'RELIGION', label: WiseI18n.t('AGAMA_RELIGION') },
  { value: 'EMPLOYMENT_STATUS', label: WiseI18n.t('STATUS_KEPEGAWAIAN_EMPLOYMENT_STATUS') },
  { value: 'WORK_LOCATION', label: WiseI18n.t('LOKASI_KERJA_WORK_LOCATION') },
  { value: 'BANK', label: WiseI18n.t('BANK_PAYROLL_BANK') },
  { value: 'DOCUMENT_TYPE', label: WiseI18n.t('JENIS_DOKUMEN_DOCUMENT_TYPE') },
  { value: 'DEGREE_LEVEL', label: WiseI18n.t('JENJANG_PENDIDIKAN_DEGREE_LEVEL') },
  { value: 'GENDER', label: WiseI18n.t('JENIS_KELAMIN_GENDER') }
];

const CAT_MAP = () => ({
  RELATIONSHIP: WiseI18n.t('HUBUNGAN_KELUARGA_RELATIONSHIP'),
  RELIGION: WiseI18n.t('AGAMA_RELIGION'),
  EMPLOYMENT_STATUS: WiseI18n.t('STATUS_KEPEGAWAIAN_EMPLOYMENT_STATUS'),
  WORK_LOCATION: WiseI18n.t('LOKASI_KERJA_WORK_LOCATION'),
  BANK: WiseI18n.t('BANK_PAYROLL_BANK'),
  DOCUMENT_TYPE: WiseI18n.t('JENIS_DOKUMEN_DOCUMENT_TYPE'),
  DEGREE_LEVEL: WiseI18n.t('JENJANG_PENDIDIKAN_DEGREE_LEVEL'),
  GENDER: WiseI18n.t('JENIS_KELAMIN_GENDER')
});

class WinMasterDataManagement extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('MANAJEMEN_DATA_MASTER_WISE_HRIS');
    this.appTitle = options.appTitle || WiseI18n.t('MANAJEMEN_DATA_MASTER_WISE_HRIS');
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('TAMBAH_DATA_2'), {
      id: 'btnMasterAdd',
      onClick: this.onAddClick.bind(this)
    }));

    actionToolbar.addControl(new WiseButton(WiseI18n.t('EDIT_DATA_2'), {
      id: 'btnMasterEdit',
      onClick: this.onEditClick.bind(this),
      style: {
        background: 'var(--accent-dark)',
        color: '#ffffff'
      }
    }));

    actionToolbar.addControl(new WiseButton(WiseI18n.t('TOGGLE_AKTIF_NONAKTIF_2'), {
      id: 'btnMasterToggle',
      onClick: this.onToggleActiveClick.bind(this),
      style: {
        background: '#f59e0b',
        color: '#ffffff'
      }
    }));

    actionToolbar.addControl(new WiseButton(WiseI18n.t('HAPUS_3'), {
      id: 'btnMasterDelete',
      onClick: this.onDeleteClick.bind(this),
      style: {
        background: '#ef4444',
        color: '#ffffff',
      }
    }));

    actionToolbar.addControl(new WiseButton(WiseI18n.t('SEGARKAN_REFRESH_2'), {
      id: 'btnMasterRefresh',
      onClick: () => this.loadMasterTable(1, 15, this._currentFilters),
      style: {
        background: '#64748b',
        color: '#ffffff'
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
      { dataField: 'dataTypeLabel', header: WiseI18n.t('KATEGORI'), width: 180 },
      { dataField: 'code', header: WiseI18n.t('KODE'), width: 130 },
      { dataField: 'name', header: WiseI18n.t('NAMA_MASTER_DATA'), width: 230 },
      { dataField: 'description', header: WiseI18n.t('KETERANGAN'), width: 'auto' },
      { dataField: 'sortOrder', header: WiseI18n.t('URUTAN'), width: 70 },
      { dataField: 'statusBadge', header: WiseI18n.t('STATUS'), width: 110 }
    ]);

    this.dtMaster.addFilters([
      {
        id: 'category',
        type: 'select',
        label: WiseI18n.t('KATEGORI_MASTER'),
        items: CATEGORIES().map((c) => ({ value: c.value, label: c.label })),
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'search',
        type: 'text',
        label: WiseI18n.t('PENCARIAN'),
        placeholder: WiseI18n.t('CARI_KODE_NAMA_ATAU_KETERANGAN'),
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'isActive',
        type: 'select',
        label: WiseI18n.t('STATUS'),
        items: [
          { value: '', label: WiseI18n.t('SEMUA_STATUS') },
          { value: 'true', label: '🟢 ' + WiseI18n.t('AKTIF_2') },
          { value: 'false', label: '🔴 ' + WiseI18n.t('NONAKTIF_2') }
        ],
        onChange: this.onTableFilterInputChanged.bind(this)
      }
    ]);

    this.dtMaster.addContextMenu([
      { id: 'edit', label: WiseI18n.t('EDIT'), onClick: (row) => this.onEditClick(row) },
      { id: 'toggle', label: WiseI18n.t('TOGGLE_STATUS'), onClick: (row) => this.onToggleActiveClick(row) },
      { id: 'delete', label: WiseI18n.t('HAPUS'), onClick: (row) => this.onDeleteClick(row) }
    ]);

    this.addControl(this.dtMaster);

    // 4. Status Bar / Selection Info
    this.lblSummary = new WiseLabel(WiseI18n.t('MEMUAT_DATA_MASTER'), {
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
        statusBadge: item.isActive ? ('🟢 ' + WiseI18n.t('AKTIF_2')) : ('🔴 ' + WiseI18n.t('NONAKTIF_2'))
      }));

      this.dtMaster.pageSize = limit;
      this.dtMaster.currentPage = page;
      this.dtMaster.setData(formattedRows, totalCount);

      this._currentFilters = filters;

      const activeCount = this.cachedData.filter((i) => i.isActive).length;
      const inactiveCount = this.cachedData.length - activeCount;
      if (this.lblSummary) {
        this.lblSummary.text = `${WiseI18n.t('MENAMPILKAN')} ${this.cachedData.length} ${WiseI18n.t('ITEM_DATA')} (${activeCount} ${WiseI18n.t('AKTIF_2')}, ${inactiveCount} ${WiseI18n.t('NONAKTIF_2')}).`;
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
      this.lblSummary.text = `${WiseI18n.t('DIPILIH')}: [${this.selectedItem.code}] ${this.selectedItem.name} (${catMap[this.selectedItem.dataType] || this.selectedItem.dataType})`;
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
      return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('PILIH_SALAH_SATU_BARIS_MASTER_DATA_YANG_INGIN_DIEDIT'), 'warning');
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
      return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('PILIH_SALAH_SATU_BARIS_MASTER_DATA_TERLEBIH_DAHULU'), 'warning');
    }

    try {
      if (item.isActive) {
        await api.deactivateMasterData(item.id);
      } else {
        await api.activateMasterData(item.id);
      }
      await this.loadMasterTable(1, this.dtMaster ? this.dtMaster.pageSize : 15, this._currentFilters || {});
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  async onDeleteClick(targetRow = null) {
    const item = targetRow || this.selectedItem;
    if (!item) {
      return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('PILIH_BARIS_MASTER_DATA_YANG_INGIN_DIHAPUS_TERLEBIH_DAHULU'), 'warning');
    }

    const confirmed = await this.confirm(
      WiseI18n.t('KONFIRMASI_HAPUS'),
      `${WiseI18n.t('APAKAH_ANDA_YAKIN_INGIN_MENGHAPUS')} "${item.name}" (${item.code})? ${WiseI18n.t('TINDAKAN_INI_TIDAK_DAPAT_DIBATALKAN')}`,
      { type: 'danger', confirmText: WiseI18n.t('HAPUS_3') }
    );
    if (!confirmed) return;

    try {
      await api.deleteMasterData(item.id);
      this.selectedItem = null;
      await this.loadMasterTable(1, this.dtMaster ? this.dtMaster.pageSize : 15, this._currentFilters || {});
      this.showInfo(WiseI18n.t('BERHASIL'), `"${item.name}" ${WiseI18n.t('BERHASIL_DIHAPUS')}.`, 'success');
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }
}

export default WinMasterDataManagement;
