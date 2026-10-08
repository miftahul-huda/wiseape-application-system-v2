const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseFrame = require('../../../../system/controls/WiseFrame');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

const WinStageTemplateEdit = require('./WinStageTemplateEdit');
const RecruitmentApiRepository = require('../services/RecruitmentApiRepository');
const api = new RecruitmentApiRepository();

class WinStageTemplateList extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('Template Proses Recruitment — Wise Recruitment');
    this.appIcon = options.appIcon || '⚙️';
    this.width = options.width || '86%';
    this.height = options.height || '82%';
    this.centered = true;

    this.selectedTemplate = null;
    this.cachedTemplates = [];
  }

  onWindowInit() {
    this.controls = [];

    // 1. Action Toolbar
    const actionToolbar = new WiseFrame('', {
      id: 'frameStageTplActions',
      style: { display: 'flex', gap: '8px', marginBottom: '10px' }
    });

    actionToolbar.addControl(new WiseButton(WiseI18n.t('➕ Tambah Template'), {
      id: 'btnStageTplAdd',
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('✏️ Edit Template'), {
      id: 'btnStageTplEdit',
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('🗑️ Hapus Template'), {
      id: 'btnStageTplDelete',
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
      id: 'btnStageTplRefresh',
      onClick: () => this.loadTable(),
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

    // 2. Data Table
    this.dtTemplates = new WiseDataTable({
      id: 'dtStageTemplates',
      pageSize: 15,
      currentPage: 1,
      multiSelect: false,
      style: { width: '100%' },
      onRowSelect: this.onRowSelect.bind(this)
    });

    this.dtTemplates.columns = [
      { key: 'code', title: WiseI18n.t('Kode'), width: '130px' },
      { key: 'name', title: WiseI18n.t('Nama Template Alur Proses'), width: '320px' },
      { key: 'stagesSummary', title: WiseI18n.t('Tahapan Proses Terdaftar'), width: '320px' },
      { key: 'description', title: WiseI18n.t('Deskripsi / Panduan'), width: '340px' },
      { key: 'statusBadge', title: WiseI18n.t('Status'), width: '110px' }
    ];

    this.dtTemplates.filterControls = [
      {
        id: 'search',
        type: 'text',
        label: WiseI18n.t('Pencarian'),
        placeholder: WiseI18n.t('Cari nama template proses...'),
        onChange: this.onSearchChanged.bind(this)
      }
    ];

    this.dtTemplates.contextMenuItems = [
      { id: 'edit', label: WiseI18n.t('Edit Template'), icon: '✏️', onClick: this.onEditClick.bind(this) },
      { id: 'delete', label: WiseI18n.t('Hapus Template'), icon: '🗑️', onClick: this.onDeleteClick.bind(this) }
    ];

    this.addControl(this.dtTemplates);

    // 3. Status Bar
    this.lblStatus = new WiseLabel(WiseI18n.t('Memuat template...'), {
      id: 'lblStageTplStatus',
      style: { color: '#64748b', display: 'block', marginTop: '8px' }
    });
    this.addControl(this.lblStatus);

    return this;
  }

  async loadInitialData() {
    await this.loadTable();
  }

  async loadTable(searchQuery = '') {
    try {
      if (this.lblStatus) this.lblStatus.setText(WiseI18n.t('Memuat template proses...'));
      const res = await api.listStageTemplates({ search: searchQuery });
      const rows = res.rows || [];
      this.cachedTemplates = rows;

      this.dtTemplates.data = rows.map((tpl) => {
        const stages = Array.isArray(tpl.stages) ? tpl.stages : [];
        const stageNames = stages.map((s, idx) => `${idx + 1}. ${s.name}`).join(' ➔ ');
        return {
          id: tpl.id,
          code: tpl.code || `STG-${tpl.id}`,
          name: tpl.name || '-',
          stagesSummary: stages.length > 0 ? `${stages.length} ${WiseI18n.t('Tahapan')} (${stageNames})` : WiseI18n.t('(Belum ada tahapan)'),
          description: tpl.description || '-',
          statusBadge: tpl.isActive ? WiseI18n.t('🟢 Aktif') : WiseI18n.t('🔴 Nonaktif'),
          _raw: tpl
        };
      });
      this.dtTemplates.totalCount = rows.length;

      if (this.lblStatus) {
        this.lblStatus.setText(`${WiseI18n.t('Menampilkan')} ${rows.length} ${WiseI18n.t('template proses recruitment.')}`);
      }
    } catch (err) {
      if (this.lblStatus) this.lblStatus.setText(`${WiseI18n.t('Gagal memuat template')}: ${err.message}`);
      this.showInfo(WiseI18n.t('Error'), err.message, 'error');
    }
  }

  onSearchChanged() {
    const f = this.dtTemplates.filterControls.find((c) => c.id === 'search');
    this.loadTable(f ? f.value : '');
  }

  onRowSelect() {
    const idx = this.dtTemplates.selectedRowIndex;
    if (idx !== null && idx >= 0 && this.cachedTemplates[idx]) {
      this.selectedTemplate = this.cachedTemplates[idx];
    } else {
      this.selectedTemplate = null;
    }
  }

  async onAddClick() {
    await this.openWindow(WinStageTemplateEdit, {
      templateId: null,
      onSaved: () => this.loadTable()
    });
  }

  async onEditClick() {
    if (!this.selectedTemplate) {
      this.showInfo(WiseI18n.t('Pemberitahuan'), WiseI18n.t('Pilih salah satu baris template yang ingin diedit.'), 'warning');
      return;
    }
    await this.openWindow(WinStageTemplateEdit, {
      templateId: this.selectedTemplate.id,
      onSaved: () => this.loadTable()
    });
  }

  async onDeleteClick() {
    if (!this.selectedTemplate) {
      this.showInfo(WiseI18n.t('Pemberitahuan'), WiseI18n.t('Pilih salah satu baris template yang ingin dihapus.'), 'warning');
      return;
    }

    const conf = await this.confirm(
      WiseI18n.t('Konfirmasi Hapus'),
      `${WiseI18n.t('Apakah Anda yakin ingin menghapus template alur')} "${this.selectedTemplate.name}"?`
    );
    if (!conf) return;

    try {
      await api.deleteStageTemplate(this.selectedTemplate.id);
      this.showInfo(WiseI18n.t('Sukses'), WiseI18n.t('Template proses berhasil dihapus.'), 'success');
      this.selectedTemplate = null;
      await this.loadTable();
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

module.exports = WinStageTemplateList;
