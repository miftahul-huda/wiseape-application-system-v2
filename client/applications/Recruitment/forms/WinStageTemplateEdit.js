const WiseWindow = require('../../../system/WiseWindow');
const WiseLabel = require('../../../system/controls/WiseLabel');
const WiseButton = require('../../../system/controls/WiseButton');
const WiseTextBox = require('../../../system/controls/WiseTextBox');
const WiseTextArea = require('../../../system/controls/WiseTextArea');
const WiseComboBox = require('../../../system/controls/WiseComboBox');
const WiseDataTable = require('../../../system/controls/WiseDataTable');
const WiseFrame = require('../../../system/controls/WiseFrame');
const WiseTableLayout = require('../../../system/controls/WiseTableLayout');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../system/WiseI18n');

const WinStageItemEdit = require('./WinStageItemEdit');
const RecruitmentApiRepository = require('../services/RecruitmentApiRepository');
const api = new RecruitmentApiRepository();

class WinStageTemplateEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.templateId ? 'Edit Template Proses Recruitment' : 'Tambah Template Proses Recruitment Baru';
    this.appIcon = options.appIcon || '⚙️';
    this.width = options.width || '82%';
    this.height = options.height || '82%';
    this.centered = true;

    this.selectedTemplateId = options.templateId || null;
    this.onSavedCallback = options.onSaved || null;

    this.currentTemplate = null;
    this.matrixTemplates = [];
    this.stagesList = [];
  }

  t(key) {
    if (typeof WiseI18n !== 'undefined' && WiseI18n && typeof WiseI18n.t === 'function') {
      return WiseI18n.t(key);
    }
    return key;
  }

  onWindowInit() {
    this.controls = [];

    const inputBorderStyle = { border: '1px solid #94a3b8', borderRadius: '6px' };
    const labelStyle = { fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' };

    // 1. Template Master Fields Layout (2 cols x 2 rows)
    const masterGrid = new WiseTableLayout({
      rows: 2,
      columns: 2,
      id: 'tblStageMasterGrid',
      style: { tableLayout: 'fixed', width: '100%', borderSpacing: '8px', marginBottom: '12px' }
    });

    const cellName = new WiseFrame('', { id: 'frmTplName' });
    cellName.addControl(new WiseLabel(this.t('Nama Template Alur *'), { id: 'lblTplName', style: labelStyle }));
    this.txtName = new WiseTextBox('', {
      id: 'txtTplName',
      placeholder: 'Contoh: Alur Seleksi Software Engineer & IT',
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellName.addControl(this.txtName);
    masterGrid.setCell(0, 0, cellName);

    const cellActive = new WiseFrame('', { id: 'frmTplActive' });
    cellActive.addControl(new WiseLabel(this.t('Status Aktif'), { id: 'lblTplActive', style: labelStyle }));
    this.cmbIsActive = new WiseComboBox('true', {
      id: 'cmbTplActive',
      items: [
        { value: 'true', label: '🟢 Aktif' },
        { value: 'false', label: '🔴 Nonaktif' }
      ],
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellActive.addControl(this.cmbIsActive);
    masterGrid.setCell(0, 1, cellActive);

    const cellCode = new WiseFrame('', { id: 'frmTplCode' });
    cellCode.addControl(new WiseLabel(this.t('Kode Template (Opsional)'), { id: 'lblTplCode', style: labelStyle }));
    this.txtCode = new WiseTextBox('', {
      id: 'txtTplCode',
      placeholder: 'Contoh: STG-TECH-01',
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellCode.addControl(this.txtCode);
    masterGrid.setCell(1, 0, cellCode);

    const cellDesc = new WiseFrame('', { id: 'frmTplDesc' });
    cellDesc.addControl(new WiseLabel(this.t('Deskripsi / Peruntukan Template'), { id: 'lblTplDesc', style: labelStyle }));
    this.txtDesc = new WiseTextBox('', {
      id: 'txtTplDesc',
      placeholder: 'Penjelasan tujuan atau profil pelamar yang cocok...',
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellDesc.addControl(this.txtDesc);
    masterGrid.setCell(1, 1, cellDesc);

    this.addControl(masterGrid);

    // 2. Sub-records Section Title & Toolbar
    this.addControl(new WiseLabel('Daftar Tahapan Proses dalam Template (Interview User, HRD, Tes, dll)', {
      id: 'lblSubStagesTitle',
      style: { fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '8px' }
    }));

    const stageToolbar = new WiseFrame('', {
      id: 'frmTemplateStageToolbar',
      style: { display: 'flex', gap: '8px', marginBottom: '8px' }
    });

    stageToolbar.addControl(new WiseButton(this.t('➕ Tambah Tahapan'), {
      id: 'btnTplStageAdd',
      onClick: this.onAddStageClick.bind(this),
      style: {
        background: 'var(--accent)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '7px 14px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    stageToolbar.addControl(new WiseButton(this.t('✏️ Edit Tahapan'), {
      id: 'btnTplStageEdit',
      onClick: this.onEditStageClick.bind(this),
      style: {
        background: 'var(--accent-dark)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '7px 14px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    stageToolbar.addControl(new WiseButton(this.t('🗑️ Hapus Tahapan'), {
      id: 'btnTplStageDelete',
      onClick: this.onDeleteStageClick.bind(this),
      style: {
        background: '#ef4444',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '7px 14px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    this.addControl(stageToolbar);

    // 3. Data Table for Stages in Template
    this.dtStages = new WiseDataTable({
      id: 'dtTemplateStages',
      pageSize: 20,
      currentPage: 1,
      multiSelect: false,
      style: { width: '100%', marginBottom: '14px' }
    });

    this.dtStages.columns = [
      { key: 'order', title: 'Urutan', width: '80px' },
      { key: 'name', title: 'Nama Tahapan', width: '280px' },
      { key: 'matrixName', title: 'Matriks Penilaian', width: '260px' },
      { key: 'description', title: 'Deskripsi / Panduan', width: '320px' }
    ];

    this.addControl(this.dtStages);

    // 4. Bottom Action Buttons Bar
    const bottomBar = new WiseFrame('', {
      id: 'frmTplBottomBar',
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #e2e8f0'
      }
    });

    bottomBar.addControl(new WiseButton(this.t('Batal'), {
      id: 'btnTplCancel',
      onClick: () => this.close(),
      style: {
        background: '#e2e8f0',
        color: '#334155',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 18px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    bottomBar.addControl(new WiseButton(this.t('💾 Simpan Template'), {
      id: 'btnTplSave',
      onClick: this.onSaveClick.bind(this),
      style: {
        background: 'var(--accent)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 20px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    this.addControl(bottomBar);

    return this;
  }

  async loadInitialData() {
    try {
      const matrixRes = await api.listMatrixTemplates();
      this.matrixTemplates = matrixRes.rows || [];

      if (this.selectedTemplateId) {
        const tpl = await api.getStageTemplate(this.selectedTemplateId);
        this.currentTemplate = tpl;

        if (this.txtName) this.txtName.setValue(tpl.name || '');
        if (this.txtCode) this.txtCode.setValue(tpl.code || '');
        if (this.txtDesc) this.txtDesc.setValue(tpl.description || '');
        if (this.cmbIsActive) this.cmbIsActive.setValue(tpl.isActive ? 'true' : 'false');

        this.stagesList = Array.isArray(tpl.stages) ? [...tpl.stages] : [];
        this.renderStagesTable();
      }
    } catch (err) {
      this.showInfo('Error', err.message, 'error');
    }
  }

  renderStagesTable() {
    if (!this.dtStages) return;
    const sorted = [...this.stagesList].sort((a, b) => (a.order || 0) - (b.order || 0));
    this.stagesList = sorted;

    this.dtStages.data = sorted.map((s, idx) => ({
      order: s.order || (idx + 1),
      name: s.name || '-',
      matrixName: s.matrixTemplateName || (s.matrixTemplateId ? `Matriks #${s.matrixTemplateId}` : '-'),
      description: s.description || '-',
      _raw: s
    }));
    this.dtStages.totalCount = sorted.length;
  }

  async onAddStageClick() {
    await this.openWindow(WinStageItemEdit, {
      data: null,
      matrixTemplates: this.matrixTemplates,
      onSaved: (newStage) => {
        newStage.order = this.stagesList.length + 1;
        this.stagesList.push(newStage);
        this.renderStagesTable();
      }
    });
  }

  async onEditStageClick() {
    const idx = this.dtStages.selectedRowIndex;
    if (idx === null || idx === undefined || idx < 0 || !this.stagesList[idx]) {
      this.showInfo('Pemberitahuan', 'Pilih salah satu tahapan yang ingin diedit.', 'warning');
      return;
    }

    const targetStage = this.stagesList[idx];
    await this.openWindow(WinStageItemEdit, {
      data: targetStage,
      matrixTemplates: this.matrixTemplates,
      onSaved: (updatedStage) => {
        this.stagesList[idx] = updatedStage;
        this.renderStagesTable();
      }
    });
  }

  async onDeleteStageClick() {
    const idx = this.dtStages.selectedRowIndex;
    if (idx === null || idx === undefined || idx < 0 || !this.stagesList[idx]) {
      this.showInfo('Pemberitahuan', 'Pilih salah satu tahapan yang ingin dihapus.', 'warning');
      return;
    }

    this.stagesList.splice(idx, 1);
    this.renderStagesTable();
  }

  async onSaveClick() {
    const name = this.txtName ? this.txtName.value.trim() : '';
    if (!name) {
      this.showInfo('Validasi Form', 'Nama template alur proses wajib diisi.', 'warning');
      return;
    }

    const payload = {
      name,
      code: this.txtCode ? this.txtCode.value.trim() : null,
      description: this.txtDesc ? this.txtDesc.value.trim() : '',
      isActive: this.cmbIsActive ? this.cmbIsActive.value === 'true' : true,
      stages: this.stagesList
    };

    try {
      if (this.selectedTemplateId) {
        await api.updateStageTemplate(this.selectedTemplateId, payload);
        this.showInfo('Sukses', 'Template proses recruitment berhasil diperbarui.', 'success');
      } else {
        await api.createStageTemplate(payload);
        this.showInfo('Sukses', 'Template proses recruitment berhasil dibuat.', 'success');
      }

      if (typeof this.onSavedCallback === 'function') {
        this.onSavedCallback();
      }

      this.close();
    } catch (err) {
      this.showInfo('Gagal Menyimpan', err.message, 'error');
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinStageTemplateEdit;
