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

const ORG_TYPES = ['Division', 'Department', 'Unit', 'Branch'];

class WinOrganizationEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.isNew
      ? WiseI18n.t('Tambah Unit Organisasi — Wise HRIS')
      : WiseI18n.t('Edit Unit Organisasi — Wise HRIS');
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
    formLayout.setCell(0, 0, new WiseLabel(WiseI18n.t('Tipe Struktur *'), { style: lblStyle }));
    const typeItems = ORG_TYPES.map((t) => ({ value: t, label: t }));
    const cmbType = new WiseComboBox(typeItems, {
      id: 'cmbOrgType',
      value: this.initialData ? this.initialData.type : 'Department',
      style: { width: '100%' }
    });
    formLayout.setCell(0, 1, cmbType);

    // 2. Kode Organisasi
    formLayout.setCell(1, 0, new WiseLabel(WiseI18n.t('Kode Organisasi *'), { style: lblStyle }));
    const codeVal = this.initialData ? (this.initialData.code || '') : '';
    const txtCode = new WiseTextBox(codeVal, {
      id: 'txtOrgCode',
      value: codeVal,
      placeholder: 'DIV-TECH, DEPT-ENG, DEPT-HR',
      style: { width: '100%' }
    });
    formLayout.setCell(1, 1, txtCode);

    // 3. Nama Organisasi
    formLayout.setCell(2, 0, new WiseLabel(WiseI18n.t('Nama Organisasi *'), { style: lblStyle }));
    const nameVal = this.initialData ? (this.initialData.name || '') : '';
    const txtName = new WiseTextBox(nameVal, {
      id: 'txtOrgName',
      value: nameVal,
      placeholder: 'Software Engineering, Human Resources',
      style: { width: '100%' }
    });
    formLayout.setCell(2, 1, txtName);

    // 4. Induk Organisasi (Parent)
    formLayout.setCell(3, 0, new WiseLabel(WiseI18n.t('Induk Organisasi'), { style: lblStyle }));
    const parentItems = [
      { value: '', label: WiseI18n.t('(Tidak Ada / Unit Tingkat Atas)') },
      ...this.parentOptions.map((p) => ({ value: String(p.id), label: `[${p.code}] ${p.name}` }))
    ];
    const cmbParent = new WiseComboBox(parentItems, {
      id: 'cmbOrgParent',
      value: (this.initialData && this.initialData.parentId) ? String(this.initialData.parentId) : '',
      style: { width: '100%' }
    });
    formLayout.setCell(3, 1, cmbParent);

    // 5. Deskripsi
    formLayout.setCell(4, 0, new WiseLabel(WiseI18n.t('Deskripsi Fungsi'), { style: lblStyle }));
    const descVal = this.initialData ? (this.initialData.description || '') : '';
    const txtDesc = new WiseTextBox(descVal, {
      id: 'txtOrgDesc',
      value: descVal,
      placeholder: WiseI18n.t('Deskripsi Fungsi'),
      style: { width: '100%' }
    });
    formLayout.setCell(4, 1, txtDesc);

    // 6. Urutan (Sort Order)
    formLayout.setCell(5, 0, new WiseLabel(WiseI18n.t('Urutan Tampilan'), { style: lblStyle }));
    const sortVal = this.initialData && this.initialData.sortOrder !== undefined ? Number(this.initialData.sortOrder) : 0;
    const numSort = new WiseNumericBox(String(sortVal), {
      id: 'numOrgSortOrder',
      value: sortVal,
      style: { width: '120px' }
    });
    formLayout.setCell(5, 1, numSort);

    this.addControl(formLayout);

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

    const btnCancel = new WiseButton(WiseI18n.t('✕ Batal'), {
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

    const btnSave = new WiseButton(WiseI18n.t('💾 Simpan Organisasi'), {
      id: 'btnOrgSave',
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
      const cmbType = this.findControl('cmbOrgType');
      const txtCode = this.findControl('txtOrgCode');
      const txtName = this.findControl('txtOrgName');
      const cmbParent = this.findControl('cmbOrgParent');
      const txtDesc = this.findControl('txtOrgDesc');
      const numSort = this.findControl('numOrgSortOrder');

      const type = (cmbType && cmbType.value) ? cmbType.value : 'Department';
      const code = (txtCode && txtCode.value) ? txtCode.value.trim() : '';
      const name = (txtName && txtName.value) ? txtName.value.trim() : '';
      const description = (txtDesc && txtDesc.value) ? txtDesc.value.trim() : '';
      const sortOrder = numSort ? parseInt(numSort.value, 10) || 0 : 0;

      let parentId = null;
      if (cmbParent && cmbParent.value) {
        parentId = parseInt(cmbParent.value, 10) || null;
      }

      if (!code) {
        this.showError(WiseI18n.t('Kode organisasi wajib diisi.'));
        return;
      }

      if (!name) {
        this.showError(WiseI18n.t('Nama organisasi wajib diisi.'));
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
      this.showError(err.message || WiseI18n.t('Gagal menyimpan unit organisasi'));
    }
  }

  showError(msg) {
    if (this.lblError) {
      this.lblError.text = `⚠️ ${msg}`;
      this.lblError.style.display = 'block';
    }
  }
}

module.exports = WinOrganizationEdit;
