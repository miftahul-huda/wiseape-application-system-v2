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

class WinStageItemEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.data ? WiseI18n.t('EDIT_BUTIR_TAHAPAN_PROSES') : WiseI18n.t('TAMBAH_BUTIR_TAHAPAN_PROSES');
    this.appIcon = options.appIcon || '⚙️';
    this.width = options.width || '540';
    this.height = options.height || '440';
    this.centered = true;

    this.itemData = options.data ? { ...options.data } : null;
    this.matrixTemplates = options.matrixTemplates || [];
    this.onSavedCallback = options.onSaved || null;
  }

  onWindowInit() {
    this.controls = [];

    const inputBorderStyle = { border: '1px solid #94a3b8', borderRadius: '6px' };

    const formLayout = new WiseTableLayout({
      rows: 4,
      columns: 1,
      id: 'tblStageItemLayout',
      style: { width: '100%', marginBottom: '16px' }
    });

    // 1. Nama Tahapan
    this.txtStageName = new WiseTextBox('', {
      id: 'txtItemStageName',
      label: WiseI18n.t('NAMA_TAHAPAN_PROSES'),
      datafield: 'name',
      placeholder: WiseI18n.t('CONTOH_INTERVIEW_USER_INTERVIEW_HRD_TES_PRAKTIK_CV'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    formLayout.setCell(0, 0, this.txtStageName);

    // 2. Urutan
    this.numOrder = new WiseNumericBox(1, {
      id: 'numItemOrder',
      label: WiseI18n.t('URUTAN_TAHAPAN'),
      datafield: 'order',
      min: 1,
      max: 99,
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    formLayout.setCell(1, 0, this.numOrder);

    // 3. Matriks Penilaian
    const matrixItems = [
      { value: '', label: WiseI18n.t('TANPA_MATRIKS_PENILAIAN_KHUSUS') },
      ...this.matrixTemplates.map((m) => ({ value: String(m.id), label: `${m.name} (${(m.criteria || []).length} kriteria)` }))
    ];
    this.cmbMatrix = new WiseComboBox('', {
      id: 'cmbItemMatrix',
      label: WiseI18n.t('TEMPLATE_MATRIKS_PENILAIAN_OPSIONAL'),
      datafield: 'matrixTemplateId',
      items: matrixItems,
      style: { ...inputBorderStyle, width: '100%' }
    });
    formLayout.setCell(2, 0, this.cmbMatrix);

    // 4. Deskripsi
    this.txtDesc = new WiseTextArea('', {
      id: 'txtItemDesc',
      label: WiseI18n.t('DESKRIPSI_PANDUAN_TAHAPAN'),
      datafield: 'description',
      rows: 3,
      placeholder: WiseI18n.t('PENJELASAN_RUANG_LINGKUP_DAN_SASARAN_TAHAPAN_INI'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    formLayout.setCell(3, 0, this.txtDesc);

    this.addControl(formLayout);

    if (this.itemData) {
      this.populate(this.itemData);
    }

    // Action Buttons
    const btnContainer = new WiseFrame('', {
      id: 'frmStageItemActions',
      style: { display: 'flex', justifyContent: 'flex-end', gap: '8px' }
    });

    btnContainer.addControl(new WiseButton(WiseI18n.t('SIMPAN_3'), {
      id: 'btnItemSave',
      onClick: this.onSaveClick.bind(this)
    }));

    btnContainer.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnItemCancel',
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
      id: this.itemData ? this.itemData.id : `stg_${Date.now()}`,
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

export default WinStageItemEdit;
