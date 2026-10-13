import {
  WiseWindow,
  WiseLabel,
  WiseButton,
  WiseTextBox,
  WiseNumericBox,
  WiseTableLayout,
  WiseFrame,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

import HrisApiRepository from '../../services/HrisApiRepository';
const api = new HrisApiRepository();


class WinJobLevelEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.isNew
      ? WiseI18n.t('TAMBAH_JENJANG_JABATAN_WISE_HRIS')
      : WiseI18n.t('EDIT_JENJANG_JABATAN_WISE_HRIS');
    this.appIcon = options.isNew ? '➕' : '🎖️';
    this.width = options.width || '540';
    this.height = options.height || 'auto';
    this.centered = true;

    this.isNew = options.isNew !== false && !options.jobLevelId;
    this.jobLevelId = options.jobLevelId || null;
    this.initialData = options.data || null;
    this.onSavedCallback = options.onSaved || null;
  }

  onWindowInit() {
    this.controls = [];

    // Form Layout
    const formLayout = new WiseTableLayout({
      rows: 5,
      columns: 2,
      id: 'tblJobLevelForm',
      style: { width: '100%', marginBottom: '16px' }
    });

    const lblStyle = { fontWeight: 600, color: '#334155', display: 'block', paddingTop: '6px' };

    // 1. Kode Jenjang
    formLayout.setCell(0, 0, new WiseLabel(WiseI18n.t('KODE_JENJANG'), { style: lblStyle }));
    const codeVal = this.initialData ? (this.initialData.code || '') : '';
    const txtCode = new WiseTextBox('', {
      id: 'txtJobLevelCode',
      datafield: 'code',
      placeholder: 'LVL-01, LVL-06, LVL-09',
      style: { width: '100%' }
    });
    formLayout.setCell(0, 1, txtCode);

    // 2. Nama Jenjang
    formLayout.setCell(1, 0, new WiseLabel(WiseI18n.t('NAMA_JENJANG_GRADE_2'), { style: lblStyle }));
    const txtName = new WiseTextBox('', {
      id: 'txtJobLevelName',
      datafield: 'name',
      placeholder: 'Staff, Supervisor, Manager, Director',
      style: { width: '100%' }
    });
    formLayout.setCell(1, 1, txtName);

    // 3. Level Ranking (Level Number)
    formLayout.setCell(2, 0, new WiseLabel(WiseI18n.t('TINGKAT_LEVEL_1_9'), { style: lblStyle }));
    const numLevel = new WiseNumericBox('1', {
      id: 'numJobLevelRanking',
      datafield: 'levelNumber',
      value: 1,
      style: { width: '120px' }
    });
    formLayout.setCell(2, 1, numLevel);

    // 4. Deskripsi
    formLayout.setCell(3, 0, new WiseLabel(WiseI18n.t('DESKRIPSI_TANGGUNG_JAWAB'), { style: lblStyle }));
    const txtDesc = new WiseTextBox('', {
      id: 'txtJobLevelDesc',
      datafield: 'description',
      placeholder: WiseI18n.t('CAKUPAN_TANGGUNG_JAWAB'),
      style: { width: '100%' }
    });
    formLayout.setCell(3, 1, txtDesc);

    // 5. Urutan
    formLayout.setCell(4, 0, new WiseLabel(WiseI18n.t('URUTAN_TAMPILAN'), { style: lblStyle }));
    const numSort = new WiseNumericBox('0', {
      id: 'numJobLevelSortOrder',
      datafield: 'sortOrder',
      value: 0,
      style: { width: '120px' }
    });
    formLayout.setCell(4, 1, numSort);

    this.addControl(formLayout);

    if (this.initialData) {
      this.populate(this.initialData);
    }

    // Error Label
    this.lblError = new WiseLabel('', {
      id: 'lblJobLevelFormError',
      style: { color: '#dc2626', fontWeight: 600, display: 'none', marginBottom: '10px' }
    });
    this.addControl(this.lblError);

    // Action Buttons
    const actionContainer = new WiseFrame('', {
      id: 'frameJobLevelEditActions',
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        paddingTop: '12px',
        borderTop: '1px solid #e2e8f0'
      }
    });

    const btnCancel = new WiseButton(WiseI18n.t('BATAL_3'), {
      id: 'btnJobLevelCancel',
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

    const btnSave = new WiseButton(WiseI18n.t('SIMPAN_JENJANG'), {
      id: 'btnJobLevelSave',
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
      const name = (values.name || '').trim();
      const levelNumber = parseInt(values.levelNumber, 10) || 1;
      const description = (values.description || '').trim();
      const sortOrder = parseInt(values.sortOrder, 10) || 0;

      if (!code) {
        this.showError(WiseI18n.t('KODE_JENJANG_JABATAN_WAJIB_DIISI'));
        return;
      }

      if (!name) {
        this.showError(WiseI18n.t('NAMA_JENJANG_JABATAN_WAJIB_DIISI'));
        return;
      }

      const payload = {
        code,
        name,
        levelNumber,
        description,
        sortOrder,
        isActive: this.initialData ? this.initialData.isActive : true
      };

      if (this.isNew || !this.jobLevelId) {
        await api.createJobLevel(payload);
      } else {
        await api.updateJobLevel(this.jobLevelId, payload);
      }

      if (typeof this.onSavedCallback === 'function') {
        await this.onSavedCallback();
      }

      this.close();
    } catch (err) {
      this.showError(err.message || WiseI18n.t('GAGAL_MENYIMPAN_JENJANG_JABATAN'));
    }
  }

  showError(msg) {
    if (this.lblError) {
      this.lblError.text = `⚠️ ${msg}`;
      this.lblError.style.display = 'block';
    }
  }
}

export default WinJobLevelEdit;
