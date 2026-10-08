const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseTextArea = require('../../../../system/controls/WiseTextArea');
const WiseComboBox = require('../../../../system/controls/WiseComboBox');
const WiseDate = require('../../../../system/controls/WiseDate');
const WiseTabControl = require('../../../../system/controls/WiseTabControl');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseFrame = require('../../../../system/controls/WiseFrame');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

const WinJobVacancyStageEdit = require('./WinJobVacancyStageEdit');
const RecruitmentApiRepository = require('../services/RecruitmentApiRepository');
const api = new RecruitmentApiRepository();

class WinJobVacancyEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.vacancyId ? WiseI18n.t('Edit Lowongan Pekerjaan — Wise Recruitment') : WiseI18n.t('Tambah Lowongan Pekerjaan Baru — Wise Recruitment');
    this.appIcon = options.appIcon || '💼';
    this.width = options.width || '88%';
    this.height = options.height || '88%';
    this.centered = true;

    this.selectedVacancyId = options.vacancyId || null;
    this.onSavedCallback = options.onSaved || null;

    this.currentVacancy = null;
    this.stageTemplates = [];
    this.matrixTemplates = [];
    this.stagesList = [];
    this.selectedStageIndex = null;
  }

  onWindowInit() {
    this.controls = [];

    const inputBorderStyle = { border: '1px solid #94a3b8', borderRadius: '6px' };
    const labelStyle = { fontWeight: 600, color: '#334155', display: 'block', marginBottom: '2px', lineHeight: '1.2' };

    // 1. Tab Control
    this.tabControl = new WiseTabControl({
      id: 'tabJobVacancy',
      tabs: [
        { id: 'tabInfo', title: WiseI18n.t('📝 Informasi Lowongan') },
        { id: 'tabStages', title: WiseI18n.t('⚙️ Alur Proses Seleksi') }
      ],
      activeTab: 'tabInfo',
      style: { width: '100%', marginBottom: '14px' }
    });

    // --- TAB 1: Informasi Lowongan ---
    const panelInfo = new WiseFrame('', { id: 'pnlVacancyInfo', style: { padding: '8px 0' } });

    // Grid 2 Columns for fields
    const infoGrid = new WiseTableLayout({
      rows: 6,
      columns: 2,
      id: 'tblVacancyInfoGrid',
      style: { tableLayout: 'fixed', width: '100%', borderSpacing: '10px' }
    });

    // Row 0: Judul Lowongan & Status
    const cellTitle = new WiseFrame('', { id: 'frmVacTitle' });
    cellTitle.addControl(new WiseLabel(WiseI18n.t('Judul Lowongan *'), { id: 'lblVacTitle', style: labelStyle }));
    this.txtTitle = new WiseTextBox('', {
      id: 'txtVacTitle',
      placeholder: WiseI18n.t('Contoh: Senior Frontend Engineer'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellTitle.addControl(this.txtTitle);
    infoGrid.setCell(0, 0, cellTitle);

    const cellStatus = new WiseFrame('', { id: 'frmVacStatus' });
    cellStatus.addControl(new WiseLabel(WiseI18n.t('Status Lowongan *'), { id: 'lblVacStatus', style: labelStyle }));
    this.cmbStatus = new WiseComboBox('ACTIVE', {
      id: 'cmbVacStatus',
      items: [
        { value: 'ACTIVE', label: WiseI18n.t('🟢 ACTIVE (Dibuka)') },
        { value: 'DRAFT', label: WiseI18n.t('🟡 DRAFT (Konsep)') },
        { value: 'CLOSED', label: WiseI18n.t('🔴 CLOSED (Ditutup)') }
      ],
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellStatus.addControl(this.cmbStatus);
    infoGrid.setCell(0, 1, cellStatus);

    // Row 1: Departemen & Divisi
    const cellDept = new WiseFrame('', { id: 'frmVacDept' });
    cellDept.addControl(new WiseLabel(WiseI18n.t('Departemen *'), { id: 'lblVacDept', style: labelStyle }));
    this.cmbDepartment = new WiseComboBox('', {
      id: 'cmbVacDept',
      items: [
        { value: '', label: WiseI18n.t('(Pilih Departemen)') },
        { value: 'Technology & Digital Innovation', label: WiseI18n.t('Technology & Digital Innovation') },
        { value: 'Human Capital & General Affairs', label: WiseI18n.t('Human Capital & General Affairs') },
        { value: 'Finance, Tax & Accounting', label: WiseI18n.t('Finance, Tax & Accounting') },
        { value: 'Sales, Marketing & Commercial', label: WiseI18n.t('Sales, Marketing & Commercial') },
        { value: 'Operations & Customer Experience', label: WiseI18n.t('Operations & Customer Experience') }
      ],
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellDept.addControl(this.cmbDepartment);
    infoGrid.setCell(1, 0, cellDept);

    const cellDiv = new WiseFrame('', { id: 'frmVacDiv' });
    cellDiv.addControl(new WiseLabel(WiseI18n.t('Divisi / Sub-Departemen'), { id: 'lblVacDiv', style: labelStyle }));
    this.txtDivision = new WiseTextBox('', {
      id: 'txtVacDivision',
      placeholder: WiseI18n.t('Contoh: Software Engineering, People Operations'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellDiv.addControl(this.txtDivision);
    infoGrid.setCell(1, 1, cellDiv);

    // Row 2: Posisi Jabatan & Jenjang Jabatan
    const cellPos = new WiseFrame('', { id: 'frmVacPos' });
    cellPos.addControl(new WiseLabel(WiseI18n.t('Posisi / Jabatan *'), { id: 'lblVacPos', style: labelStyle }));
    this.txtPosition = new WiseTextBox('', {
      id: 'txtVacPosition',
      placeholder: WiseI18n.t('Contoh: Senior Software Engineer'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellPos.addControl(this.txtPosition);
    infoGrid.setCell(2, 0, cellPos);

    const cellLvl = new WiseFrame('', { id: 'frmVacLvl' });
    cellLvl.addControl(new WiseLabel(WiseI18n.t('Tingkat Jabatan (Job Level)'), { id: 'lblVacLvl', style: labelStyle }));
    this.cmbJobLevel = new WiseComboBox('', {
      id: 'cmbVacJobLevel',
      items: [
        { value: '', label: WiseI18n.t('(Pilih Jenjang Jabatan)') },
        { value: 'Director / C-Level', label: WiseI18n.t('Director / C-Level') },
        { value: 'Manager', label: WiseI18n.t('Manager') },
        { value: 'Supervisor', label: WiseI18n.t('Supervisor') },
        { value: 'Senior Staff / Specialist', label: WiseI18n.t('Senior Staff / Specialist') },
        { value: 'Staff / Entry Level', label: WiseI18n.t('Staff / Entry Level') },
        { value: 'Internship / Magang', label: WiseI18n.t('Internship / Magang') }
      ],
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellLvl.addControl(this.cmbJobLevel);
    infoGrid.setCell(2, 1, cellLvl);

    // Row 3: Lokasi Kerja & Tipe Kontrak
    const cellLoc = new WiseFrame('', { id: 'frmVacLoc' });
    cellLoc.addControl(new WiseLabel(WiseI18n.t('Lokasi Kerja'), { id: 'lblVacLoc', style: labelStyle }));
    this.cmbWorkLocation = new WiseComboBox('Kantor Pusat', {
      id: 'cmbVacLocation',
      items: [
        { value: 'Kantor Pusat', label: WiseI18n.t('Kantor Pusat (On-site)') },
        { value: 'Hybrid', label: WiseI18n.t('Hybrid') },
        { value: 'Remote', label: WiseI18n.t('Remote / WFH') },
        { value: 'Kantor Cabang', label: WiseI18n.t('Kantor Cabang') }
      ],
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellLoc.addControl(this.cmbWorkLocation);
    infoGrid.setCell(3, 0, cellLoc);

    const cellType = new WiseFrame('', { id: 'frmVacType' });
    cellType.addControl(new WiseLabel(WiseI18n.t('Status Kepegawaian'), { id: 'lblVacType', style: labelStyle }));
    this.cmbEmploymentType = new WiseComboBox('Tetap (PKWTT)', {
      id: 'cmbVacEmpType',
      items: [
        { value: 'Tetap (PKWTT)', label: WiseI18n.t('Tetap (PKWTT)') },
        { value: 'Kontrak (PKWT)', label: WiseI18n.t('Kontrak (PKWT)') },
        { value: 'Probation / Masa Percobaan', label: WiseI18n.t('Probation / Masa Percobaan') },
        { value: 'Magang (Internship)', label: WiseI18n.t('Magang (Internship)') },
        { value: 'Freelance / Mitra', label: WiseI18n.t('Freelance / Mitra') }
      ],
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellType.addControl(this.cmbEmploymentType);
    infoGrid.setCell(3, 1, cellType);

    // Row 4: Tanggal Aktif & Tanggal Berakhir
    const cellStart = new WiseFrame('', { id: 'frmVacStart' });
    cellStart.addControl(new WiseLabel(WiseI18n.t('Tanggal Aktif *'), { id: 'lblVacStart', style: labelStyle }));
    this.dtStartDate = new WiseDate(new Date().toISOString().slice(0, 10), {
      id: 'dtVacStartDate',
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellStart.addControl(this.dtStartDate);
    infoGrid.setCell(4, 0, cellStart);

    const cellEnd = new WiseFrame('', { id: 'frmVacEnd' });
    cellEnd.addControl(new WiseLabel(WiseI18n.t('Tanggal Berakhir *'), { id: 'lblVacEnd', style: labelStyle }));
    const defaultEnd = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    this.dtEndDate = new WiseDate(defaultEnd, {
      id: 'dtVacEndDate',
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellEnd.addControl(this.dtEndDate);
    infoGrid.setCell(4, 1, cellEnd);

    // Row 5: Deskripsi Lowongan (Span full width)
    const cellDesc = new WiseFrame('', { id: 'frmVacDesc' });
    cellDesc.addControl(new WiseLabel(WiseI18n.t('Deskripsi Lowongan, Kualifikasi & Tanggung Jawab'), { id: 'lblVacDesc', style: labelStyle }));
    this.txtDescription = new WiseTextArea('', {
      id: 'txtVacDescription',
      rows: 5,
      placeholder: WiseI18n.t('Tuliskan deskripsi peran, kualifikasi persyaratan, dan tanggung jawab pekerjaan...'),
      style: { ...inputBorderStyle, width: '100%', padding: '8px 10px' }
    });
    cellDesc.addControl(this.txtDescription);
    infoGrid.setCell(5, 0, cellDesc);

    panelInfo.addControl(infoGrid);
    this.tabControl.addTabContent('tabInfo', panelInfo);

    // --- TAB 2: Alur Proses Seleksi ---
    const panelStages = new WiseFrame('', { id: 'pnlVacancyStages', style: { padding: '8px 0' } });

    // Toolbar for Template Selector & Actions
    const templateToolbar = new WiseFrame('', {
      id: 'frmTemplateApplyBar',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        background: '#f8fafc',
        padding: '10px 14px',
        borderRadius: '6px',
        border: '1px solid #e2e8f0'
      }
    });

    templateToolbar.addControl(new WiseLabel(WiseI18n.t('Terapkan dari Template Alur:'), {
      id: 'lblTplSelector',
      style: { fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }
    }));

    this.cmbStageTemplate = new WiseComboBox('', {
      id: 'cmbStageTemplateSelector',
      items: [{ value: '', label: WiseI18n.t('(Pilih Template Alur Proses)') }],
      style: { ...inputBorderStyle, minWidth: '280px' }
    });
    templateToolbar.addControl(this.cmbStageTemplate);

    templateToolbar.addControl(new WiseButton(WiseI18n.t('📥 Terapkan Template'), {
      id: 'btnApplyTemplate',
      onClick: this.onApplyTemplateClick.bind(this),
      style: {
        background: 'var(--accent)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '7px 14px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    panelStages.addControl(templateToolbar);

    // Stage Action Buttons
    const stageActionToolbar = new WiseFrame('', {
      id: 'frmStageActionsToolbar',
      style: { display: 'flex', gap: '8px', marginBottom: '8px' }
    });

    stageActionToolbar.addControl(new WiseButton(WiseI18n.t('➕ Tambah Tahapan'), {
      id: 'btnStageAdd',
      onClick: this.onAddStageClick.bind(this),
      style: {
        background: 'var(--accent)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '7px 14px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    stageActionToolbar.addControl(new WiseButton(WiseI18n.t('✏️ Edit Tahapan'), {
      id: 'btnStageEdit',
      onClick: this.onEditStageClick.bind(this),
      style: {
        background: 'var(--accent-dark)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '7px 14px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    stageActionToolbar.addControl(new WiseButton(WiseI18n.t('🗑️ Hapus Tahapan'), {
      id: 'btnStageDelete',
      onClick: this.onDeleteStageClick.bind(this),
      style: {
        background: '#ef4444',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '7px 14px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    panelStages.addControl(stageActionToolbar);

    // Data Table for Stages
    this.dtStages = new WiseDataTable({
      id: 'dtVacancyStages',
      pageSize: 20,
      currentPage: 1,
      multiSelect: false,
      style: { width: '100%' },
      onRowSelect: this.onStageRowSelect.bind(this)
    });

    this.dtStages.columns = [
      { key: 'order', title: WiseI18n.t('Urutan'), width: '80px' },
      { key: 'name', title: WiseI18n.t('Nama Tahapan Seleksi'), width: '280px' },
      { key: 'matrixName', title: WiseI18n.t('Matriks Penilaian'), width: '260px' },
      { key: 'description', title: WiseI18n.t('Deskripsi / Panduan'), width: '320px' }
    ];

    panelStages.addControl(this.dtStages);
    this.tabControl.addTabContent('tabStages', panelStages);

    this.addControl(this.tabControl);

    // Bottom Action Buttons Bar
    const bottomBar = new WiseFrame('', {
      id: 'frmVacancyBottomBar',
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        marginTop: '12px',
        paddingTop: '10px',
        borderTop: '1px solid #e2e8f0'
      }
    });

    bottomBar.addControl(new WiseButton(WiseI18n.t('Batal'), {
      id: 'btnVacCancel',
      onClick: () => this.close(),
      style: {
        background: '#e2e8f0',
        color: '#334155',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 18px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    bottomBar.addControl(new WiseButton(WiseI18n.t('💾 Simpan Lowongan'), {
      id: 'btnVacSave',
      onClick: this.onSaveVacancyClick.bind(this),
      style: {
        background: 'var(--accent)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 20px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    this.addControl(bottomBar);

    return this;
  }

  async loadInitialData() {
    try {
      // 1. Load stage templates & matrix templates
      const [stageRes, matrixRes] = await Promise.all([
        api.listStageTemplates(),
        api.listMatrixTemplates()
      ]);

      this.stageTemplates = stageRes.rows || [];
      this.matrixTemplates = matrixRes.rows || [];

      if (this.cmbStageTemplate) {
        this.cmbStageTemplate.setItems([
          { value: '', label: WiseI18n.t('(Pilih Template Alur Proses)') },
          ...this.stageTemplates.map((t) => ({ value: String(t.id), label: `${t.name} (${(t.stages || []).length} tahapan)` }))
        ]);
      }

      // 2. If editing existing vacancy, load vacancy details
      if (this.selectedVacancyId) {
        const vac = await api.getVacancy(this.selectedVacancyId);
        this.currentVacancy = vac;

        if (this.txtTitle) this.txtTitle.setValue(vac.title || '');
        if (this.cmbStatus) this.cmbStatus.setValue(vac.status || 'ACTIVE');
        if (this.cmbDepartment) this.cmbDepartment.setValue(vac.department || '');
        if (this.txtDivision) this.txtDivision.setValue(vac.division || '');
        if (this.txtPosition) this.txtPosition.setValue(vac.position || '');
        if (this.cmbJobLevel) this.cmbJobLevel.setValue(vac.jobLevel || '');
        if (this.cmbWorkLocation) this.cmbWorkLocation.setValue(vac.workLocation || 'Kantor Pusat');
        if (this.cmbEmploymentType) this.cmbEmploymentType.setValue(vac.employmentType || 'Tetap (PKWTT)');
        if (this.dtStartDate) this.dtStartDate.setValue(vac.startDate || '');
        if (this.dtEndDate) this.dtEndDate.setValue(vac.endDate || '');
        if (this.txtDescription) this.txtDescription.setValue(vac.description || '');

        this.stagesList = Array.isArray(vac.stages) ? [...vac.stages] : [];
        this.renderStagesTable();
      }
    } catch (err) {
      this.showInfo(WiseI18n.t('Error'), err.message, 'error');
    }
  }

  renderStagesTable() {
    if (!this.dtStages) return;
    const sorted = [...this.stagesList].sort((a, b) => (a.order || 0) - (b.order || 0));
    this.stagesList = sorted;

    this.dtStages.data = sorted.map((s, idx) => ({
      order: s.order || (idx + 1),
      name: s.name || '-',
      matrixName: s.matrixTemplateName || (s.matrixTemplateId ? `Matriks #${s.matrixTemplateId}` : '-'),
      description: s.description || '-',
      _raw: s
    }));
    this.dtStages.totalCount = sorted.length;
  }

  onStageRowSelect() {
    this.selectedStageIndex = this.dtStages.selectedRowIndex;
  }

  async onApplyTemplateClick() {
    const tplId = this.cmbStageTemplate ? this.cmbStageTemplate.value : '';
    if (!tplId) {
      this.showInfo(WiseI18n.t('Pemberitahuan'), WiseI18n.t('Pilih salah satu template alur terlebih dahulu.'), 'warning');
      return;
    }

    const template = this.stageTemplates.find((t) => String(t.id) === String(tplId));
    if (!template || !Array.isArray(template.stages)) {
      this.showInfo(WiseI18n.t('Error'), WiseI18n.t('Data template tidak valid.'), 'error');
      return;
    }

    const conf = await this.confirm(
      WiseI18n.t('Terapkan Template'),
      `${WiseI18n.t('Terapkan alur tahapan dari template')} "${template.name}"? ${WiseI18n.t('Tahapan yang sudah ada saat ini akan digantikan.')}`
    );
    if (!conf) return;

    this.stagesList = template.stages.map((st, i) => ({
      id: `stg_${Date.now()}_${i}`,
      name: st.name,
      order: st.order || (i + 1),
      description: st.description || '',
      matrixTemplateId: st.matrixTemplateId || null,
      matrixTemplateName: st.matrixTemplateName || ''
    }));

    this.renderStagesTable();
    this.showInfo(WiseI18n.t('Sukses'), `${WiseI18n.t('Berhasil menerapkan')} ${this.stagesList.length} ${WiseI18n.t('tahapan dari template.')}`, 'success');
  }

  async onAddStageClick() {
    await this.openWindow(WinJobVacancyStageEdit, {
      data: null,
      matrixTemplates: this.matrixTemplates,
      onSaved: (newStage) => {
        newStage.order = this.stagesList.length + 1;
        this.stagesList.push(newStage);
        this.renderStagesTable();
      }
    });
  }

  async onEditStageClick() {
    const idx = this.dtStages.selectedRowIndex;
    if (idx === null || idx === undefined || idx < 0 || !this.stagesList[idx]) {
      this.showInfo(WiseI18n.t('Pemberitahuan'), WiseI18n.t('Pilih salah satu tahapan yang ingin diedit.'), 'warning');
      return;
    }

    const targetStage = this.stagesList[idx];
    await this.openWindow(WinJobVacancyStageEdit, {
      data: targetStage,
      matrixTemplates: this.matrixTemplates,
      onSaved: (updatedStage) => {
        this.stagesList[idx] = updatedStage;
        this.renderStagesTable();
      }
    });
  }

  async onDeleteStageClick() {
    const idx = this.dtStages.selectedRowIndex;
    if (idx === null || idx === undefined || idx < 0 || !this.stagesList[idx]) {
      this.showInfo(WiseI18n.t('Pemberitahuan'), WiseI18n.t('Pilih salah satu tahapan yang ingin dihapus.'), 'warning');
      return;
    }

    this.stagesList.splice(idx, 1);
    this.renderStagesTable();
  }

  async onSaveVacancyClick() {
    const title = this.txtTitle ? this.txtTitle.value.trim() : '';
    if (!title) {
      this.showInfo(WiseI18n.t('Validasi Form'), WiseI18n.t('Judul lowongan pekerjaan wajib diisi.'), 'warning');
      if (this.tabControl) this.tabControl.setActiveTab('tabInfo');
      return;
    }

    const payload = {
      title,
      department: this.cmbDepartment ? this.cmbDepartment.value : '',
      division: this.txtDivision ? this.txtDivision.value.trim() : '',
      position: this.txtPosition ? this.txtPosition.value.trim() : '',
      jobLevel: this.cmbJobLevel ? this.cmbJobLevel.value : '',
      workLocation: this.cmbWorkLocation ? this.cmbWorkLocation.value : 'Kantor Pusat',
      employmentType: this.cmbEmploymentType ? this.cmbEmploymentType.value : 'Tetap (PKWTT)',
      startDate: this.dtStartDate ? this.dtStartDate.value : null,
      endDate: this.dtEndDate ? this.dtEndDate.value : null,
      status: this.cmbStatus ? this.cmbStatus.value : 'ACTIVE',
      description: this.txtDescription ? this.txtDescription.value.trim() : '',
      stages: this.stagesList
    };

    try {
      if (this.selectedVacancyId) {
        await api.updateVacancy(this.selectedVacancyId, payload);
        this.showInfo(WiseI18n.t('Sukses'), WiseI18n.t('Lowongan pekerjaan berhasil diperbarui.'), 'success');
      } else {
        await api.createVacancy(payload);
        this.showInfo(WiseI18n.t('Sukses'), WiseI18n.t('Lowongan pekerjaan berhasil diposting.'), 'success');
      }

      if (typeof this.onSavedCallback === 'function') {
        this.onSavedCallback();
      }

      this.close();
    } catch (err) {
      this.showInfo(WiseI18n.t('Gagal Menyimpan'), err.message, 'error');
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinJobVacancyEdit;
