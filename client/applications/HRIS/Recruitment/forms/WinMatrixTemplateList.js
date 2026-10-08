const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseFrame = require('../../../../system/controls/WiseFrame');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

const WinMatrixTemplateEdit = require('./WinMatrixTemplateEdit');
const RecruitmentApiRepository = require('../services/RecruitmentApiRepository');
const api = new RecruitmentApiRepository();

class WinMatrixTemplateList extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('TEMPLATE_MATRIKS_PENILAIAN_WISE_RECRUITMENT');
    this.appIcon = options.appIcon || '📊';
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
      id: 'frameMatrixTplActions',
      style: { display: 'flex', gap: '8px', marginBottom: '10px' }
    });

    actionToolbar.addControl(new WiseButton(WiseI18n.t('TAMBAH_MATRIKS_2'), {
      id: 'btnMatrixTplAdd',
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('EDIT_MATRIKS_2'), {
      id: 'btnMatrixTplEdit',
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('HAPUS_MATRIKS_2'), {
      id: 'btnMatrixTplDelete',
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
      id: 'btnMatrixTplRefresh',
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
      id: 'dtMatrixTemplates',
      pageSize: 15,
      currentPage: 1,
      multiSelect: false,
      style: { width: '100%' },
      onRowSelect: this.onRowSelect.bind(this)
    });

    this.dtTemplates.columns = [
      { key: 'code', title: WiseI18n.t('KODE'), width: '130px' },
      { key: 'name', title: WiseI18n.t('NAMA_TEMPLATE_MATRIKS_PENILAIAN'), width: '340px' },
      { key: 'passScoreBadge', title: WiseI18n.t('PASSING_SCORE'), width: '130px' },
      { key: 'criteriaCount', title: WiseI18n.t('JUMLAH_KRITERIA'), width: '130px' },
      { key: 'description', title: WiseI18n.t('DESKRIPSI_PANDUAN'), width: '340px' },
      { key: 'statusBadge', title: WiseI18n.t('STATUS'), width: '110px' }
    ];

    this.dtTemplates.filterControls = [
      {
        id: 'search',
        type: 'text',
        label: WiseI18n.t('PENCARIAN'),
        placeholder: WiseI18n.t('CARI_NAMA_TEMPLATE_MATRIKS'),
        onChange: this.onSearchChanged.bind(this)
      }
    ];

    this.dtTemplates.contextMenuItems = [
      { id: 'edit', label: WiseI18n.t('EDIT_MATRIKS'), icon: '✏️', onClick: this.onEditClick.bind(this) },
      { id: 'delete', label: WiseI18n.t('HAPUS_MATRIKS'), icon: '🗑️', onClick: this.onDeleteClick.bind(this) }
    ];

    this.addControl(this.dtTemplates);

    // 3. Status Bar
    this.lblStatus = new WiseLabel(WiseI18n.t('MEMUAT_MATRIKS'), {
      id: 'lblMatrixTplStatus',
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
      if (this.lblStatus) this.lblStatus.setText(WiseI18n.t('MEMUAT_TEMPLATE_MATRIKS'));
      const res = await api.listMatrixTemplates({ search: searchQuery });
      const rows = res.rows || [];
      this.cachedTemplates = rows;

      this.dtTemplates.data = rows.map((tpl) => {
        const criteria = Array.isArray(tpl.criteria) ? tpl.criteria : [];
        return {
          id: tpl.id,
          code: tpl.code || `MTX-${tpl.id}`,
          name: tpl.name || '-',
          passScoreBadge: `🎯 ≥ ${tpl.passScore || 75}`,
          criteriaCount: `📊 ${criteria.length} ${WiseI18n.t('BUTIR')}`,
          description: tpl.description || '-',
          statusBadge: tpl.isActive ? WiseI18n.t('AKTIF') : WiseI18n.t('NONAKTIF'),
          _raw: tpl
        };
      });
      this.dtTemplates.totalCount = rows.length;

      if (this.lblStatus) {
        this.lblStatus.setText(`${WiseI18n.t('MENAMPILKAN')} ${rows.length} ${WiseI18n.t('TEMPLATE_MATRIKS_PENILAIAN_3')}`);
      }
    } catch (err) {
      if (this.lblStatus) this.lblStatus.setText(`${WiseI18n.t('GAGAL_MEMUAT_MATRIKS')} ${err.message}`);
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
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
    await this.openWindow(WinMatrixTemplateEdit, {
      templateId: null,
      onSaved: () => this.loadTable()
    });
  }

  async onEditClick() {
    if (!this.selectedTemplate) {
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_BARIS_MATRIKS_YANG_INGIN_DIEDIT'), 'warning');
      return;
    }
    await this.openWindow(WinMatrixTemplateEdit, {
      templateId: this.selectedTemplate.id,
      onSaved: () => this.loadTable()
    });
  }

  async onDeleteClick() {
    if (!this.selectedTemplate) {
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_BARIS_MATRIKS_YANG_INGIN_DIHAPUS'), 'warning');
      return;
    }

    const conf = await this.confirm(
      WiseI18n.t('KONFIRMASI_HAPUS'),
      `${WiseI18n.t('APAKAH_ANDA_YAKIN_INGIN_MENGHAPUS_TEMPLATE_MATRIKS')} "${this.selectedTemplate.name}"?`
    );
    if (!conf) return;

    try {
      await api.deleteMatrixTemplate(this.selectedTemplate.id);
      this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('TEMPLATE_MATRIKS_BERHASIL_DIHAPUS'), 'success');
      this.selectedTemplate = null;
      await this.loadTable();
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

module.exports = WinMatrixTemplateList;
