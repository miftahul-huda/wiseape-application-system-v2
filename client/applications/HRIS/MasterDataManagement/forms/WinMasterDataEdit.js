import {
  WiseWindow,
  WiseLabel,
  WiseButton,
  WiseTextBox,
  WiseNumericBox,
  WiseComboBox,
  WiseTableLayout,
  WiseFrame,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

import HrisApiRepository from '../../services/HrisApiRepository';
const api = new HrisApiRepository();


const CATEGORY_OPTIONS = () => [
  { value: 'RELATIONSHIP', label: WiseI18n.t('HUBUNGAN_KELUARGA_RELATIONSHIP') },
  { value: 'RELIGION', label: WiseI18n.t('AGAMA_RELIGION') },
  { value: 'EMPLOYMENT_STATUS', label: WiseI18n.t('STATUS_KEPEGAWAIAN_EMPLOYMENT_STATUS') },
  { value: 'WORK_LOCATION', label: WiseI18n.t('LOKASI_KERJA_WORK_LOCATION') },
  { value: 'BANK', label: WiseI18n.t('BANK_PAYROLL_BANK') },
  { value: 'DOCUMENT_TYPE', label: WiseI18n.t('JENIS_DOKUMEN_DOCUMENT_TYPE') },
  { value: 'DEGREE_LEVEL', label: WiseI18n.t('JENJANG_PENDIDIKAN_DEGREE_LEVEL') },
  { value: 'GENDER', label: WiseI18n.t('JENIS_KELAMIN_GENDER') }
];

class WinMasterDataEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.isNew
      ? WiseI18n.t('TAMBAH_DATA_MASTER_WISE_HRIS')
      : WiseI18n.t('EDIT_DATA_MASTER_WISE_HRIS');
    this.appIcon = options.isNew ? '➕' : '✏️';
    this.width = options.width || '560';
    this.height = options.height || 'auto';
    this.centered = true;

    this.isNew = options.isNew !== false && !options.masterDataId;
    this.masterDataId = options.masterDataId || null;
    this.initialDataType = options.dataType || 'RELATIONSHIP';
    this.initialData = options.data || null;
    this.onSavedCallback = options.onSaved || null;
  }

  onWindowInit() {
    this.controls = [];

    // Form Layout
    const formLayout = new WiseTableLayout({
      rows: 6,
      columns: 1,
      id: 'tblMasterForm',
      style: { width: '100%', marginBottom: '16px' }
    });


    // 1. Kategori (Category / DataType)
    const activeDataType = (this.initialData && this.initialData.dataType) ? this.initialData.dataType : this.initialDataType;
    const cmbCategory = new WiseComboBox(
      CATEGORY_OPTIONS(),
      {
        id: 'cmbCategory',
        label: WiseI18n.t('KATEGORI_MASTER_2'),
        datafield: 'dataType',
        value: activeDataType || 'RELATIONSHIP',
        style: { width: '100%' }
      }
    );
    formLayout.setCell(0, 0, cmbCategory);

    // 2. Kode (Code)
    const txtCode = new WiseTextBox('', {
      id: 'txtCode',
      label: WiseI18n.t('KODE_UNIK'),
      datafield: 'code',
      placeholder: 'HO_JKT, BCA, PERMANENT',
      style: { width: '100%' }
    });
    formLayout.setCell(1, 0, txtCode);

    // 3. Nama / Label (Name)
    const txtName = new WiseTextBox('', {
      id: 'txtName',
      label: WiseI18n.t('NAMA_DESKRIPSI_TAMPILAN'),
      datafield: 'name',
      placeholder: WiseI18n.t('NAMA_DESKRIPSI_TAMPILAN'),
      style: { width: '100%' }
    });
    formLayout.setCell(2, 0, txtName);

    // 4. Keterangan (Description)
    const txtDescription = new WiseTextBox('', {
      id: 'txtDescription',
      label: WiseI18n.t('KETERANGAN_TAMBAHAN'),
      datafield: 'description',
      placeholder: WiseI18n.t('KETERANGAN_TAMBAHAN'),
      style: { width: '100%' }
    });
    formLayout.setCell(3, 0, txtDescription);

    // 5. Urutan (Sort Order)
    const numSortOrder = new WiseNumericBox('0', {
      id: 'numSortOrder',
      label: WiseI18n.t('URUTAN_TAMPILAN'),
      datafield: 'sortOrder',
      value: 0,
      style: { width: '120px' }
    });
    formLayout.setCell(4, 0, numSortOrder);

    // 6. Status Aktif
    const cmbStatus = new WiseComboBox([
      { value: 'true', label: WiseI18n.t('AKTIF_BISA_DIPILIH') },
      { value: 'false', label: '🔴 ' + WiseI18n.t('NONAKTIF_2') }
    ], {
      id: 'cmbStatus',
      label: WiseI18n.t('STATUS'),
      datafield: 'isActive',
      value: (this.initialData && this.initialData.isActive === false) ? 'false' : 'true',
      style: { width: '100%' }
    });
    formLayout.setCell(5, 0, cmbStatus);

    this.addControl(formLayout);

    if (this.initialData) {
      this.populate(this.initialData);
    }

    // Error / Validation Label
    this.lblError = new WiseLabel('', {
      id: 'lblMasterFormError',
      style: { color: '#dc2626', fontWeight: 600, display: 'none', marginBottom: '10px' }
    });
    this.addControl(this.lblError);

    // Action Buttons Container
    const actionContainer = new WiseFrame('', {
      id: 'frameMasterEditActions',
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        paddingTop: '12px',
        borderTop: '1px solid #e2e8f0'
      }
    });

    const btnCancel = new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnMasterCancel',
      onClick: () => this.close(),
      style: {
        background: '#e2e8f0',
        color: '#334155'
      }
    });

    const btnSave = new WiseButton(WiseI18n.t('SIMPAN_DATA_2'), {
      id: 'btnMasterSave',
      onClick: this.onSave.bind(this)
    });

    actionContainer.addControl(btnSave);
    actionContainer.addControl(btnCancel);
    this.addControl(actionContainer);
  }

  async onSave() {
    try {
      const values = this.getValues();
      const dataType = values.dataType || this.initialDataType;
      const code = (values.code || '').trim();
      const name = (values.name || '').trim();
      const description = (values.description || '').trim();
      const sortOrder = parseInt(values.sortOrder, 10) || 0;
      const isActive = values.isActive !== 'false' && values.isActive !== false;

      if (!code) {
        this.showError(WiseI18n.t('KODE_MASTER_DATA_WAJIB_DIISI'));
        return;
      }

      if (!name) {
        this.showError(WiseI18n.t('NAMA_MASTER_DATA_WAJIB_DIISI'));
        return;
      }

      const payload = {
        dataType,
        code,
        name,
        description,
        sortOrder,
        isActive
      };

      if (this.isNew || !this.masterDataId) {
        await api.createMasterData(payload);
      } else {
        await api.updateMasterData(this.masterDataId, payload);
      }

      if (typeof this.onSavedCallback === 'function') {
        await this.onSavedCallback();
      }

      this.close();
    } catch (err) {
      this.showError(err.message || WiseI18n.t('GAGAL_MENYIMPAN_DATA_MASTER'));
    }
  }

  showError(msg) {
    if (this.lblError) {
      this.lblError.text = `⚠️ ${msg}`;
      this.lblError.style.display = 'block';
    }
  }
}

export default WinMasterDataEdit;
