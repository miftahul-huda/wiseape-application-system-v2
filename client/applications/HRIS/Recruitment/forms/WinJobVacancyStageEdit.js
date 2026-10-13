import {
  WiseWindow,
  WiseButton,
  WiseTextBox,
  WiseNumericBox,
  WiseTextArea,
  WiseComboBox,
  WiseFrame,
  WiseTableLayout,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

class WinJobVacancyStageEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.data ? WiseI18n.t('EDIT_TAHAPAN_PROSES_SELEKSI') : WiseI18n.t('TAMBAH_TAHAPAN_PROSES_SELEKSI');
    this.appIcon = options.appIcon || '⚙️';
    this.width = options.width || '560';
    this.height = options.height || '440';
    this.centered = true;

    this.stageData = options.data ? { ...options.data } : null;
    this.matrixTemplates = options.matrixTemplates || [];
    this.onSavedCallback = options.onSaved || null;
  }

  onWindowInit() {
    this.controls = [];

    const inputBorderStyle = { border: '1px solid #94a3b8', borderRadius: '6px' };

    // Form layout (4 rows)
    const formLayout = new WiseTableLayout({
      rows: 4,
      columns: 1,
      id: 'tblStageFormLayout',
      style: { width: '100%', marginBottom: '16px' }
    });

    // 1. Nama Tahapan
    this.txtStageName = new WiseTextBox('', {
      id: 'txtStageName',
      label: WiseI18n.t('NAMA_TAHAPAN_PROSES'),
      datafield: 'name',
      placeholder: WiseI18n.t('CONTOH_INTERVIEW_USER_INTERVIEW_HRD_CODING_TEST_DLL'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    formLayout.setCell(0, 0, this.txtStageName);

    // 2. Urutan Tahapan
    this.numStageOrder = new WiseNumericBox(1, {
      id: 'numStageOrder',
      label: WiseI18n.t('URUTAN_TAHAPAN'),
      datafield: 'order',
      min: 1,
      max: 99,
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    formLayout.setCell(1, 0, this.numStageOrder);

    // 3. Template Matriks Penilaian
    const matrixItems = [
      { value: '', label: WiseI18n.t('TANPA_MATRIKS_PENILAIAN_KHUSUS') },
      ...this.matrixTemplates.map((m) => ({ value: String(m.id), label: `${m.name} (${(m.criteria || []).length} kriteria)` }))
    ];
    this.cmbMatrixTemplate = new WiseComboBox('', {
      id: 'cmbMatrixTemplate',
      label: WiseI18n.t('TEMPLATE_MATRIKS_PENILAIAN_OPSIONAL'),
      datafield: 'matrixTemplateId',
      items: matrixItems,
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    formLayout.setCell(2, 0, this.cmbMatrixTemplate);

    // 4. Deskripsi
    this.txtStageDesc = new WiseTextArea('', {
      id: 'txtStageDesc',
      label: WiseI18n.t('DESKRIPSI_PANDUAN_TAHAPAN'),
      datafield: 'description',
      rows: 3,
      placeholder: WiseI18n.t('TULISKAN_PANDUAN_ATAU_RUANG_LINGKUP_TAHAPAN_INI'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    formLayout.setCell(3, 0, this.txtStageDesc);

    this.addControl(formLayout);

    if (this.stageData) {
      this.populate(this.stageData);
    }

    // Action Buttons
    const btnContainer = new WiseFrame('', {
      id: 'frmStageActions',
      style: { display: 'flex', justifyContent: 'flex-end', gap: '8px' }
    });

    btnContainer.addControl(new WiseButton(WiseI18n.t('SIMPAN_TAHAPAN'), {
      id: 'btnStageSave',
      onClick: this.onSaveClick.bind(this)
    }));

    btnContainer.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnStageCancel',
      onClick: () => this.close(),
      style: {
        background: '#e2e8f0',
        color: '#334155'
      }
    }));

    this.addControl(btnContainer);

    return this;
  }

  onSaveClick() {
    const values = this.getValues();
    const name = (values.name || '').trim();
    if (!name) {
      this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('NAMA_TAHAPAN_PROSES_WAJIB_DIISI'), 'warning');
      return;
    }

    const order = parseInt(values.order, 10) || 1;
    const matrixIdStr = values.matrixTemplateId ? String(values.matrixTemplateId) : '';
    const matrixId = matrixIdStr ? parseInt(matrixIdStr, 10) : null;
    const selectedMatrix = this.matrixTemplates.find((m) => String(m.id) === String(matrixIdStr));

    const result = {
      id: this.stageData ? this.stageData.id : `stg_${Date.now()}`,
      name,
      order,
      description: (values.description || '').trim(),
      matrixTemplateId: matrixId,
      matrixTemplateName: selectedMatrix ? selectedMatrix.name : ''
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

export default WinJobVacancyStageEdit;
