import {
  WiseWindow,
  WiseLabel,
  WiseButton,
  WiseTextBox,
  WiseNumericBox,
  WiseTextArea,
  WiseComboBox,
  WiseFrame,
  WiseTableLayout,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

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
    this.txtCriterion = new WiseTextBox('', {
      id: 'txtCriterionName',
      datafield: 'criterion',
      placeholder: WiseI18n.t('CONTOH_KEMAMPUAN_ANALISIS_PROBLEM_SOLVING_COMMUNICATION'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellName.addControl(this.txtCriterion);
    formLayout.setCell(0, 0, cellName);

    // 2. Bobot Persentase
    const cellWeight = new WiseFrame('', { id: 'frmCritWeight' });
    cellWeight.addControl(new WiseLabel(WiseI18n.t('BOBOT_PENILAIAN'), { id: 'lblCritWeight', style: labelStyle }));
    this.numWeight = new WiseNumericBox(20, {
      id: 'numCritWeight',
      datafield: 'weight',
      min: 1,
      max: 100,
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellWeight.addControl(this.numWeight);
    formLayout.setCell(1, 0, cellWeight);

    // 3. Skala Penilaian
    const cellScale = new WiseFrame('', { id: 'frmCritScale' });
    cellScale.addControl(new WiseLabel(WiseI18n.t('SKALA_NILAI'), { id: 'lblCritScale', style: labelStyle }));
    this.cmbScale = new WiseComboBox('1-100', {
      id: 'cmbCritScale',
      datafield: 'scaleType',
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
    this.txtDesc = new WiseTextArea('', {
      id: 'txtCritDesc',
      datafield: 'description',
      rows: 3,
      placeholder: WiseI18n.t('TULISKAN_INDIKATOR_PERILAKU_ATAU_TOLOK_UKUR_NILAI_YANG'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellDesc.addControl(this.txtDesc);
    formLayout.setCell(3, 0, cellDesc);

    this.addControl(formLayout);

    if (this.criterionData) {
      this.populate(this.criterionData);
    }

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
      onClick: this.onSaveClick.bind(this)
    }));

    this.addControl(btnContainer);

    return this;
  }

  onSaveClick() {
    const values = this.getValues();
    const criterion = (values.criterion || '').trim();
    if (!criterion) {
      this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('NAMA_KRITERIA_PENILAIAN_WAJIB_DIISI'), 'warning');
      return;
    }

    const weight = parseFloat(values.weight) || 20;
    const scaleType = values.scaleType || '1-100';
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
      description: (values.description || '').trim()
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

export default WinMatrixCriterionEdit;
