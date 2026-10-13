import {
  WiseWindow,
  WiseLabel,
  WiseButton,
  WiseTextBox,
  WiseNumericBox,
  WiseTextArea,
  WiseComboBox,
  WiseDataTable,
  WiseFrame,
  WiseTableLayout,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

import WinMatrixCriterionEdit from './WinMatrixCriterionEdit';
import RecruitmentApiRepository from '../services/RecruitmentApiRepository';
const api = new RecruitmentApiRepository();

class WinMatrixTemplateEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.templateId ? WiseI18n.t('EDIT_TEMPLATE_MATRIKS_PENILAIAN') : WiseI18n.t('TAMBAH_TEMPLATE_MATRIKS_PENILAIAN_BARU');
    this.appIcon = options.appIcon || '📊';
    this.width = options.width || '84%';
    this.height = options.height || '84%';
    this.centered = true;

    this.selectedTemplateId = options.templateId || null;
    this.onSavedCallback = options.onSaved || null;

    this.currentTemplate = null;
    this.criteriaList = [];
  }

  onWindowInit() {
    this.controls = [];

    const inputBorderStyle = { border: '1px solid #94a3b8', borderRadius: '6px' };

    // 1. Template Master Fields Layout (3 cols x 2 rows)
    const masterGrid = new WiseTableLayout({
      rows: 2,
      columns: 3,
      id: 'tblMatrixMasterGrid',
      style: { tableLayout: 'fixed', width: '100%', borderSpacing: '8px', marginBottom: '12px' }
    });

    this.txtName = new WiseTextBox('', {
      id: 'txtMatrixName',
      label: WiseI18n.t('NAMA_TEMPLATE_MATRIKS'),
      datafield: 'name',
      placeholder: WiseI18n.t('CONTOH_MATRIKS_WAWANCARA_HRD_BEHAVIORAL_CULTURE_FIT'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    masterGrid.setCell(0, 0, this.txtName);

    this.numPassScore = new WiseNumericBox(75, {
      id: 'numMatrixPassScore',
      label: WiseI18n.t('PASSING_SCORE_AMBANG_LOLOS'),
      datafield: 'passScore',
      min: 1,
      max: 100,
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    masterGrid.setCell(0, 1, this.numPassScore);

    this.cmbIsActive = new WiseComboBox('true', {
      id: 'cmbMatrixActive',
      label: WiseI18n.t('STATUS_AKTIF'),
      datafield: 'isActive',
      items: [
        { value: 'true', label: WiseI18n.t('AKTIF') },
        { value: 'false', label: WiseI18n.t('NONAKTIF') }
      ],
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    masterGrid.setCell(0, 2, this.cmbIsActive);

    this.txtCode = new WiseTextBox('', {
      id: 'txtMatrixCode',
      label: WiseI18n.t('KODE_MATRIKS_OPSIONAL'),
      datafield: 'code',
      placeholder: WiseI18n.t('CONTOH_MTX_HRD_01'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    masterGrid.setCell(1, 0, this.txtCode);

    this.txtDesc = new WiseTextBox('', {
      id: 'txtMatrixDesc',
      label: WiseI18n.t('DESKRIPSI_PANDUAN_UMUM_MATRIKS'),
      datafield: 'description',
      placeholder: WiseI18n.t('TUJUAN_MATRIKS_DAN_KELOMPOK_PERAN_SASARAN'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    masterGrid.setCell(1, 1, this.txtDesc);

    this.addControl(masterGrid);

    // 2. Sub-records Section Title & Toolbar
    this.addControl(new WiseLabel(WiseI18n.t('KRITERIA_PENILAIAN_PEMBOBOTAN_NILAI_HASIL_SELEKSI'), {
      id: 'lblSubCriteriaTitle',
      style: { fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '8px' }
    }));

    const critToolbar = new WiseFrame('', {
      id: 'frmMatrixCritToolbar',
      style: { display: 'flex', gap: '8px', marginBottom: '8px' }
    });

    critToolbar.addControl(new WiseButton(WiseI18n.t('TAMBAH_KRITERIA_2'), {
      id: 'btnCritAdd',
      onClick: this.onAddCriterionClick.bind(this)
    }));

    critToolbar.addControl(new WiseButton(WiseI18n.t('EDIT_KRITERIA_2'), {
      id: 'btnCritEdit',
      onClick: this.onEditCriterionClick.bind(this),
      style: {
        background: 'var(--accent-dark)',
        color: '#ffffff'
      }
    }));

    critToolbar.addControl(new WiseButton(WiseI18n.t('HAPUS_KRITERIA_2'), {
      id: 'btnCritDelete',
      onClick: this.onDeleteCriterionClick.bind(this),
      style: {
        background: '#ef4444',
        color: '#ffffff'
      }
    }));

    this.addControl(critToolbar);

    // 3. Data Table for Criteria
    this.dtCriteria = new WiseDataTable({
      id: 'dtMatrixCriteria',
      pageSize: 20,
      currentPage: 1,
      multiSelect: false,
      style: { width: '100%', marginBottom: '14px' }
    });

    this.dtCriteria.columns = [
      { key: 'no', title: WiseI18n.t('NO'), width: '60px' },
      { key: 'criterion', title: WiseI18n.t('KRITERIA_PENILAIAN_KOMPETENSI'), width: '320px' },
      { key: 'weightBadge', title: WiseI18n.t('BOBOT'), width: '110px' },
      { key: 'scaleType', title: WiseI18n.t('SKALA_NILAI'), width: '140px' },
      { key: 'description', title: WiseI18n.t('PANDUAN_EVALUATOR'), width: '380px' }
    ];

    this.addControl(this.dtCriteria);

    // 4. Bottom Action Buttons Bar
    const bottomBar = new WiseFrame('', {
      id: 'frmMatrixBottomBar',
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #e2e8f0'
      }
    });

    bottomBar.addControl(new WiseButton(WiseI18n.t('SIMPAN_TEMPLATE_MATRIKS'), {
      id: 'btnMatrixSave',
      onClick: this.onSaveClick.bind(this)
    }));

    bottomBar.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnMatrixCancel',
      onClick: () => this.close(),
      style: {
        background: '#e2e8f0',
        color: '#334155'
      }
    }));

    this.addControl(bottomBar);

    return this;
  }

  async loadInitialData() {
    try {
      if (this.selectedTemplateId) {
        const tpl = await api.getMatrixTemplate(this.selectedTemplateId);
        this.currentTemplate = tpl;

        this.populate(tpl);

        this.criteriaList = Array.isArray(tpl.criteria) ? [...tpl.criteria] : [];
        this.renderCriteriaTable();
      }
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  renderCriteriaTable() {
    if (!this.dtCriteria) return;

    this.dtCriteria.data = this.criteriaList.map((c, idx) => ({
      no: idx + 1,
      criterion: c.criterion || '-',
      weightBadge: `${c.weight || 0} %`,
      scaleType: c.scaleType || '1-100',
      description: c.description || '-',
      _raw: c
    }));
    this.dtCriteria.totalCount = this.criteriaList.length;
  }

  async onAddCriterionClick() {
    await this.openWindow(WinMatrixCriterionEdit, {
      data: null,
      onSaved: (newCrit) => {
        this.criteriaList.push(newCrit);
        this.renderCriteriaTable();
      }
    });
  }

  async onEditCriterionClick() {
    const idx = this.dtCriteria.selectedRowIndex;
    if (idx === null || idx === undefined || idx < 0 || !this.criteriaList[idx]) {
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_KRITERIA_YANG_INGIN_DIEDIT'), 'warning');
      return;
    }

    const targetCrit = this.criteriaList[idx];
    await this.openWindow(WinMatrixCriterionEdit, {
      data: targetCrit,
      onSaved: (updatedCrit) => {
        this.criteriaList[idx] = updatedCrit;
        this.renderCriteriaTable();
      }
    });
  }

  async onDeleteCriterionClick() {
    const idx = this.dtCriteria.selectedRowIndex;
    if (idx === null || idx === undefined || idx < 0 || !this.criteriaList[idx]) {
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_KRITERIA_YANG_INGIN_DIHAPUS'), 'warning');
      return;
    }

    this.criteriaList.splice(idx, 1);
    this.renderCriteriaTable();
  }

  async onSaveClick() {
    const values = this.getValues();
    const name = (values.name || '').trim();
    if (!name) {
      this.showInfo(WiseI18n.t('VALIDASI_FORM'), WiseI18n.t('NAMA_TEMPLATE_MATRIKS_WAJIB_DIISI'), 'warning');
      return;
    }

    const payload = {
      name,
      code: values.code ? values.code.trim() : null,
      description: (values.description || '').trim(),
      passScore: parseFloat(values.passScore) || 75,
      isActive: values.isActive !== 'false' && values.isActive !== false,
      criteria: this.criteriaList
    };

    try {
      if (this.selectedTemplateId) {
        await api.updateMatrixTemplate(this.selectedTemplateId, payload);
        this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('TEMPLATE_MATRIKS_PENILAIAN_BERHASIL_DIPERBARUI'), 'success');
      } else {
        await api.createMatrixTemplate(payload);
        this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('TEMPLATE_MATRIKS_PENILAIAN_BERHASIL_DIBUAT'), 'success');
      }

      if (typeof this.onSavedCallback === 'function') {
        this.onSavedCallback();
      }

      this.close();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENYIMPAN'), err.message, 'error');
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

export default WinMatrixTemplateEdit;
