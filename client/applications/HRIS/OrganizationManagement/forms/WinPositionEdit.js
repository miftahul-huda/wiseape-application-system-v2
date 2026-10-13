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


class WinPositionEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.isNew
      ? WiseI18n.t('TAMBAH_MASTER_JABATAN_WISE_HRIS')
      : WiseI18n.t('EDIT_MASTER_JABATAN_WISE_HRIS');
    this.appIcon = options.isNew ? '➕' : '💼';
    this.width = options.width || '600';
    this.height = options.height || 'auto';
    this.centered = true;

    this.isNew = options.isNew !== false && !options.positionId;
    this.positionId = options.positionId || null;
    this.initialData = options.data || null;
    this.orgOptions = options.orgOptions || [];
    this.levelOptions = options.levelOptions || [];
    this.onSavedCallback = options.onSaved || null;
  }

  onWindowInit() {
    this.controls = [];

    // Form Layout
    const formLayout = new WiseTableLayout({
      rows: 6,
      columns: 2,
      id: 'tblPosForm',
      style: { width: '100%', marginBottom: '16px' }
    });

    const lblStyle = { fontWeight: 600, color: '#334155', display: 'block', paddingTop: '6px' };

    // 1. Kode Jabatan
    formLayout.setCell(0, 0, new WiseLabel(WiseI18n.t('KODE_POSISI_JABATAN'), { style: lblStyle }));
    const txtCode = new WiseTextBox('', {
      id: 'txtPosCode',
      datafield: 'code',
      placeholder: 'POS-SWE, POS-MGR-HR',
      style: { width: '100%' }
    });
    formLayout.setCell(0, 1, txtCode);

    // 2. Judul / Nama Jabatan
    formLayout.setCell(1, 0, new WiseLabel(WiseI18n.t('JUDUL_NAMA_JABATAN_2'), { style: lblStyle }));
    const txtTitle = new WiseTextBox('', {
      id: 'txtPosTitle',
      datafield: 'title',
      placeholder: 'Software Engineer, HR Manager',
      style: { width: '100%' }
    });
    formLayout.setCell(1, 1, txtTitle);

    // 3. Unit Organisasi / Departemen
    formLayout.setCell(2, 0, new WiseLabel(WiseI18n.t('UNIT_ORGANISASI_DEPT'), { style: lblStyle }));
    const orgItems = [
      { value: '', label: WiseI18n.t('TIDAK_TERIKAT_ORGANISASI_SPESIFIK') },
      ...this.orgOptions.map((o) => ({ value: String(o.id), label: `[${o.type}] ${o.name}` }))
    ];
    const cmbOrg = new WiseComboBox(orgItems, {
      id: 'cmbPosOrg',
      datafield: 'organizationId',
      value: '',
      style: { width: '100%' }
    });
    formLayout.setCell(2, 1, cmbOrg);

    // 4. Jenjang Jabatan (Job Level)
    formLayout.setCell(3, 0, new WiseLabel(WiseI18n.t('JENJANG_JABATAN_GRADE'), { style: lblStyle }));
    const levelItems = [
      { value: '', label: WiseI18n.t('PILIH_JENJANG_JABATAN') },
      ...this.levelOptions.map((l) => ({ value: String(l.id), label: `[Level ${l.levelNumber}] ${l.name}` }))
    ];
    const cmbLevel = new WiseComboBox(levelItems, {
      id: 'cmbPosLevel',
      datafield: 'jobLevelId',
      value: '',
      style: { width: '100%' }
    });
    formLayout.setCell(3, 1, cmbLevel);

    // 5. Deskripsi & Kualifikasi
    formLayout.setCell(4, 0, new WiseLabel(WiseI18n.t('URAIAN_TUGAS_SINGKAT'), { style: lblStyle }));
    const txtDesc = new WiseTextBox('', {
      id: 'txtPosDesc',
      datafield: 'description',
      placeholder: WiseI18n.t('URAIAN_TUGAS_SINGKAT'),
      style: { width: '100%' }
    });
    formLayout.setCell(4, 1, txtDesc);

    // 6. Urutan (Sort Order)
    formLayout.setCell(5, 0, new WiseLabel(WiseI18n.t('URUTAN_TAMPILAN'), { style: lblStyle }));
    const numSort = new WiseNumericBox('0', {
      id: 'numPosSortOrder',
      datafield: 'sortOrder',
      value: 0,
      style: { width: '120px' }
    });
    formLayout.setCell(5, 1, numSort);

    this.addControl(formLayout);

    if (this.initialData) {
      this.populate(this.initialData);
    }

    // Error Label
    this.lblError = new WiseLabel('', {
      id: 'lblPosFormError',
      style: { color: '#dc2626', fontWeight: 600, display: 'none', marginBottom: '10px' }
    });
    this.addControl(this.lblError);

    // Actions
    const actionContainer = new WiseFrame('', {
      id: 'framePosEditActions',
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        paddingTop: '12px',
        borderTop: '1px solid #e2e8f0'
      }
    });

    const btnCancel = new WiseButton(WiseI18n.t('BATAL_3'), {
      id: 'btnPosCancel',
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

    const btnSave = new WiseButton(WiseI18n.t('SIMPAN_JABATAN'), {
      id: 'btnPosSave',
      onClick: this.onSave.bind(this)
    });

    actionContainer.addControl(btnCancel);
    actionContainer.addControl(btnSave);
    this.addControl(actionContainer);
  }

  async onSave() {
    try {
      const values = this.getValues();
      const code = (values.code || '').trim();
      const title = (values.title || '').trim();
      const description = (values.description || '').trim();
      const sortOrder = parseInt(values.sortOrder, 10) || 0;

      let organizationId = null;
      let department = '';
      if (values.organizationId) {
        organizationId = parseInt(values.organizationId, 10) || null;
        const orgObj = this.orgOptions.find((o) => o.id === organizationId);
        if (orgObj) {
          department = orgObj.name;
        }
      }

      let jobLevelId = values.jobLevelId ? (parseInt(values.jobLevelId, 10) || null) : null;

      if (!code) {
        this.showError(WiseI18n.t('KODE_JABATAN_WAJIB_DIISI'));
        return;
      }

      if (!title) {
        this.showError(WiseI18n.t('JUDUL_NAMA_JABATAN_WAJIB_DIISI'));
        return;
      }

      const payload = {
        code,
        title,
        organizationId,
        jobLevelId,
        department,
        description,
        sortOrder,
        isActive: this.initialData ? this.initialData.isActive : true
      };

      if (this.isNew || !this.positionId) {
        await api.createPosition(payload);
      } else {
        await api.updatePosition(this.positionId, payload);
      }

      if (typeof this.onSavedCallback === 'function') {
        await this.onSavedCallback();
      }

      this.close();
    } catch (err) {
      this.showError(err.message || WiseI18n.t('GAGAL_MENYIMPAN_DATA_JABATAN'));
    }
  }

  showError(msg) {
    if (this.lblError) {
      this.lblError.text = `⚠️ ${msg}`;
      this.lblError.style.display = 'block';
    }
  }
}

export default WinPositionEdit;
