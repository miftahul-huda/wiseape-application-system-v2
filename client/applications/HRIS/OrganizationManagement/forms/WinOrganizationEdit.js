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


const ORG_TYPES = ['Division', 'Department', 'Unit', 'Branch'];

class WinOrganizationEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.isNew
      ? WiseI18n.t('TAMBAH_UNIT_ORGANISASI_WISE_HRIS')
      : WiseI18n.t('EDIT_UNIT_ORGANISASI_WISE_HRIS');
    this.appIcon = options.isNew ? '➕' : '✏️';
    this.width = options.width || '580';
    this.height = options.height || 'auto';
    this.centered = true;

    this.isNew = options.isNew !== false && !options.orgId;
    this.orgId = options.orgId || null;
    this.initialData = options.data || null;
    this.parentOptions = options.parentOptions || [];
    this.onSavedCallback = options.onSaved || null;
  }

  onWindowInit() {
    this.controls = [];

    // Form Layout
    const formLayout = new WiseTableLayout({
      rows: 6,
      columns: 1,
      id: 'tblOrgForm',
      style: { width: '100%', marginBottom: '16px' }
    });


    // 1. Tipe Organisasi (Type)
    const typeItems = ORG_TYPES.map((t) => ({ value: t, label: t }));
    const cmbType = new WiseComboBox(typeItems, {
      id: 'cmbOrgType',
      label: WiseI18n.t('TIPE_STRUKTUR'),
      datafield: 'type',
      value: 'Department',
      style: { width: '100%' }
    });
    formLayout.setCell(0, 0, cmbType);

    // 2. Kode Organisasi
    const txtCode = new WiseTextBox('', {
      id: 'txtOrgCode',
      label: WiseI18n.t('KODE_ORGANISASI'),
      datafield: 'code',
      placeholder: 'DIV-TECH, DEPT-ENG, DEPT-HR',
      style: { width: '100%' }
    });
    formLayout.setCell(1, 0, txtCode);

    // 3. Nama Organisasi
    const txtName = new WiseTextBox('', {
      id: 'txtOrgName',
      label: WiseI18n.t('NAMA_ORGANISASI'),
      datafield: 'name',
      placeholder: 'Software Engineering, Human Resources',
      style: { width: '100%' }
    });
    formLayout.setCell(2, 0, txtName);

    // 4. Induk Organisasi (Parent)
    const parentItems = [
      { value: '', label: WiseI18n.t('TIDAK_ADA_UNIT_TINGKAT_ATAS') },
      ...this.parentOptions.map((p) => ({ value: String(p.id), label: `[${p.code}] ${p.name}` }))
    ];
    const cmbParent = new WiseComboBox(parentItems, {
      id: 'cmbOrgParent',
      label: WiseI18n.t('INDUK_ORGANISASI'),
      datafield: 'parentId',
      value: '',
      style: { width: '100%' }
    });
    formLayout.setCell(3, 0, cmbParent);

    // 5. Deskripsi
    const txtDesc = new WiseTextBox('', {
      id: 'txtOrgDesc',
      label: WiseI18n.t('DESKRIPSI_FUNGSI'),
      datafield: 'description',
      placeholder: WiseI18n.t('DESKRIPSI_FUNGSI'),
      style: { width: '100%' }
    });
    formLayout.setCell(4, 0, txtDesc);

    // 6. Urutan (Sort Order)
    const numSort = new WiseNumericBox('0', {
      id: 'numOrgSortOrder',
      label: WiseI18n.t('URUTAN_TAMPILAN'),
      datafield: 'sortOrder',
      value: 0,
      style: { width: '120px' }
    });
    formLayout.setCell(5, 0, numSort);

    this.addControl(formLayout);

    if (this.initialData) {
      this.populate(this.initialData);
    }

    // Error message
    this.lblError = new WiseLabel('', {
      id: 'lblOrgFormError',
      style: { color: '#dc2626', fontWeight: 600, display: 'none', marginBottom: '10px' }
    });
    this.addControl(this.lblError);

    // Actions
    const actionContainer = new WiseFrame('', {
      id: 'frameOrgEditActions',
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        paddingTop: '12px',
        borderTop: '1px solid #e2e8f0'
      }
    });

    const btnCancel = new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnOrgCancel',
      onClick: () => this.close(),
      style: {
        background: '#e2e8f0',
        color: '#334155'
      }
    });

    const btnSave = new WiseButton(WiseI18n.t('SIMPAN_ORGANISASI'), {
      id: 'btnOrgSave',
      onClick: this.onSave.bind(this)
    });

    actionContainer.addControl(btnSave);
    actionContainer.addControl(btnCancel);
    this.addControl(actionContainer);
  }

  async onSave() {
    try {
      const values = this.getValues();
      const type = values.type || 'Department';
      const code = (values.code || '').trim();
      const name = (values.name || '').trim();
      const description = (values.description || '').trim();
      const sortOrder = parseInt(values.sortOrder, 10) || 0;
      const parentId = values.parentId ? (parseInt(values.parentId, 10) || null) : null;

      if (!code) {
        this.showError(WiseI18n.t('KODE_ORGANISASI_WAJIB_DIISI'));
        return;
      }

      if (!name) {
        this.showError(WiseI18n.t('NAMA_ORGANISASI_WAJIB_DIISI'));
        return;
      }

      const payload = {
        code,
        name,
        type,
        parentId,
        description,
        sortOrder,
        isActive: this.initialData ? this.initialData.isActive : true
      };

      if (this.isNew || !this.orgId) {
        await api.createOrganization(payload);
      } else {
        await api.updateOrganization(this.orgId, payload);
      }

      if (typeof this.onSavedCallback === 'function') {
        await this.onSavedCallback();
      }

      this.close();
    } catch (err) {
      this.showError(err.message || WiseI18n.t('GAGAL_MENYIMPAN_UNIT_ORGANISASI'));
    }
  }

  showError(msg) {
    if (this.lblError) {
      this.lblError.text = `⚠️ ${msg}`;
      this.lblError.style.display = 'block';
    }
  }
}

export default WinOrganizationEdit;
