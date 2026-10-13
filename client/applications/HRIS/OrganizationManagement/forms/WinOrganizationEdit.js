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
      columns: 2,
      id: 'tblOrgForm',
      style: { width: '100%', marginBottom: '16px' }
    });

    const lblStyle = { fontWeight: 600, color: '#334155', display: 'block', paddingTop: '6px' };

    // 1. Tipe Organisasi (Type)
    formLayout.setCell(0, 0, new WiseLabel(WiseI18n.t('TIPE_STRUKTUR'), { style: lblStyle }));
    const typeItems = ORG_TYPES.map((t) => ({ value: t, label: t }));
    const cmbType = new WiseComboBox(typeItems, {
      id: 'cmbOrgType',
      datafield: 'type',
      value: 'Department',
      style: { width: '100%' }
    });
    formLayout.setCell(0, 1, cmbType);

    // 2. Kode Organisasi
    formLayout.setCell(1, 0, new WiseLabel(WiseI18n.t('KODE_ORGANISASI'), { style: lblStyle }));
    const txtCode = new WiseTextBox('', {
      id: 'txtOrgCode',
      datafield: 'code',
      placeholder: 'DIV-TECH, DEPT-ENG, DEPT-HR',
      style: { width: '100%' }
    });
    formLayout.setCell(1, 1, txtCode);

    // 3. Nama Organisasi
    formLayout.setCell(2, 0, new WiseLabel(WiseI18n.t('NAMA_ORGANISASI'), { style: lblStyle }));
    const txtName = new WiseTextBox('', {
      id: 'txtOrgName',
      datafield: 'name',
      placeholder: 'Software Engineering, Human Resources',
      style: { width: '100%' }
    });
    formLayout.setCell(2, 1, txtName);

    // 4. Induk Organisasi (Parent)
    formLayout.setCell(3, 0, new WiseLabel(WiseI18n.t('INDUK_ORGANISASI'), { style: lblStyle }));
    const parentItems = [
      { value: '', label: WiseI18n.t('TIDAK_ADA_UNIT_TINGKAT_ATAS') },
      ...this.parentOptions.map((p) => ({ value: String(p.id), label: `[${p.code}] ${p.name}` }))
    ];
    const cmbParent = new WiseComboBox(parentItems, {
      id: 'cmbOrgParent',
      datafield: 'parentId',
      value: '',
      style: { width: '100%' }
    });
    formLayout.setCell(3, 1, cmbParent);

    // 5. Deskripsi
    formLayout.setCell(4, 0, new WiseLabel(WiseI18n.t('DESKRIPSI_FUNGSI'), { style: lblStyle }));
    const txtDesc = new WiseTextBox('', {
      id: 'txtOrgDesc',
      datafield: 'description',
      placeholder: WiseI18n.t('DESKRIPSI_FUNGSI'),
      style: { width: '100%' }
    });
    formLayout.setCell(4, 1, txtDesc);

    // 6. Urutan (Sort Order)
    formLayout.setCell(5, 0, new WiseLabel(WiseI18n.t('URUTAN_TAMPILAN'), { style: lblStyle }));
    const numSort = new WiseNumericBox('0', {
      id: 'numOrgSortOrder',
      datafield: 'sortOrder',
      value: 0,
      style: { width: '120px' }
    });
    formLayout.setCell(5, 1, numSort);

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

    const btnCancel = new WiseButton(WiseI18n.t('BATAL_3'), {
      id: 'btnOrgCancel',
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

    const btnSave = new WiseButton(WiseI18n.t('SIMPAN_ORGANISASI'), {
      id: 'btnOrgSave',
      onClick: this.onSave.bind(this)
    });

    actionContainer.addControl(btnCancel);
    actionContainer.addControl(btnSave);
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
