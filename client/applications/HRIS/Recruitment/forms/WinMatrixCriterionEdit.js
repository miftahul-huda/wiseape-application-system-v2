const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseNumericBox = require('../../../../system/controls/WiseNumericBox');
const WiseTextArea = require('../../../../system/controls/WiseTextArea');
const WiseComboBox = require('../../../../system/controls/WiseComboBox');
const WiseFrame = require('../../../../system/controls/WiseFrame');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

class WinMatrixCriterionEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.data ? WiseI18n.t('EDIT_KRITERIA_PENILAIAN_MATRIKS') : WiseI18n.t('TAMBAH_KRITERIA_PENILAIAN_MATRIKS');
    this.appIcon = options.appIcon || '📊';
    this.width = options.width || '540';
    this.height = options.height || '440';
    this.centered = true;

    this.criterionData = options.data ? { ...options.data } : null;
    this.onSavedCallback = options.onSaved || null;
  }

  onWindowInit() {
    this.controls = [];

    const inputBorderStyle = { border: '1px solid #94a3b8', borderRadius: '6px' };
    const labelStyle = { fontWeight: 600, color: '#334155', display: 'block', marginBottom: '2px', lineHeight: '1.2' };

    const formLayout = new WiseTableLayout({
      rows: 4,
      columns: 1,
      id: 'tblCriterionFormLayout',
      style: { width: '100%', marginBottom: '16px' }
    });

    // 1. Nama Kriteria
    const cellName = new WiseFrame('', { id: 'frmCritName' });
    cellName.addControl(new WiseLabel(WiseI18n.t('KRITERIA_PENILAIAN_KOMPETENSI_2'), { id: 'lblCritName', style: labelStyle }));
    this.txtCriterion = new WiseTextBox(this.criterionData ? this.criterionData.criterion : '', {
      id: 'txtCriterionName',
      placeholder: WiseI18n.t('CONTOH_KEMAMPUAN_ANALISIS_PROBLEM_SOLVING_COMMUNICATION'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellName.addControl(this.txtCriterion);
    formLayout.setCell(0, 0, cellName);

    // 2. Bobot Persentase
    const cellWeight = new WiseFrame('', { id: 'frmCritWeight' });
    cellWeight.addControl(new WiseLabel(WiseI18n.t('BOBOT_PENILAIAN'), { id: 'lblCritWeight', style: labelStyle }));
    this.numWeight = new WiseNumericBox(this.criterionData && this.criterionData.weight !== undefined ? this.criterionData.weight : 20, {
      id: 'numCritWeight',
      min: 1,
      max: 100,
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellWeight.addControl(this.numWeight);
    formLayout.setCell(1, 0, cellWeight);

    // 3. Skala Penilaian
    const cellScale = new WiseFrame('', { id: 'frmCritScale' });
    cellScale.addControl(new WiseLabel(WiseI18n.t('SKALA_NILAI'), { id: 'lblCritScale', style: labelStyle }));
    this.cmbScale = new WiseComboBox(this.criterionData && this.criterionData.scaleType ? this.criterionData.scaleType : '1-100', {
      id: 'cmbCritScale',
      items: [
        { value: '1-100', label: WiseI18n.t('SKALA_1_100_PERSENTIL_POIN_STANDAR') },
        { value: '1-10', label: WiseI18n.t('SKALA_1_10_PERINGKAT_MENENGAH') },
        { value: '1-5', label: WiseI18n.t('SKALA_1_5_LIKERT_RATING_BINTANG') }
      ],
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellScale.addControl(this.cmbScale);
    formLayout.setCell(2, 0, cellScale);

    // 4. Panduan Penilaian / Deskripsi
    const cellDesc = new WiseFrame('', { id: 'frmCritDesc' });
    cellDesc.addControl(new WiseLabel(WiseI18n.t('PANDUAN_PENILAIAN_EVALUATOR'), { id: 'lblCritDesc', style: labelStyle }));
    this.txtDesc = new WiseTextArea(this.criterionData ? this.criterionData.description : '', {
      id: 'txtCritDesc',
      rows: 3,
      placeholder: WiseI18n.t('TULISKAN_INDIKATOR_PERILAKU_ATAU_TOLOK_UKUR_NILAI_YANG'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellDesc.addControl(this.txtDesc);
    formLayout.setCell(3, 0, cellDesc);

    this.addControl(formLayout);

    // Action Buttons
    const btnContainer = new WiseFrame('', {
      id: 'frmCritActions',
      style: { display: 'flex', justifyContent: 'flex-end', gap: '8px' }
    });

    btnContainer.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnCritCancel',
      onClick: () => this.close(),
      style: {
        background: '#e2e8f0',
        color: '#334155',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    btnContainer.addControl(new WiseButton(WiseI18n.t('SIMPAN_KRITERIA'), {
      id: 'btnCritSave',
      onClick: this.onSaveClick.bind(this),
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

    this.addControl(btnContainer);

    return this;
  }

  onSaveClick() {
    const criterion = this.txtCriterion ? this.txtCriterion.value.trim() : '';
    if (!criterion) {
      this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('NAMA_KRITERIA_PENILAIAN_WAJIB_DIISI'), 'warning');
      return;
    }

    const weight = this.numWeight ? parseFloat(this.numWeight.value) || 20 : 20;
    const scaleType = this.cmbScale ? this.cmbScale.value : '1-100';
    let maxScore = 100;
    if (scaleType === '1-10') maxScore = 10;
    if (scaleType === '1-5') maxScore = 5;

    const result = {
      id: this.criterionData ? this.criterionData.id : `crit_${Date.now()}`,
      criterion,
      weight,
      scaleType,
      minScore: 0,
      maxScore,
      description: this.txtDesc ? this.txtDesc.value.trim() : ''
    };

    if (typeof this.onSavedCallback === 'function') {
      this.onSavedCallback(result);
    }

    this.close();
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinMatrixCriterionEdit;
