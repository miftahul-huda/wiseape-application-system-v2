import {
  WiseWindow,
  WiseLabel,
  WiseButton,
  WiseTextBox,
  WiseTextArea,
  WiseComboBox,
  WiseDataTable,
  WiseFrame,
  WiseTableLayout,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

import WinStageItemEdit from './WinStageItemEdit';
import RecruitmentApiRepository from '../services/RecruitmentApiRepository';
const api = new RecruitmentApiRepository();

class WinStageTemplateEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.templateId ? WiseI18n.t('EDIT_TEMPLATE_PROSES_RECRUITMENT') : WiseI18n.t('TAMBAH_TEMPLATE_PROSES_RECRUITMENT_BARU');
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

  onWindowInit() {
    this.controls = [];

    const inputBorderStyle = { border: '1px solid #94a3b8', borderRadius: '6px' };

    // 1. Template Master Fields Layout (2 cols x 2 rows)
    const masterGrid = new WiseTableLayout({
      rows: 2,
      columns: 2,
      id: 'tblStageMasterGrid',
      style: { tableLayout: 'fixed', width: '100%', borderSpacing: '8px', marginBottom: '12px' }
    });

    this.txtName = new WiseTextBox('', {
      id: 'txtTplName',
      label: WiseI18n.t('NAMA_TEMPLATE_ALUR'),
      datafield: 'name',
      placeholder: WiseI18n.t('CONTOH_ALUR_SELEKSI_SOFTWARE_ENGINEER_IT'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    masterGrid.setCell(0, 0, this.txtName);

    this.cmbIsActive = new WiseComboBox('true', {
      id: 'cmbTplActive',
      label: WiseI18n.t('STATUS_AKTIF'),
      datafield: 'isActive',
      items: [
        { value: 'true', label: WiseI18n.t('AKTIF') },
        { value: 'false', label: WiseI18n.t('NONAKTIF') }
      ],
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    masterGrid.setCell(0, 1, this.cmbIsActive);

    this.txtCode = new WiseTextBox('', {
      id: 'txtTplCode',
      label: WiseI18n.t('KODE_TEMPLATE_OPSIONAL'),
      datafield: 'code',
      placeholder: WiseI18n.t('CONTOH_STG_TECH_01'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    masterGrid.setCell(1, 0, this.txtCode);

    this.txtDesc = new WiseTextBox('', {
      id: 'txtTplDesc',
      label: WiseI18n.t('DESKRIPSI_PERUNTUKAN_TEMPLATE'),
      datafield: 'description',
      placeholder: WiseI18n.t('PENJELASAN_TUJUAN_ATAU_PROFIL_PELAMAR_YANG_COCOK'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    masterGrid.setCell(1, 1, this.txtDesc);

    this.addControl(masterGrid);

    // 2. Sub-records Section Title & Toolbar
    this.addControl(new WiseLabel(WiseI18n.t('DAFTAR_TAHAPAN_PROSES_DALAM_TEMPLATE_INTERVIEW_USER_HRD_TES'), {
      id: 'lblSubStagesTitle',
      style: { fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '8px' }
    }));

    const stageToolbar = new WiseFrame('', {
      id: 'frmTemplateStageToolbar',
      style: { display: 'flex', gap: '8px', marginBottom: '8px' }
    });

    stageToolbar.addControl(new WiseButton(WiseI18n.t('TAMBAH_TAHAPAN'), {
      id: 'btnTplStageAdd',
      onClick: this.onAddStageClick.bind(this)
    }));

    stageToolbar.addControl(new WiseButton(WiseI18n.t('EDIT_TAHAPAN'), {
      id: 'btnTplStageEdit',
      onClick: this.onEditStageClick.bind(this),
      style: {
        background: 'var(--accent-dark)',
        color: '#ffffff'
      }
    }));

    stageToolbar.addControl(new WiseButton(WiseI18n.t('HAPUS_TAHAPAN'), {
      id: 'btnTplStageDelete',
      onClick: this.onDeleteStageClick.bind(this),
      style: {
        background: '#ef4444',
        color: '#ffffff'
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
      { key: 'order', title: WiseI18n.t('URUTAN'), width: '80px' },
      { key: 'name', title: WiseI18n.t('NAMA_TAHAPAN'), width: '280px' },
      { key: 'matrixName', title: WiseI18n.t('MATRIKS_PENILAIAN'), width: '260px' },
      { key: 'description', title: WiseI18n.t('DESKRIPSI_PANDUAN'), width: '320px' }
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

    bottomBar.addControl(new WiseButton(WiseI18n.t('SIMPAN_TEMPLATE'), {
      id: 'btnTplSave',
      onClick: this.onSaveClick.bind(this)
    }));

    bottomBar.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnTplCancel',
      onClick: () => this.close(),
      style: {
        background: '#e2e8f0',
        color: '#334155'
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

        this.populate(tpl);

        this.stagesList = Array.isArray(tpl.stages) ? [...tpl.stages] : [];
        this.renderStagesTable();
      }
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
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
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_TAHAPAN_YANG_INGIN_DIEDIT'), 'warning');
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
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_TAHAPAN_YANG_INGIN_DIHAPUS'), 'warning');
      return;
    }

    this.stagesList.splice(idx, 1);
    this.renderStagesTable();
  }

  async onSaveClick() {
    const values = this.getValues();
    const name = (values.name || '').trim();
    if (!name) {
      this.showInfo(WiseI18n.t('VALIDASI_FORM'), WiseI18n.t('NAMA_TEMPLATE_ALUR_PROSES_WAJIB_DIISI'), 'warning');
      return;
    }

    const payload = {
      name,
      code: values.code ? values.code.trim() : null,
      description: (values.description || '').trim(),
      isActive: values.isActive !== 'false' && values.isActive !== false,
      stages: this.stagesList
    };

    try {
      if (this.selectedTemplateId) {
        await api.updateStageTemplate(this.selectedTemplateId, payload);
        this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('TEMPLATE_PROSES_RECRUITMENT_BERHASIL_DIPERBARUI'), 'success');
      } else {
        await api.createStageTemplate(payload);
        this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('TEMPLATE_PROSES_RECRUITMENT_BERHASIL_DIBUAT'), 'success');
      }

      if (typeof this.onSavedCallback === 'function') {
        this.onSavedCallback();
      }

      this.close();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENYIMPAN'), err.message, 'error');
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

export default WinStageTemplateEdit;
