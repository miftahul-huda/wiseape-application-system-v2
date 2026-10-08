const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseNumericBox = require('../../../../system/controls/WiseNumericBox');
const WiseTextArea = require('../../../../system/controls/WiseTextArea');
const WiseComboBox = require('../../../../system/controls/WiseComboBox');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseFrame = require('../../../../system/controls/WiseFrame');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

const WinMatrixCriterionEdit = require('./WinMatrixCriterionEdit');
const RecruitmentApiRepository = require('../services/RecruitmentApiRepository');
const api = new RecruitmentApiRepository();

class WinMatrixTemplateEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.templateId ? WiseI18n.t('EDIT_TEMPLATE_MATRIKS_PENILAIAN') : WiseI18n.t('TAMBAH_TEMPLATE_MATRIKS_PENILAIAN_BARU');
    this.appIcon = options.appIcon || '📊';
    this.width = options.width || '84%';
    this.height = options.height || '84%';
    this.centered = true;

    this.selectedTemplateId = options.templateId || null;
    this.onSavedCallback = options.onSaved || null;

    this.currentTemplate = null;
    this.criteriaList = [];
  }

  onWindowInit() {
    this.controls = [];

    const inputBorderStyle = { border: '1px solid #94a3b8', borderRadius: '6px' };
    const labelStyle = { fontWeight: 600, color: '#334155', display: 'block', marginBottom: '2px', lineHeight: '1.2' };

    // 1. Template Master Fields Layout (3 cols x 2 rows)
    const masterGrid = new WiseTableLayout({
      rows: 2,
      columns: 3,
      id: 'tblMatrixMasterGrid',
      style: { tableLayout: 'fixed', width: '100%', borderSpacing: '8px', marginBottom: '12px' }
    });

    const cellName = new WiseFrame('', { id: 'frmMatrixName' });
    cellName.addControl(new WiseLabel(WiseI18n.t('NAMA_TEMPLATE_MATRIKS'), { id: 'lblMatrixName', style: labelStyle }));
    this.txtName = new WiseTextBox('', {
      id: 'txtMatrixName',
      placeholder: WiseI18n.t('CONTOH_MATRIKS_WAWANCARA_HRD_BEHAVIORAL_CULTURE_FIT'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellName.addControl(this.txtName);
    masterGrid.setCell(0, 0, cellName);

    const cellPass = new WiseFrame('', { id: 'frmMatrixPass' });
    cellPass.addControl(new WiseLabel(WiseI18n.t('PASSING_SCORE_AMBANG_LOLOS'), { id: 'lblMatrixPass', style: labelStyle }));
    this.numPassScore = new WiseNumericBox(75, {
      id: 'numMatrixPassScore',
      min: 1,
      max: 100,
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellPass.addControl(this.numPassScore);
    masterGrid.setCell(0, 1, cellPass);

    const cellActive = new WiseFrame('', { id: 'frmMatrixActive' });
    cellActive.addControl(new WiseLabel(WiseI18n.t('STATUS_AKTIF'), { id: 'lblMatrixActive', style: labelStyle }));
    this.cmbIsActive = new WiseComboBox('true', {
      id: 'cmbMatrixActive',
      items: [
        { value: 'true', label: WiseI18n.t('AKTIF') },
        { value: 'false', label: WiseI18n.t('NONAKTIF') }
      ],
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellActive.addControl(this.cmbIsActive);
    masterGrid.setCell(0, 2, cellActive);

    const cellCode = new WiseFrame('', { id: 'frmMatrixCode' });
    cellCode.addControl(new WiseLabel(WiseI18n.t('KODE_MATRIKS_OPSIONAL'), { id: 'lblMatrixCode', style: labelStyle }));
    this.txtCode = new WiseTextBox('', {
      id: 'txtMatrixCode',
      placeholder: WiseI18n.t('CONTOH_MTX_HRD_01'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellCode.addControl(this.txtCode);
    masterGrid.setCell(1, 0, cellCode);

    const cellDesc = new WiseFrame('', { id: 'frmMatrixDesc' });
    cellDesc.addControl(new WiseLabel(WiseI18n.t('DESKRIPSI_PANDUAN_UMUM_MATRIKS'), { id: 'lblMatrixDesc', style: labelStyle }));
    this.txtDesc = new WiseTextBox('', {
      id: 'txtMatrixDesc',
      placeholder: WiseI18n.t('TUJUAN_MATRIKS_DAN_KELOMPOK_PERAN_SASARAN'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellDesc.addControl(this.txtDesc);
    masterGrid.setCell(1, 1, cellDesc);

    this.addControl(masterGrid);

    // 2. Sub-records Section Title & Toolbar
    this.addControl(new WiseLabel(WiseI18n.t('KRITERIA_PENILAIAN_PEMBOBOTAN_NILAI_HASIL_SELEKSI'), {
      id: 'lblSubCriteriaTitle',
      style: { fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '8px' }
    }));

    const critToolbar = new WiseFrame('', {
      id: 'frmMatrixCritToolbar',
      style: { display: 'flex', gap: '8px', marginBottom: '8px' }
    });

    critToolbar.addControl(new WiseButton(WiseI18n.t('TAMBAH_KRITERIA_2'), {
      id: 'btnCritAdd',
      onClick: this.onAddCriterionClick.bind(this),
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

    critToolbar.addControl(new WiseButton(WiseI18n.t('EDIT_KRITERIA_2'), {
      id: 'btnCritEdit',
      onClick: this.onEditCriterionClick.bind(this),
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

    critToolbar.addControl(new WiseButton(WiseI18n.t('HAPUS_KRITERIA_2'), {
      id: 'btnCritDelete',
      onClick: this.onDeleteCriterionClick.bind(this),
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

    this.addControl(critToolbar);

    // 3. Data Table for Criteria
    this.dtCriteria = new WiseDataTable({
      id: 'dtMatrixCriteria',
      pageSize: 20,
      currentPage: 1,
      multiSelect: false,
      style: { width: '100%', marginBottom: '14px' }
    });

    this.dtCriteria.columns = [
      { key: 'no', title: WiseI18n.t('NO'), width: '60px' },
      { key: 'criterion', title: WiseI18n.t('KRITERIA_PENILAIAN_KOMPETENSI'), width: '320px' },
      { key: 'weightBadge', title: WiseI18n.t('BOBOT'), width: '110px' },
      { key: 'scaleType', title: WiseI18n.t('SKALA_NILAI'), width: '140px' },
      { key: 'description', title: WiseI18n.t('PANDUAN_EVALUATOR'), width: '380px' }
    ];

    this.addControl(this.dtCriteria);

    // 4. Bottom Action Buttons Bar
    const bottomBar = new WiseFrame('', {
      id: 'frmMatrixBottomBar',
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #e2e8f0'
      }
    });

    bottomBar.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnMatrixCancel',
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

    bottomBar.addControl(new WiseButton(WiseI18n.t('SIMPAN_TEMPLATE_MATRIKS'), {
      id: 'btnMatrixSave',
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
      if (this.selectedTemplateId) {
        const tpl = await api.getMatrixTemplate(this.selectedTemplateId);
        this.currentTemplate = tpl;

        if (this.txtName) this.txtName.setValue(tpl.name || '');
        if (this.txtCode) this.txtCode.setValue(tpl.code || '');
        if (this.numPassScore) this.numPassScore.setValue(tpl.passScore || 75);
        if (this.txtDesc) this.txtDesc.setValue(tpl.description || '');
        if (this.cmbIsActive) this.cmbIsActive.setValue(tpl.isActive ? 'true' : 'false');

        this.criteriaList = Array.isArray(tpl.criteria) ? [...tpl.criteria] : [];
        this.renderCriteriaTable();
      }
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  renderCriteriaTable() {
    if (!this.dtCriteria) return;

    this.dtCriteria.data = this.criteriaList.map((c, idx) => ({
      no: idx + 1,
      criterion: c.criterion || '-',
      weightBadge: `${c.weight || 0} %`,
      scaleType: c.scaleType || '1-100',
      description: c.description || '-',
      _raw: c
    }));
    this.dtCriteria.totalCount = this.criteriaList.length;
  }

  async onAddCriterionClick() {
    await this.openWindow(WinMatrixCriterionEdit, {
      data: null,
      onSaved: (newCrit) => {
        this.criteriaList.push(newCrit);
        this.renderCriteriaTable();
      }
    });
  }

  async onEditCriterionClick() {
    const idx = this.dtCriteria.selectedRowIndex;
    if (idx === null || idx === undefined || idx < 0 || !this.criteriaList[idx]) {
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_KRITERIA_YANG_INGIN_DIEDIT'), 'warning');
      return;
    }

    const targetCrit = this.criteriaList[idx];
    await this.openWindow(WinMatrixCriterionEdit, {
      data: targetCrit,
      onSaved: (updatedCrit) => {
        this.criteriaList[idx] = updatedCrit;
        this.renderCriteriaTable();
      }
    });
  }

  async onDeleteCriterionClick() {
    const idx = this.dtCriteria.selectedRowIndex;
    if (idx === null || idx === undefined || idx < 0 || !this.criteriaList[idx]) {
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_KRITERIA_YANG_INGIN_DIHAPUS'), 'warning');
      return;
    }

    this.criteriaList.splice(idx, 1);
    this.renderCriteriaTable();
  }

  async onSaveClick() {
    const name = this.txtName ? this.txtName.value.trim() : '';
    if (!name) {
      this.showInfo(WiseI18n.t('VALIDASI_FORM'), WiseI18n.t('NAMA_TEMPLATE_MATRIKS_WAJIB_DIISI'), 'warning');
      return;
    }

    const payload = {
      name,
      code: this.txtCode ? this.txtCode.value.trim() : null,
      description: this.txtDesc ? this.txtDesc.value.trim() : '',
      passScore: this.numPassScore ? parseFloat(this.numPassScore.value) || 75 : 75,
      isActive: this.cmbIsActive ? this.cmbIsActive.value === 'true' : true,
      criteria: this.criteriaList
    };

    try {
      if (this.selectedTemplateId) {
        await api.updateMatrixTemplate(this.selectedTemplateId, payload);
        this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('TEMPLATE_MATRIKS_PENILAIAN_BERHASIL_DIPERBARUI'), 'success');
      } else {
        await api.createMatrixTemplate(payload);
        this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('TEMPLATE_MATRIKS_PENILAIAN_BERHASIL_DIBUAT'), 'success');
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

module.exports = WinMatrixTemplateEdit;
