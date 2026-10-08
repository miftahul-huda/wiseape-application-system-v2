const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseNumericBox = require('../../../../system/controls/WiseNumericBox');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseFrame = require('../../../../system/controls/WiseFrame');

const HrisApiRepository = require('../../services/HrisApiRepository');
const api = new HrisApiRepository();

const WiseI18n = typeof window !== 'undefined' ? window.WiseI18n : require('../../../../system/WiseI18n');

class WinJobLevelEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.isNew
      ? WiseI18n.t('Tambah Jenjang Jabatan — Wise HRIS')
      : WiseI18n.t('Edit Jenjang Jabatan — Wise HRIS');
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
    formLayout.setCell(0, 0, new WiseLabel(WiseI18n.t('Kode Jenjang *'), { style: lblStyle }));
    const codeVal = this.initialData ? (this.initialData.code || '') : '';
    const txtCode = new WiseTextBox(codeVal, {
      id: 'txtJobLevelCode',
      value: codeVal,
      placeholder: 'LVL-01, LVL-06, LVL-09',
      style: { width: '100%' }
    });
    formLayout.setCell(0, 1, txtCode);

    // 2. Nama Jenjang
    formLayout.setCell(1, 0, new WiseLabel(WiseI18n.t('Nama Jenjang / Grade *'), { style: lblStyle }));
    const nameVal = this.initialData ? (this.initialData.name || '') : '';
    const txtName = new WiseTextBox(nameVal, {
      id: 'txtJobLevelName',
      value: nameVal,
      placeholder: 'Staff, Supervisor, Manager, Director',
      style: { width: '100%' }
    });
    formLayout.setCell(1, 1, txtName);

    // 3. Level Ranking (Level Number)
    formLayout.setCell(2, 0, new WiseLabel(WiseI18n.t('Tingkat Level (1-9) *'), { style: lblStyle }));
    const levelVal = this.initialData && this.initialData.levelNumber !== undefined ? Number(this.initialData.levelNumber) : 1;
    const numLevel = new WiseNumericBox(String(levelVal), {
      id: 'numJobLevelRanking',
      value: levelVal,
      style: { width: '120px' }
    });
    formLayout.setCell(2, 1, numLevel);

    // 4. Deskripsi
    formLayout.setCell(3, 0, new WiseLabel(WiseI18n.t('Deskripsi Tanggung Jawab'), { style: lblStyle }));
    const descVal = this.initialData ? (this.initialData.description || '') : '';
    const txtDesc = new WiseTextBox(descVal, {
      id: 'txtJobLevelDesc',
      value: descVal,
      placeholder: WiseI18n.t('Cakupan Tanggung Jawab'),
      style: { width: '100%' }
    });
    formLayout.setCell(3, 1, txtDesc);

    // 5. Urutan
    formLayout.setCell(4, 0, new WiseLabel(WiseI18n.t('Urutan Tampilan'), { style: lblStyle }));
    const sortVal = this.initialData && this.initialData.sortOrder !== undefined ? Number(this.initialData.sortOrder) : 0;
    const numSort = new WiseNumericBox(String(sortVal), {
      id: 'numJobLevelSortOrder',
      value: sortVal,
      style: { width: '120px' }
    });
    formLayout.setCell(4, 1, numSort);

    this.addControl(formLayout);

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

    const btnCancel = new WiseButton(WiseI18n.t('✕ Batal'), {
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

    const btnSave = new WiseButton(WiseI18n.t('💾 Simpan Jenjang'), {
      id: 'btnJobLevelSave',
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
      const txtCode = this.findControl('txtJobLevelCode');
      const txtName = this.findControl('txtJobLevelName');
      const numLevel = this.findControl('numJobLevelRanking');
      const txtDesc = this.findControl('txtJobLevelDesc');
      const numSort = this.findControl('numJobLevelSortOrder');

      const code = (txtCode && txtCode.value) ? txtCode.value.trim() : '';
      const name = (txtName && txtName.value) ? txtName.value.trim() : '';
      const levelNumber = numLevel ? parseInt(numLevel.value, 10) || 1 : 1;
      const description = (txtDesc && txtDesc.value) ? txtDesc.value.trim() : '';
      const sortOrder = numSort ? parseInt(numSort.value, 10) || 0 : 0;

      if (!code) {
        this.showError(WiseI18n.t('Kode jenjang jabatan wajib diisi.'));
        return;
      }

      if (!name) {
        this.showError(WiseI18n.t('Nama jenjang jabatan wajib diisi.'));
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
      this.showError(err.message || WiseI18n.t('Gagal menyimpan jenjang jabatan'));
    }
  }

  showError(msg) {
    if (this.lblError) {
      this.lblError.text = `⚠️ ${msg}`;
      this.lblError.style.display = 'block';
    }
  }
}

module.exports = WinJobLevelEdit;
