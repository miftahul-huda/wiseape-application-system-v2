const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseNumericBox = require('../../../../system/controls/WiseNumericBox');
const WiseComboBox = require('../../../../system/controls/WiseComboBox');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseFrame = require('../../../../system/controls/WiseFrame');

const HrisApiRepository = require('../../services/HrisApiRepository');
const api = new HrisApiRepository();

const WiseI18n = typeof window !== 'undefined' ? window.WiseI18n : require('../../../../system/WiseI18n');

const CATEGORY_OPTIONS = () => {
  const t = (k) => WiseI18n.t(k);
  return [
    { value: 'RELATIONSHIP', label: t('HUBUNGAN_KELUARGA_RELATIONSHIP') },
    { value: 'RELIGION', label: t('AGAMA_RELIGION') },
    { value: 'EMPLOYMENT_STATUS', label: t('STATUS_KEPEGAWAIAN_EMPLOYMENT_STATUS') },
    { value: 'WORK_LOCATION', label: t('LOKASI_KERJA_WORK_LOCATION') },
    { value: 'BANK', label: t('BANK_PAYROLL_BANK') },
    { value: 'DOCUMENT_TYPE', label: t('JENIS_DOKUMEN_DOCUMENT_TYPE') },
    { value: 'DEGREE_LEVEL', label: t('JENJANG_PENDIDIKAN_DEGREE_LEVEL') },
    { value: 'GENDER', label: t('JENIS_KELAMIN_GENDER') }
  ];
};

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
      columns: 2,
      id: 'tblMasterForm',
      style: { width: '100%', marginBottom: '16px' }
    });

    const lblStyle = { fontWeight: 600, color: '#334155', display: 'block', paddingTop: '6px' };

    // 1. Kategori (Category / DataType)
    formLayout.setCell(0, 0, new WiseLabel(WiseI18n.t('KATEGORI_MASTER_2'), { style: lblStyle }));
    const activeDataType = (this.initialData && this.initialData.dataType) ? this.initialData.dataType : this.initialDataType;
    const cmbCategory = new WiseComboBox(
      CATEGORY_OPTIONS(),
      {
        id: 'cmbCategory',
        value: activeDataType || 'RELATIONSHIP',
        style: { width: '100%' }
      }
    );
    formLayout.setCell(0, 1, cmbCategory);

    // 2. Kode (Code)
    formLayout.setCell(1, 0, new WiseLabel(WiseI18n.t('KODE_UNIK'), { style: lblStyle }));
    const txtCode = new WiseTextBox(this.initialData ? this.initialData.code : '', {
      id: 'txtCode',
      placeholder: 'ISLAM, HO_JKT, BCA, PERMANENT',
      style: { width: '100%' }
    });
    formLayout.setCell(1, 1, txtCode);

    // 3. Nama / Label (Name)
    formLayout.setCell(2, 0, new WiseLabel(WiseI18n.t('NAMA_DESKRIPSI_TAMPILAN'), { style: lblStyle }));
    const txtName = new WiseTextBox(this.initialData ? this.initialData.name : '', {
      id: 'txtName',
      placeholder: WiseI18n.t('NAMA_DESKRIPSI_TAMPILAN'),
      style: { width: '100%' }
    });
    formLayout.setCell(2, 1, txtName);

    // 4. Keterangan (Description)
    formLayout.setCell(3, 0, new WiseLabel(WiseI18n.t('KETERANGAN_TAMBAHAN'), { style: lblStyle }));
    const txtDescription = new WiseTextBox(this.initialData ? (this.initialData.description || '') : '', {
      id: 'txtDescription',
      placeholder: WiseI18n.t('KETERANGAN_TAMBAHAN'),
      style: { width: '100%' }
    });
    formLayout.setCell(3, 1, txtDescription);

    // 5. Urutan (Sort Order)
    formLayout.setCell(4, 0, new WiseLabel(WiseI18n.t('URUTAN_TAMPILAN'), { style: lblStyle }));
    const sortVal = this.initialData && this.initialData.sortOrder !== undefined ? Number(this.initialData.sortOrder) : 0;
    const numSortOrder = new WiseNumericBox(String(sortVal), {
      id: 'numSortOrder',
      value: sortVal,
      style: { width: '120px' }
    });
    formLayout.setCell(4, 1, numSortOrder);

    // 6. Status Aktif
    formLayout.setCell(5, 0, new WiseLabel(WiseI18n.t('STATUS'), { style: lblStyle }));
    const cmbStatus = new WiseComboBox([
      { value: 'true', label: WiseI18n.t('AKTIF_BISA_DIPILIH') },
      { value: 'false', label: '🔴 ' + WiseI18n.t('NONAKTIF_2') }
    ], {
      id: 'cmbStatus',
      value: (this.initialData && this.initialData.isActive === false) ? 'false' : 'true',
      style: { width: '100%' }
    });
    formLayout.setCell(5, 1, cmbStatus);

    this.addControl(formLayout);

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

    const btnCancel = new WiseButton(WiseI18n.t('BATAL_3'), {
      id: 'btnMasterCancel',
      onClick: () => this.close(),
      style: {
        background: '#e2e8f0',
        color: '#334155',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 18px',
        cursor: 'pointer'
      }
    });

    const btnSave = new WiseButton(WiseI18n.t('SIMPAN_DATA_2'), {
      id: 'btnMasterSave',
      onClick: this.onSave.bind(this),
      style: {
        background: 'var(--accent)',
        color: '#ffffff',
        fontWeight: 700,
        borderRadius: '6px',
        padding: '8px 22px',
        cursor: 'pointer'
      }
    });

    actionContainer.addControl(btnCancel);
    actionContainer.addControl(btnSave);
    this.addControl(actionContainer);
  }

  async onSave() {
    try {
      const cmbCat = this.findControl('cmbCategory');
      const txtCode = this.findControl('txtCode');
      const txtName = this.findControl('txtName');
      const txtDesc = this.findControl('txtDescription');
      const numSort = this.findControl('numSortOrder');
      const cmbStat = this.findControl('cmbStatus');

      const dataType = (cmbCat && cmbCat.value) ? cmbCat.value : this.initialDataType;

      const code = (txtCode && txtCode.value) ? txtCode.value.trim() : '';
      const name = (txtName && txtName.value) ? txtName.value.trim() : '';
      const description = (txtDesc && txtDesc.value) ? txtDesc.value.trim() : '';
      const sortOrder = numSort ? parseInt(numSort.value, 10) || 0 : 0;
      const isActive = cmbStat ? (cmbStat.value !== 'false' && cmbStat.value !== false) : true;

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

module.exports = WinMasterDataEdit;
