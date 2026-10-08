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

class WinStageItemEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.data ? WiseI18n.t('Edit Butir Tahapan Proses') : WiseI18n.t('Tambah Butir Tahapan Proses');
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
    const labelStyle = { fontWeight: 600, color: '#334155', display: 'block', marginBottom: '2px', lineHeight: '1.2' };

    const formLayout = new WiseTableLayout({
      rows: 4,
      columns: 1,
      id: 'tblStageItemLayout',
      style: { width: '100%', marginBottom: '16px' }
    });

    // 1. Nama Tahapan
    const cellName = new WiseFrame('', { id: 'frmStageItemName' });
    cellName.addControl(new WiseLabel(WiseI18n.t('Nama Tahapan Proses *'), { id: 'lblItemName', style: labelStyle }));
    this.txtStageName = new WiseTextBox(this.itemData ? this.itemData.name : '', {
      id: 'txtItemStageName',
      placeholder: WiseI18n.t('Contoh: Interview User, Interview HRD, Tes Praktik, CV Screening'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellName.addControl(this.txtStageName);
    formLayout.setCell(0, 0, cellName);

    // 2. Urutan
    const cellOrder = new WiseFrame('', { id: 'frmStageItemOrder' });
    cellOrder.addControl(new WiseLabel(WiseI18n.t('Urutan Tahapan *'), { id: 'lblItemOrder', style: labelStyle }));
    this.numOrder = new WiseNumericBox(this.itemData ? this.itemData.order : 1, {
      id: 'numItemOrder',
      min: 1,
      max: 99,
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellOrder.addControl(this.numOrder);
    formLayout.setCell(1, 0, cellOrder);

    // 3. Matriks Penilaian
    const cellMatrix = new WiseFrame('', { id: 'frmStageItemMatrix' });
    cellMatrix.addControl(new WiseLabel(WiseI18n.t('Template Matriks Penilaian (Opsional)'), { id: 'lblItemMatrix', style: labelStyle }));
    const matrixItems = [
      { value: '', label: WiseI18n.t('(Tanpa Matriks Penilaian Khusus)') },
      ...this.matrixTemplates.map((m) => ({ value: String(m.id), label: `${m.name} (${(m.criteria || []).length} kriteria)` }))
    ];
    this.cmbMatrix = new WiseComboBox(this.itemData && this.itemData.matrixTemplateId ? String(this.itemData.matrixTemplateId) : '', {
      id: 'cmbItemMatrix',
      items: matrixItems,
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellMatrix.addControl(this.cmbMatrix);
    formLayout.setCell(2, 0, cellMatrix);

    // 4. Deskripsi
    const cellDesc = new WiseFrame('', { id: 'frmStageItemDesc' });
    cellDesc.addControl(new WiseLabel(WiseI18n.t('Deskripsi / Panduan Tahapan'), { id: 'lblItemDesc', style: labelStyle }));
    this.txtDesc = new WiseTextArea(this.itemData ? this.itemData.description : '', {
      id: 'txtItemDesc',
      rows: 3,
      placeholder: WiseI18n.t('Penjelasan ruang lingkup dan sasaran tahapan ini...'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellDesc.addControl(this.txtDesc);
    formLayout.setCell(3, 0, cellDesc);

    this.addControl(formLayout);

    // Action Buttons
    const btnContainer = new WiseFrame('', {
      id: 'frmStageItemActions',
      style: { display: 'flex', justifyContent: 'flex-end', gap: '8px' }
    });

    btnContainer.addControl(new WiseButton(WiseI18n.t('Batal'), {
      id: 'btnItemCancel',
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

    btnContainer.addControl(new WiseButton(WiseI18n.t('💾 Simpan'), {
      id: 'btnItemSave',
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
      this.showInfo(WiseI18n.t('Validasi'), WiseI18n.t('Nama tahapan proses wajib diisi.'), 'warning');
      return;
    }

    const order = this.numOrder ? parseInt(this.numOrder.value, 10) || 1 : 1;
    const matrixIdStr = this.cmbMatrix ? this.cmbMatrix.value : '';
    const matrixId = matrixIdStr ? parseInt(matrixIdStr, 10) : null;
    const selectedMatrix = this.matrixTemplates.find((m) => String(m.id) === String(matrixIdStr));

    const result = {
      id: this.itemData ? this.itemData.id : `stg_${Date.now()}`,
      name,
      order,
      description: this.txtDesc ? this.txtDesc.value.trim() : '',
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

module.exports = WinStageItemEdit;
