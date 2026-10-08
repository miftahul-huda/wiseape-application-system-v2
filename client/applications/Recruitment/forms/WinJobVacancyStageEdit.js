const WiseWindow = require('../../../system/WiseWindow');
const WiseLabel = require('../../../system/controls/WiseLabel');
const WiseButton = require('../../../system/controls/WiseButton');
const WiseTextBox = require('../../../system/controls/WiseTextBox');
const WiseNumericBox = require('../../../system/controls/WiseNumericBox');
const WiseTextArea = require('../../../system/controls/WiseTextArea');
const WiseComboBox = require('../../../system/controls/WiseComboBox');
const WiseFrame = require('../../../system/controls/WiseFrame');
const WiseTableLayout = require('../../../system/controls/WiseTableLayout');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../system/WiseI18n');

class WinJobVacancyStageEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.data ? 'Edit Tahapan Proses Seleksi' : 'Tambah Tahapan Proses Seleksi';
    this.appIcon = options.appIcon || '⚙️';
    this.width = options.width || '560';
    this.height = options.height || '460';
    this.centered = true;

    this.stageData = options.data ? { ...options.data } : null;
    this.matrixTemplates = options.matrixTemplates || [];
    this.onSavedCallback = options.onSaved || null;
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

    // Form layout (4 rows)
    const formLayout = new WiseTableLayout({
      rows: 4,
      columns: 1,
      id: 'tblStageFormLayout',
      style: { width: '100%', marginBottom: '16px' }
    });

    // 1. Nama Tahapan
    const cellName = new WiseFrame('', { id: 'frmStageName', style: { marginBottom: '8px' } });
    cellName.addControl(new WiseLabel(this.t('Nama Tahapan Proses *'), { id: 'lblStageName', style: labelStyle }));
    this.txtStageName = new WiseTextBox(this.stageData ? this.stageData.name : '', {
      id: 'txtStageName',
      placeholder: 'Contoh: Interview User, Interview HRD, Coding Test, dll.',
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellName.addControl(this.txtStageName);
    formLayout.setCell(0, 0, cellName);

    // 2. Urutan Tahapan
    const cellOrder = new WiseFrame('', { id: 'frmStageOrder', style: { marginBottom: '8px' } });
    cellOrder.addControl(new WiseLabel(this.t('Urutan Tahapan *'), { id: 'lblStageOrder', style: labelStyle }));
    this.numStageOrder = new WiseNumericBox(this.stageData ? this.stageData.order : 1, {
      id: 'numStageOrder',
      min: 1,
      max: 99,
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellOrder.addControl(this.numStageOrder);
    formLayout.setCell(1, 0, cellOrder);

    // 3. Template Matriks Penilaian
    const cellMatrix = new WiseFrame('', { id: 'frmStageMatrix', style: { marginBottom: '8px' } });
    cellMatrix.addControl(new WiseLabel(this.t('Template Matriks Penilaian (Opsional)'), { id: 'lblStageMatrix', style: labelStyle }));
    const matrixItems = [
      { value: '', label: '(Tanpa Matriks Penilaian Khusus)' },
      ...this.matrixTemplates.map((m) => ({ value: String(m.id), label: `${m.name} (${(m.criteria || []).length} kriteria)` }))
    ];
    this.cmbMatrixTemplate = new WiseComboBox(this.stageData && this.stageData.matrixTemplateId ? String(this.stageData.matrixTemplateId) : '', {
      id: 'cmbMatrixTemplate',
      items: matrixItems,
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellMatrix.addControl(this.cmbMatrixTemplate);
    formLayout.setCell(2, 0, cellMatrix);

    // 4. Deskripsi
    const cellDesc = new WiseFrame('', { id: 'frmStageDesc', style: { marginBottom: '8px' } });
    cellDesc.addControl(new WiseLabel(this.t('Deskripsi / Panduan Tahapan'), { id: 'lblStageDesc', style: labelStyle }));
    this.txtStageDesc = new WiseTextArea(this.stageData ? this.stageData.description : '', {
      id: 'txtStageDesc',
      rows: 3,
      placeholder: 'Tuliskan panduan atau ruang lingkup tahapan ini...',
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellDesc.addControl(this.txtStageDesc);
    formLayout.setCell(3, 0, cellDesc);

    this.addControl(formLayout);

    // Action Buttons
    const btnContainer = new WiseFrame('', {
      id: 'frmStageActions',
      style: { display: 'flex', justifyContent: 'flex-end', gap: '8px' }
    });

    btnContainer.addControl(new WiseButton(this.t('Batal'), {
      id: 'btnStageCancel',
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

    btnContainer.addControl(new WiseButton(this.t('💾 Simpan Tahapan'), {
      id: 'btnStageSave',
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
    const name = this.txtStageName ? this.txtStageName.value.trim() : '';
    if (!name) {
      this.showInfo('Validasi', 'Nama tahapan proses wajib diisi.', 'warning');
      return;
    }

    const order = this.numStageOrder ? parseInt(this.numStageOrder.value, 10) || 1 : 1;
    const matrixIdStr = this.cmbMatrixTemplate ? this.cmbMatrixTemplate.value : '';
    const matrixId = matrixIdStr ? parseInt(matrixIdStr, 10) : null;
    const selectedMatrix = this.matrixTemplates.find((m) => String(m.id) === String(matrixIdStr));

    const result = {
      id: this.stageData ? this.stageData.id : `stg_${Date.now()}`,
      name,
      order,
      description: this.txtStageDesc ? this.txtStageDesc.value.trim() : '',
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

module.exports = WinJobVacancyStageEdit;
