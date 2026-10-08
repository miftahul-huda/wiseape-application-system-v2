const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseNumericBox = require('../../../../system/controls/WiseNumericBox');
const WiseTextArea = require('../../../../system/controls/WiseTextArea');
const WiseComboBox = require('../../../../system/controls/WiseComboBox');
const WiseDate = require('../../../../system/controls/WiseDate');
const WiseTabControl = require('../../../../system/controls/WiseTabControl');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseFrame = require('../../../../system/controls/WiseFrame');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

const RecruitmentApiRepository = require('../services/RecruitmentApiRepository');
const api = new RecruitmentApiRepository();

class WinApplicantProcessEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.processId ? WiseI18n.t('Evaluasi & Update Proses Seleksi') : WiseI18n.t('Tambah Tahapan Seleksi Pelamar');
    this.appIcon = options.appIcon || '📝';
    this.width = options.width || '84%';
    this.height = options.height || '86%';
    this.centered = true;

    this.processId = options.processId || null;
    this.applicantId = options.applicantId || null;
    this.jobVacancyId = options.jobVacancyId || null;
    this.onSavedCallback = options.onSaved || null;

    this.currentProcess = null;
    this.matrixTemplates = [];
    this.evaluationMatrixList = [];
    this.documentsList = [];
  }

  onWindowInit() {
    this.controls = [];

    const inputBorderStyle = { border: '1px solid #94a3b8', borderRadius: '6px' };
    const labelStyle = { fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0px', lineHeight: '1.2' };

    // 1. Process Master Status & Info (3 cols x 2 rows)
    const masterGrid = new WiseTableLayout({
      rows: 2,
      columns: 3,
      id: 'tblProcMasterGrid',
      style: { tableLayout: 'fixed', width: '100%', borderSpacing: '8px', marginBottom: '12px' }
    });

    // Col 0, Row 0: Nama Tahapan
    const cellName = new WiseFrame('', { id: 'frmProcName' });
    cellName.addControl(new WiseLabel(WiseI18n.t('Nama Tahapan Proses *'), { id: 'lblProcName', style: labelStyle }));
    this.txtStageName = new WiseTextBox('', {
      id: 'txtProcStageName',
      placeholder: WiseI18n.t('Contoh: Interview User, Interview HRD, Coding Test'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellName.addControl(this.txtStageName);
    masterGrid.setCell(0, 0, cellName);

    // Col 1, Row 0: Status Proses (Not Starting, Ongoing, Done, Canceled)
    const cellStatus = new WiseFrame('', { id: 'frmProcStatus' });
    cellStatus.addControl(new WiseLabel(WiseI18n.t('Status Proses *'), { id: 'lblProcStatus', style: labelStyle }));
    this.cmbStatus = new WiseComboBox('Not Starting', {
      id: 'cmbProcStatus',
      items: [
        { value: 'Not Starting', label: WiseI18n.t('⚪ Not Starting (Belum Dimulai)') },
        { value: 'Ongoing', label: WiseI18n.t('🟡 Ongoing (Berlangsung)') },
        { value: 'Done', label: WiseI18n.t('🟢 Done (Selesai)') },
        { value: 'Canceled', label: WiseI18n.t('🔴 Canceled (Dibatalkan)') }
      ],
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellStatus.addControl(this.cmbStatus);
    masterGrid.setCell(0, 1, cellStatus);

    // Col 2, Row 0: Hasil Keputusan
    const cellResult = new WiseFrame('', { id: 'frmProcResult' });
    cellResult.addControl(new WiseLabel(WiseI18n.t('Hasil Keputusan *'), { id: 'lblProcResult', style: labelStyle }));
    this.cmbResult = new WiseComboBox('PENDING', {
      id: 'cmbProcResult',
      items: [
        { value: 'PENDING', label: WiseI18n.t('⏳ PENDING (Menunggu)') },
        { value: 'PASSED', label: WiseI18n.t('✅ PASSED (Lolos)') },
        { value: 'FAILED', label: WiseI18n.t('❌ FAILED (Tidak Lolos)') },
        { value: 'ON_HOLD', label: WiseI18n.t('⏸️ ON_HOLD (Ditunda)') }
      ],
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellResult.addControl(this.cmbResult);
    masterGrid.setCell(0, 2, cellResult);

    // Col 0, Row 1: Tanggal Jadwal
    const cellDate = new WiseFrame('', { id: 'frmProcDate' });
    cellDate.addControl(new WiseLabel(WiseI18n.t('Tanggal Jadwal Pelaksanaan'), { id: 'lblProcDate', style: labelStyle }));
    this.dtScheduledDate = new WiseDate(new Date().toISOString().slice(0, 10), {
      id: 'dtProcScheduledDate',
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellDate.addControl(this.dtScheduledDate);
    masterGrid.setCell(1, 0, cellDate);

    // Col 1, Row 1: Pewawancara / Evaluator
    const cellInterviewer = new WiseFrame('', { id: 'frmProcInterviewer' });
    cellInterviewer.addControl(new WiseLabel(WiseI18n.t('Pewawancara / Evaluator'), { id: 'lblProcInterviewer', style: labelStyle }));
    this.txtInterviewer = new WiseTextBox('', {
      id: 'txtProcInterviewer',
      placeholder: WiseI18n.t('Nama evaluator atau tim penguji...'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellInterviewer.addControl(this.txtInterviewer);
    masterGrid.setCell(1, 1, cellInterviewer);

    // Col 2, Row 1: Skor Akhir
    const cellScore = new WiseFrame('', { id: 'frmProcScore' });
    cellScore.addControl(new WiseLabel(WiseI18n.t('Skor Akhir Evaluasi (0 - 100)'), { id: 'lblProcScore', style: labelStyle }));
    this.numScore = new WiseNumericBox(0, {
      id: 'numProcOverallScore',
      min: 0,
      max: 100,
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellScore.addControl(this.numScore);
    masterGrid.setCell(1, 2, cellScore);

    this.addControl(masterGrid);

    // 2. Tab Control: Evaluation Matrix, Comments, Documents
    this.tabControl = new WiseTabControl({
      id: 'tabApplicantProcess',
      tabs: [
        { id: 'tabMatrix', title: WiseI18n.t('📊 Matriks Hasil Penilaian') },
        { id: 'tabComments', title: WiseI18n.t('💬 Komentar & Catatan Evaluator') },
        { id: 'tabDocs', title: WiseI18n.t('📎 Dokumen Lampiran') }
      ],
      activeTab: 'tabMatrix',
      style: { width: '100%', marginBottom: '14px' }
    });

    // --- TAB 1: Matriks Hasil Penilaian ---
    const panelMatrix = new WiseFrame('', { id: 'pnlProcMatrix', style: { padding: '8px 0' } });

    // Toolbar for loading from matrix template
    const matrixToolbar = new WiseFrame('', {
      id: 'frmProcMatrixTplBar',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
        background: '#f8fafc',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #e2e8f0'
      }
    });

    matrixToolbar.addControl(new WiseLabel(WiseI18n.t('Terapkan Template Matriks:'), {
      id: 'lblProcTplSelect',
      style: { fontWeight: 600, color: '#334155' }
    }));

    this.cmbMatrixSelector = new WiseComboBox('', {
      id: 'cmbProcMatrixTemplateSelector',
      items: [{ value: '', label: WiseI18n.t('(Pilih Template Matriks)') }],
      style: { ...inputBorderStyle, minWidth: '280px' }
    });
    matrixToolbar.addControl(this.cmbMatrixSelector);

    matrixToolbar.addControl(new WiseButton(WiseI18n.t('📥 Terapkan Kriteria'), {
      id: 'btnProcApplyMatrix',
      onClick: this.onApplyMatrixTemplateClick.bind(this),
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

    matrixToolbar.addControl(new WiseButton(WiseI18n.t('🧮 Hitung Skor Akhir'), {
      id: 'btnProcCalculateScore',
      onClick: this.onCalculateScoreClick.bind(this),
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

    panelMatrix.addControl(matrixToolbar);

    // Data Table for Evaluation Matrix
    this.dtMatrix = new WiseDataTable({
      id: 'dtProcEvaluationMatrix',
      pageSize: 20,
      currentPage: 1,
      multiSelect: false,
      style: { width: '100%' }
    });

    this.dtMatrix.columns = [
      { key: 'no', title: WiseI18n.t('No'), width: '50px' },
      { key: 'criterion', title: WiseI18n.t('Kriteria Penilaian'), width: '280px' },
      { key: 'weightBadge', title: WiseI18n.t('Bobot (%)'), width: '90px' },
      { key: 'score', title: WiseI18n.t('Skor Nilai'), width: '100px' },
      { key: 'maxScore', title: WiseI18n.t('Maks'), width: '70px' },
      { key: 'notes', title: WiseI18n.t('Catatan Penilai Per Kriteria'), width: '320px' }
    ];

    panelMatrix.addControl(this.dtMatrix);

    // Inputs to edit individual criterion score
    const editScoreBar = new WiseFrame('', {
      id: 'frmEditScoreBar',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '10px',
        padding: '10px 14px',
        background: 'color-mix(in srgb, var(--accent) 6%, white)',
        borderRadius: '6px',
        border: '1px solid #cbd5e1'
      }
    });

    editScoreBar.addControl(new WiseLabel(WiseI18n.t('Update Skor Baris Terpilih:'), {
      id: 'lblUpdateScoreTitle',
      style: { fontWeight: 600, color: 'var(--accent-dark)' }
    }));

    this.numRowScore = new WiseNumericBox(80, {
      id: 'numRowScoreInput',
      min: 0,
      max: 100,
      style: { ...inputBorderStyle, width: '90px', padding: '6px 8px' }
    });
    editScoreBar.addControl(this.numRowScore);

    this.txtRowNotes = new WiseTextBox('', {
      id: 'txtRowNotesInput',
      placeholder: WiseI18n.t('Catatan penilaian kriteria...'),
      style: { ...inputBorderStyle, flex: '1', padding: '6px 10px' }
    });
    editScoreBar.addControl(this.txtRowNotes);

    editScoreBar.addControl(new WiseButton(WiseI18n.t('Simpan Skor Kriteria'), {
      id: 'btnSaveRowScore',
      onClick: this.onSaveRowScoreClick.bind(this),
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

    panelMatrix.addControl(editScoreBar);
    this.tabControl.addTabContent('tabMatrix', panelMatrix);

    // --- TAB 2: Komentar & Catatan Evaluator ---
    const panelComments = new WiseFrame('', { id: 'pnlProcComments', style: { padding: '8px 0' } });
    panelComments.addControl(new WiseLabel(WiseI18n.t('Komentar & Catatan Penilai Keseluruhan'), { id: 'lblProcComments', style: labelStyle }));
    this.txtComments = new WiseTextArea('', {
      id: 'txtProcComments',
      rows: 8,
      placeholder: WiseI18n.t('Tuliskan catatan menyeluruh mengenai performa kandidat, kekuatan, area perbaikan, dan rekomendasi keputusan...'),
      style: { ...inputBorderStyle, width: '100%', padding: '10px' }
    });
    panelComments.addControl(this.txtComments);
    this.tabControl.addTabContent('tabComments', panelComments);

    // --- TAB 3: Dokumen Lampiran ---
    const panelDocs = new WiseFrame('', { id: 'pnlProcDocs', style: { padding: '8px 0' } });

    // Upload row
    const uploadBar = new WiseFrame('', {
      id: 'frmProcUploadBar',
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

    uploadBar.addControl(new WiseLabel(WiseI18n.t('Nama Dokumen:'), {
      id: 'lblDocUploadTitle',
      style: { fontWeight: 600, color: '#334155' }
    }));

    this.txtDocName = new WiseTextBox('', {
      id: 'txtProcDocName',
      placeholder: WiseI18n.t('Contoh: Lembar Evaluasi Wawancara, Hasil Tes Coding'),
      style: { ...inputBorderStyle, width: '280px', padding: '6px 10px' }
    });
    uploadBar.addControl(this.txtDocName);

    this.txtDocFile = new WiseTextBox('', {
      id: 'txtProcDocFileName',
      placeholder: WiseI18n.t('URL Dokumen / File Lampiran'),
      style: { ...inputBorderStyle, flex: '1', padding: '6px 10px' }
    });
    uploadBar.addControl(this.txtDocFile);

    uploadBar.addControl(new WiseButton(WiseI18n.t('📎 Tambah Lampiran'), {
      id: 'btnAddDocAttachment',
      onClick: this.onAddDocumentAttachmentClick.bind(this),
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

    panelDocs.addControl(uploadBar);

    // Data Table for Documents
    this.dtDocs = new WiseDataTable({
      id: 'dtProcDocuments',
      pageSize: 10,
      currentPage: 1,
      multiSelect: false,
      style: { width: '100%' }
    });

    this.dtDocs.columns = [
      { key: 'no', title: WiseI18n.t('No'), width: '50px' },
      { key: 'name', title: WiseI18n.t('Nama Dokumen'), width: '320px' },
      { key: 'fileUrl', title: WiseI18n.t('Lokasi / Link Berkas'), width: '380px' },
      { key: 'uploadedAt', title: WiseI18n.t('Waktu Unggah'), width: '180px' }
    ];

    panelDocs.addControl(this.dtDocs);
    this.tabControl.addTabContent('tabDocs', panelDocs);

    this.addControl(this.tabControl);

    // Bottom Action Buttons Bar
    const bottomBar = new WiseFrame('', {
      id: 'frmProcBottomBar',
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        paddingTop: '10px',
        borderTop: '1px solid #e2e8f0'
      }
    });

    bottomBar.addControl(new WiseButton(WiseI18n.t('Batal'), {
      id: 'btnProcCancel',
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

    bottomBar.addControl(new WiseButton(WiseI18n.t('💾 Simpan Hasil Proses'), {
      id: 'btnProcSave',
      onClick: this.onSaveClick.bind(this),
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
      const matrixRes = await api.listMatrixTemplates();
      this.matrixTemplates = matrixRes.rows || [];

      if (this.cmbMatrixSelector) {
        this.cmbMatrixSelector.setItems([
          { value: '', label: WiseI18n.t('(Pilih Template Matriks)') },
          ...this.matrixTemplates.map((m) => ({ value: String(m.id), label: `${m.name} (${(m.criteria || []).length} kriteria)` }))
        ]);
      }

      if (this.processId) {
        const proc = await api.getProcess(this.processId);
        this.currentProcess = proc;

        if (this.txtStageName) this.txtStageName.setValue(proc.stageName || '');
        if (this.cmbStatus) this.cmbStatus.setValue(proc.status || 'Not Starting');
        if (this.cmbResult) this.cmbResult.setValue(proc.result || 'PENDING');
        if (this.dtScheduledDate) this.dtScheduledDate.setValue(proc.scheduledDate || '');
        if (this.txtInterviewer) this.txtInterviewer.setValue(proc.interviewerName || '');
        if (this.numScore) this.numScore.setValue(proc.overallScore || 0);
        if (this.txtComments) this.txtComments.setValue(proc.comments || '');

        this.evaluationMatrixList = Array.isArray(proc.evaluationMatrix) ? [...proc.evaluationMatrix] : [];
        this.documentsList = Array.isArray(proc.documents) ? [...proc.documents] : [];

        this.renderMatrixTable();
        this.renderDocsTable();
      }
    } catch (err) {
      this.showInfo(WiseI18n.t('Error'), err.message, 'error');
    }
  }

  renderMatrixTable() {
    if (!this.dtMatrix) return;

    this.dtMatrix.data = this.evaluationMatrixList.map((m, idx) => ({
      no: idx + 1,
      criterion: m.criterion || '-',
      weightBadge: `${m.weight || 0} %`,
      score: m.score !== undefined && m.score !== null ? m.score : '-',
      maxScore: m.maxScore || 100,
      notes: m.notes || '-',
      _raw: m
    }));
    this.dtMatrix.totalCount = this.evaluationMatrixList.length;
  }

  renderDocsTable() {
    if (!this.dtDocs) return;

    this.dtDocs.data = this.documentsList.map((d, idx) => ({
      no: idx + 1,
      name: d.name || '-',
      fileUrl: d.fileUrl || '-',
      uploadedAt: d.uploadedAt ? d.uploadedAt.slice(0, 10) : '-',
      _raw: d
    }));
    this.dtDocs.totalCount = this.documentsList.length;
  }

  onSaveRowScoreClick() {
    const idx = this.dtMatrix.selectedRowIndex;
    if (idx === null || idx === undefined || idx < 0 || !this.evaluationMatrixList[idx]) {
      this.showInfo(WiseI18n.t('Pemberitahuan'), WiseI18n.t('Pilih salah satu baris kriteria penilaian pada tabel terlebih dahulu.'), 'warning');
      return;
    }

    const score = this.numRowScore ? parseFloat(this.numRowScore.value) || 0 : 0;
    const notes = this.txtRowNotes ? this.txtRowNotes.value.trim() : '';

    this.evaluationMatrixList[idx].score = score;
    this.evaluationMatrixList[idx].notes = notes;

    this.renderMatrixTable();
    this.onCalculateScoreClick();
  }

  onApplyMatrixTemplateClick() {
    const matrixIdStr = this.cmbMatrixSelector ? this.cmbMatrixSelector.value : '';
    if (!matrixIdStr) {
      this.showInfo(WiseI18n.t('Pemberitahuan'), WiseI18n.t('Pilih salah satu template matriks terlebih dahulu.'), 'warning');
      return;
    }

    const tpl = this.matrixTemplates.find((m) => String(m.id) === String(matrixIdStr));
    if (!tpl || !Array.isArray(tpl.criteria)) {
      this.showInfo(WiseI18n.t('Error'), WiseI18n.t('Data matriks tidak valid.'), 'error');
      return;
    }

    this.evaluationMatrixList = tpl.criteria.map((c) => ({
      criterion: c.criterion,
      weight: c.weight,
      score: 80, // initial default score
      maxScore: c.maxScore || 100,
      notes: c.description || ''
    }));

    this.renderMatrixTable();
    this.onCalculateScoreClick();
    this.showInfo(WiseI18n.t('Sukses'), `${WiseI18n.t('Berhasil menerapkan')} ${this.evaluationMatrixList.length} ${WiseI18n.t('kriteria penilaian dari template.')}`, 'success');
  }

  onCalculateScoreClick() {
    if (this.evaluationMatrixList.length === 0) return;

    let totalWeight = 0;
    let weightedSum = 0;

    this.evaluationMatrixList.forEach((item) => {
      const w = parseFloat(item.weight) || 0;
      const s = parseFloat(item.score) || 0;
      totalWeight += w;
      weightedSum += (s * w);
    });

    const finalScore = totalWeight > 0 ? (weightedSum / totalWeight) : 0;
    const rounded = Math.round(finalScore * 10) / 10;

    if (this.numScore) {
      this.numScore.setValue(rounded);
    }

    // Auto set decision if score above/below threshold
    if (rounded >= 75) {
      if (this.cmbResult) this.cmbResult.setValue('PASSED');
    } else if (rounded > 0 && rounded < 70) {
      if (this.cmbResult) this.cmbResult.setValue('FAILED');
    }
  }

  onAddDocumentAttachmentClick() {
    const docName = this.txtDocName ? this.txtDocName.value.trim() : '';
    const fileUrl = this.txtDocFile ? this.txtDocFile.value.trim() : '';

    if (!docName) {
      this.showInfo(WiseI18n.t('Validasi'), WiseI18n.t('Nama dokumen lampiran wajib diisi.'), 'warning');
      return;
    }

    this.documentsList.push({
      id: Date.now().toString(),
      name: docName,
      fileUrl: fileUrl || `Dokumen_${Date.now()}.pdf`,
      uploadedAt: new Date().toISOString()
    });

    if (this.txtDocName) this.txtDocName.setValue('');
    if (this.txtDocFile) this.txtDocFile.setValue('');

    this.renderDocsTable();
  }

  async onSaveClick() {
    const stageName = this.txtStageName ? this.txtStageName.value.trim() : '';
    if (!stageName) {
      this.showInfo(WiseI18n.t('Validasi'), WiseI18n.t('Nama tahapan proses seleksi wajib diisi.'), 'warning');
      return;
    }

    const payload = {
      applicantId: this.applicantId,
      jobVacancyId: this.jobVacancyId,
      stageName,
      status: this.cmbStatus ? this.cmbStatus.value : 'Not Starting',
      result: this.cmbResult ? this.cmbResult.value : 'PENDING',
      scheduledDate: this.dtScheduledDate ? this.dtScheduledDate.value : null,
      interviewerName: this.txtInterviewer ? this.txtInterviewer.value.trim() : null,
      overallScore: this.numScore ? parseFloat(this.numScore.value) || 0 : 0,
      comments: this.txtComments ? this.txtComments.value.trim() : '',
      evaluationMatrix: this.evaluationMatrixList,
      documents: this.documentsList
    };

    try {
      if (this.processId) {
        await api.updateProcess(this.processId, payload);
        this.showInfo(WiseI18n.t('Sukses'), WiseI18n.t('Data proses dan matriks hasil evaluasi berhasil disimpan.'), 'success');
      } else {
        await api.createProcess(payload);
        this.showInfo(WiseI18n.t('Sukses'), WiseI18n.t('Tahapan seleksi baru berhasil ditambahkan.'), 'success');
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

module.exports = WinApplicantProcessEdit;
