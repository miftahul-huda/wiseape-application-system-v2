const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseFrame = require('../../../../system/controls/WiseFrame');

const WinOrganizationEdit = require('./WinOrganizationEdit');
const WinJobLevelEdit = require('./WinJobLevelEdit');
const WinPositionEdit = require('./WinPositionEdit');

const HrisApiRepository = require('../../services/HrisApiRepository');
const api = new HrisApiRepository();

const WiseI18n = typeof window !== 'undefined' ? window.WiseI18n : require('../../../../system/WiseI18n');

class WinOrganizationManagement extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('Organization & Position Management — Wise HRIS');
    this.appTitle = options.appTitle || WiseI18n.t('Organization & Position Management — Wise HRIS');
    this.appIcon = options.appIcon || '🏛️';
    this.width = options.width || '90%';
    this.height = options.height || 720;
    this.positionX = options.positionX !== undefined ? options.positionX : 70;
    this.positionY = options.positionY !== undefined ? options.positionY : 40;
    this.centered = true;

    this.activeTab = 'org'; // 'org' | 'levels' | 'positions'
    this.selectedItem = null;
    this.cachedOrgs = [];
    this.cachedLevels = [];
    this.cachedPositions = [];
    this._currentFilters = {};
  }

  t(key) {
    return WiseI18n.t(key);
  }

  onWindowInit() {
    this.controls = [];

    // 1. Tab Navigation Buttons Card
    const tabNavCard = new WiseFrame('', {
      id: 'frameOrgTabNav',
      style: {
        display: 'flex',
        gap: '8px',
        marginBottom: '10px'
      }
    });

    this.btnTabOrg = new WiseButton(this.t('🏛️ Unit Organisasi (Divisi & Dept)'), {
      id: 'btnTabOrg',
      onClick: () => this.switchTab('org'),
      style: {
        background: this.activeTab === 'org' ? 'var(--accent-dark)' : '#e2e8f0',
        color: this.activeTab === 'org' ? '#ffffff' : '#334155',
        fontWeight: 700,
        borderRadius: '8px',
        padding: '9px 18px',
        cursor: 'pointer'
      }
    });

    this.btnTabLevels = new WiseButton(this.t('🎖️ Jenjang Jabatan (Job Levels)'), {
      id: 'btnTabLevels',
      onClick: () => this.switchTab('levels'),
      style: {
        background: this.activeTab === 'levels' ? 'var(--accent-dark)' : '#e2e8f0',
        color: this.activeTab === 'levels' ? '#ffffff' : '#334155',
        fontWeight: 700,
        borderRadius: '8px',
        padding: '9px 18px',
        cursor: 'pointer'
      }
    });

    this.btnTabPositions = new WiseButton(this.t('💼 Master Jabatan (Positions)'), {
      id: 'btnTabPositions',
      onClick: () => this.switchTab('positions'),
      style: {
        background: this.activeTab === 'positions' ? 'var(--accent-dark)' : '#e2e8f0',
        color: this.activeTab === 'positions' ? '#ffffff' : '#334155',
        fontWeight: 700,
        borderRadius: '8px',
        padding: '9px 18px',
        cursor: 'pointer'
      }
    });

    tabNavCard.addControl(this.btnTabOrg);
    tabNavCard.addControl(this.btnTabLevels);
    tabNavCard.addControl(this.btnTabPositions);
    this.addControl(tabNavCard);

    // 3. Actions Toolbar
    const actionToolbar = new WiseFrame('', {
      id: 'frameOrgActions',
      style: {
        display: 'flex',
        gap: '8px',
        marginBottom: '10px'
      }
    });

    actionToolbar.addControl(new WiseButton(this.t('➕ Tambah Data'), {
      id: 'btnOrgAdd',
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

    actionToolbar.addControl(new WiseButton(this.t('✏️ Edit Data'), {
      id: 'btnOrgEdit',
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

    actionToolbar.addControl(new WiseButton(this.t('🔄 Toggle Aktif/Nonaktif'), {
      id: 'btnOrgToggleActive',
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

    actionToolbar.addControl(new WiseButton(this.t('🗑️ Hapus'), {
      id: 'btnOrgDelete',
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

    actionToolbar.addControl(new WiseButton(this.t('🔄 Segarkan (Refresh)'), {
      id: 'btnOrgRefresh',
      onClick: () => this.fetchCurrentTabData(1, 15, this._currentFilters),
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

    // 4. Data Table
    this.dtOrg = new WiseDataTable({
      id: 'dtOrg',
      pageSize: 15,
      pageSizeOptions: [10, 15, 25, 50],
      maxHeight: '52vh',
      onDataFilterChanged: this.onTableFilterChanged.bind(this),
      onRowSelect: this.onRowSelect.bind(this)
    });

    this.setupTableForTab(this.activeTab);

    this.dtOrg.addContextMenu([
      { id: 'edit', label: this.t('Edit'), onClick: (row) => this.onEditClick(row) },
      { id: 'toggle', label: this.t('Toggle Status'), onClick: (row) => this.onToggleActiveClick(row) },
      { id: 'delete', label: this.t('Hapus'), onClick: (row) => this.onDeleteClick(row) }
    ]);

    this.addControl(this.dtOrg);

    // 5. Summary Info
    this.lblSummary = new WiseLabel(this.t('Memuat data organisasi...'), {
      id: 'lblOrgSummary',
      style: { color: '#64748b', fontWeight: 500, display: 'block', marginTop: '8px' }
    });
    this.addControl(this.lblSummary);

    return this;
  }

  setupTableForTab(tab) {
    if (tab === 'org') {
      this.dtOrg.setColumns([
        { dataField: 'no', header: '#', width: 50 },
        { dataField: 'typeBadge', header: this.t('Tipe'), width: 120 },
        { dataField: 'code', header: this.t('Kode'), width: 120 },
        { dataField: 'name', header: this.t('Nama Unit Organisasi'), width: 250 },
        { dataField: 'parentName', header: this.t('Induk Organisasi'), width: 220 },
        { dataField: 'description', header: this.t('Deskripsi'), width: 'auto' },
        { dataField: 'sortOrder', header: this.t('Urutan'), width: 70 },
        { dataField: 'statusBadge', header: this.t('Status'), width: 110 }
      ]);
    } else if (tab === 'levels') {
      this.dtOrg.setColumns([
        { dataField: 'no', header: '#', width: 50 },
        { dataField: 'code', header: this.t('Kode'), width: 120 },
        { dataField: 'name', header: this.t('Nama Jenjang / Grade'), width: 240 },
        { dataField: 'levelBadge', header: this.t('Tingkat Level'), width: 120 },
        { dataField: 'description', header: this.t('Cakupan Tanggung Jawab'), width: 'auto' },
        { dataField: 'sortOrder', header: this.t('Urutan'), width: 70 },
        { dataField: 'statusBadge', header: this.t('Status'), width: 110 }
      ]);
    } else {
      this.dtOrg.setColumns([
        { dataField: 'no', header: '#', width: 50 },
        { dataField: 'code', header: this.t('Kode'), width: 130 },
        { dataField: 'title', header: this.t('Judul / Nama Jabatan'), width: 240 },
        { dataField: 'department', header: this.t('Unit / Departemen'), width: 220 },
        { dataField: 'jobLevelName', header: this.t('Jenjang / Grade'), width: 180 },
        { dataField: 'description', header: this.t('Uraian Tugas'), width: 'auto' },
        { dataField: 'sortOrder', header: this.t('Urutan'), width: 70 },
        { dataField: 'statusBadge', header: this.t('Status'), width: 110 }
      ]);
    }

    this.dtOrg.filterControls = [];
    this.dtOrg.addFilters([
      {
        id: 'search',
        type: 'text',
        label: this.t('Pencarian'),
        placeholder: this.t('Cari kode, nama, deskripsi...'),
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'isActive',
        type: 'select',
        label: this.t('Status'),
        items: [
          { value: '', label: this.t('Semua Status') },
          { value: 'true', label: '🟢 ' + this.t('Aktif') },
          { value: 'false', label: '🔴 ' + this.t('Nonaktif') }
        ],
        onChange: this.onTableFilterInputChanged.bind(this)
      }
    ]);
  }

  async loadInitialData() {
    await this.fetchOptions();
    await this.fetchCurrentTabData(1, 15, {});
  }

  async fetchOptions() {
    try {
      const [orgRes, lvlRes] = await Promise.all([
        api.listOrganizations({ isActive: 'ALL' }),
        api.listJobLevels({ isActive: 'ALL' })
      ]);
      this.cachedOrgs = orgRes.rows || [];
      this.cachedLevels = lvlRes.rows || [];
    } catch (err) {
      console.warn('Error fetching org options:', err);
    }
  }

  async switchTab(tab) {
    this.activeTab = tab;
    this.selectedItem = null;
    this._currentFilters = {};

    if (this.btnTabOrg) {
      this.btnTabOrg.style.background = tab === 'org' ? 'var(--accent-dark)' : '#e2e8f0';
      this.btnTabOrg.style.color = tab === 'org' ? '#ffffff' : '#334155';
    }
    if (this.btnTabLevels) {
      this.btnTabLevels.style.background = tab === 'levels' ? 'var(--accent-dark)' : '#e2e8f0';
      this.btnTabLevels.style.color = tab === 'levels' ? '#ffffff' : '#334155';
    }
    if (this.btnTabPositions) {
      this.btnTabPositions.style.background = tab === 'positions' ? 'var(--accent-dark)' : '#e2e8f0';
      this.btnTabPositions.style.color = tab === 'positions' ? '#ffffff' : '#334155';
    }

    this.setupTableForTab(tab);
    await this.fetchCurrentTabData(1, 15, {});
  }

  async fetchCurrentTabData(page = 1, limit = 15, filters = {}) {
    try {
      const search = (filters.search || '').trim();
      const isActive = filters.isActive !== undefined && filters.isActive !== '' ? filters.isActive : 'ALL';

      if (this.activeTab === 'org') {
        const res = await api.listOrganizations({ search, isActive });
        this.cachedOrgs = res.rows || [];
        const formatted = this.cachedOrgs.map((item, idx) => ({
          ...item,
          no: idx + 1,
          typeBadge: `[${item.type}]`,
          parentName: item.parent
            ? `[${item.parent.code}] ${item.parent.name}`
            : this.t('(Root / Tingkat Atas)'),
          statusBadge: item.isActive ? ('🟢 ' + this.t('Aktif')) : ('🔴 ' + this.t('Nonaktif'))
        }));
        this.dtOrg.pageSize = limit;
        this.dtOrg.currentPage = page;
        this.dtOrg.setData(formatted, formatted.length);
        if (this.lblSummary) {
          const activeCount = this.cachedOrgs.filter((i) => i.isActive).length;
          this.lblSummary.text = `${this.t('Menampilkan')} ${this.cachedOrgs.length} ${this.t('unit organisasi')} (${activeCount} ${this.t('Aktif')}, ${this.cachedOrgs.length - activeCount} ${this.t('Nonaktif')}).`;
        }
      } else if (this.activeTab === 'levels') {
        const res = await api.listJobLevels({ search, isActive });
        this.cachedLevels = res.rows || [];
        const formatted = this.cachedLevels.map((item, idx) => ({
          ...item,
          no: idx + 1,
          levelBadge: `Level ${item.levelNumber}`,
          statusBadge: item.isActive ? ('🟢 ' + this.t('Aktif')) : ('🔴 ' + this.t('Nonaktif'))
        }));
        this.dtOrg.pageSize = limit;
        this.dtOrg.currentPage = page;
        this.dtOrg.setData(formatted, formatted.length);
        if (this.lblSummary) {
          const activeCount = this.cachedLevels.filter((i) => i.isActive).length;
          this.lblSummary.text = `${this.t('Menampilkan')} ${this.cachedLevels.length} ${this.t('jenjang jabatan')} (${activeCount} ${this.t('Aktif')}, ${this.cachedLevels.length - activeCount} ${this.t('Nonaktif')}).`;
        }
      } else {
        const res = await api.listPositions({ search, isActive });
        this.cachedPositions = res.rows || [];
        const formatted = this.cachedPositions.map((item, idx) => ({
          ...item,
          no: idx + 1,
          department: item.organization ? item.organization.name : (item.department || '-'),
          jobLevelName: item.jobLevel ? `[Lvl ${item.jobLevel.level_number || item.jobLevel.levelNumber}] ${item.jobLevel.name}` : '-',
          statusBadge: item.isActive ? ('🟢 ' + this.t('Aktif')) : ('🔴 ' + this.t('Nonaktif'))
        }));
        this.dtOrg.pageSize = limit;
        this.dtOrg.currentPage = page;
        this.dtOrg.setData(formatted, formatted.length);
        if (this.lblSummary) {
          const activeCount = this.cachedPositions.filter((i) => i.isActive).length;
          this.lblSummary.text = `${this.t('Menampilkan')} ${this.cachedPositions.length} ${this.t('master posisi jabatan')} (${activeCount} ${this.t('Aktif')}, ${this.cachedPositions.length - activeCount} ${this.t('Nonaktif')}).`;
        }
      }

      this._currentFilters = filters;
    } catch (err) {
      console.error('Error fetching tab data:', err);
      if (this.lblSummary) {
        this.lblSummary.text = `⚠️ ${err.message}`;
      }
    }
  }

  async onTableFilterChanged(pageSize, page) {
    await this.fetchCurrentTabData(page, pageSize, this._currentFilters || {});
  }

  async onTableFilterInputChanged(filterValues) {
    const { _triggerId, ...filters } = filterValues;
    await this.fetchCurrentTabData(1, this.dtOrg ? this.dtOrg.pageSize : 15, filters);
  }

  onRowSelect(row, selectedRows = []) {
    const rows = selectedRows && selectedRows.length > 0 ? selectedRows : (row ? [row] : []);
    if (rows.length === 0) {
      this.selectedItem = null;
      return;
    }
    this.selectedItem = rows[0];
    const name = this.selectedItem.name || this.selectedItem.title || this.selectedItem.code;
    if (this.lblSummary && name) {
      this.lblSummary.text = `${this.t('Dipilih')}: [${this.selectedItem.code}] ${name}`;
    }
  }

  onAddClick() {
    if (this.activeTab === 'org') {
      this.openWindow(WinOrganizationEdit, {
        isNew: true,
        parentOptions: this.cachedOrgs,
        onSaved: async () => {
          await this.fetchOptions();
          await this.fetchCurrentTabData(1, 15, this._currentFilters || {});
        }
      });
    } else if (this.activeTab === 'levels') {
      this.openWindow(WinJobLevelEdit, {
        isNew: true,
        onSaved: async () => {
          await this.fetchOptions();
          await this.fetchCurrentTabData(1, 15, this._currentFilters || {});
        }
      });
    } else {
      this.openWindow(WinPositionEdit, {
        isNew: true,
        orgOptions: this.cachedOrgs,
        levelOptions: this.cachedLevels,
        onSaved: async () => {
          await this.fetchCurrentTabData(1, 15, this._currentFilters || {});
        }
      });
    }
  }

  onEditClick(targetRow = null) {
    const item = targetRow || this.selectedItem;
    if (!item) {
      alert(this.t('Pilih salah satu baris data yang ingin diedit terlebih dahulu.'));
      return;
    }

    if (this.activeTab === 'org') {
      this.openWindow(WinOrganizationEdit, {
        isNew: false,
        orgId: item.id,
        data: item,
        parentOptions: this.cachedOrgs.filter((o) => o.id !== item.id),
        onSaved: async () => {
          await this.fetchOptions();
          await this.fetchCurrentTabData(1, 15, this._currentFilters || {});
        }
      });
    } else if (this.activeTab === 'levels') {
      this.openWindow(WinJobLevelEdit, {
        isNew: false,
        jobLevelId: item.id,
        data: item,
        onSaved: async () => {
          await this.fetchOptions();
          await this.fetchCurrentTabData(1, 15, this._currentFilters || {});
        }
      });
    } else {
      this.openWindow(WinPositionEdit, {
        isNew: false,
        positionId: item.id,
        data: item,
        orgOptions: this.cachedOrgs,
        levelOptions: this.cachedLevels,
        onSaved: async () => {
          await this.fetchCurrentTabData(1, 15, this._currentFilters || {});
        }
      });
    }
  }

  async onToggleActiveClick(targetRow = null) {
    const item = targetRow || this.selectedItem;
    if (!item) {
      alert(this.t('Pilih salah satu baris data terlebih dahulu.'));
      return;
    }

    try {
      if (this.activeTab === 'org') {
        if (item.isActive) await api.deactivateOrganization(item.id);
        else await api.activateOrganization(item.id);
      } else if (this.activeTab === 'levels') {
        if (item.isActive) await api.deactivateJobLevel(item.id);
        else await api.activateJobLevel(item.id);
      } else {
        if (item.isActive) await api.deactivatePosition(item.id);
        else await api.activatePosition(item.id);
      }
      await this.fetchCurrentTabData(1, 15, this._currentFilters || {});
    } catch (err) {
      alert(`${err.message}`);
    }
  }

  async onDeleteClick(targetRow = null) {
    const item = targetRow || this.selectedItem;
    if (!item) {
      alert(this.t('Pilih baris data yang ingin dihapus terlebih dahulu.'));
      return;
    }

    const name = item.name || item.title || item.code;
    const confirmed = window.confirm(`${name}`);
    if (!confirmed) return;

    try {
      if (this.activeTab === 'org') {
        await api.deleteOrganization(item.id);
      } else if (this.activeTab === 'levels') {
        await api.deleteJobLevel(item.id);
      } else {
        await api.deletePosition(item.id);
      }
      this.selectedItem = null;
      await this.fetchOptions();
      await this.fetchCurrentTabData(1, 15, this._currentFilters || {});
    } catch (err) {
      alert(`${err.message}`);
    }
  }
}

module.exports = WinOrganizationManagement;
