import {
  WiseWindow,
  WiseLabel,
  WiseButton,
  WiseTextBox,
  WiseNumericBox,
  WiseTextArea,
  WiseComboBox,
  WiseDate,
  WiseTabControl,
  WiseDataTable,
  WiseFrame,
  WiseTableLayout,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

import RecruitmentApiRepository from '../services/RecruitmentApiRepository';
const api = new RecruitmentApiRepository();

class WinApplicantProcessEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.processId ? WiseI18n.t('EVALUASI_UPDATE_PROSES_SELEKSI') : WiseI18n.t('TAMBAH_TAHAPAN_SELEKSI_PELAMAR');
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

    // 1. Process Master Status & Info (3 cols x 2 rows)
    const masterGrid = new WiseTableLayout({
      rows: 2,
      columns: 3,
      id: 'tblProcMasterGrid',
      style: { tableLayout: 'fixed', width: '100%', borderSpacing: '8px', marginBottom: '12px' }
    });

    // Col 0, Row 0: Nama Tahapan
    this.txtStageName = new WiseTextBox('', {
      id: 'txtProcStageName',
      label: WiseI18n.t('NAMA_TAHAPAN_PROSES'),
      datafield: 'stageName',
      placeholder: WiseI18n.t('CONTOH_INTERVIEW_USER_INTERVIEW_HRD_CODING_TEST'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    masterGrid.setCell(0, 0, this.txtStageName);

    // Col 1, Row 0: Status Proses (Not Starting, Ongoing, Done, Canceled)
    this.cmbStatus = new WiseComboBox('Not Starting', {
      id: 'cmbProcStatus',
      label: WiseI18n.t('STATUS_PROSES_2'),
      datafield: 'status',
      items: [
        { value: 'Not Starting', label: WiseI18n.t('NOT_STARTING_BELUM_DIMULAI') },
        { value: 'Ongoing', label: WiseI18n.t('ONGOING_BERLANGSUNG') },
        { value: 'Done', label: WiseI18n.t('DONE_SELESAI') },
        { value: 'Canceled', label: WiseI18n.t('CANCELED_DIBATALKAN') }
      ],
      style: { ...inputBorderStyle, width: '100%' }
    });
    masterGrid.setCell(0, 1, this.cmbStatus);

    // Col 2, Row 0: Hasil Keputusan
    this.cmbResult = new WiseComboBox('PENDING', {
      id: 'cmbProcResult',
      label: WiseI18n.t('HASIL_KEPUTUSAN_2'),
      datafield: 'result',
      items: [
        { value: 'PENDING', label: WiseI18n.t('PENDING_MENUNGGU') },
        { value: 'PASSED', label: WiseI18n.t('PASSED_LOLOS') },
        { value: 'FAILED', label: WiseI18n.t('FAILED_TIDAK_LOLOS') },
        { value: 'ON_HOLD', label: WiseI18n.t('ON_HOLD_DITUNDA_2') }
      ],
      style: { ...inputBorderStyle, width: '100%' }
    });
    masterGrid.setCell(0, 2, this.cmbResult);

    // Col 0, Row 1: Tanggal Jadwal
    this.dtScheduledDate = new WiseDate(new Date().toISOString().slice(0, 10), {
      id: 'dtProcScheduledDate',
      label: WiseI18n.t('TANGGAL_JADWAL_PELAKSANAAN'),
      datafield: 'scheduledDate',
      style: { ...inputBorderStyle, width: '100%' }
    });
    masterGrid.setCell(1, 0, this.dtScheduledDate);

    // Col 1, Row 1: Pewawancara / Evaluator
    this.txtInterviewer = new WiseTextBox('', {
      id: 'txtProcInterviewer',
      label: WiseI18n.t('PEWAWANCARA_EVALUATOR'),
      datafield: 'interviewerName',
      placeholder: WiseI18n.t('NAMA_EVALUATOR_ATAU_TIM_PENGUJI'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    masterGrid.setCell(1, 1, this.txtInterviewer);

    // Col 2, Row 1: Skor Akhir
    this.numScore = new WiseNumericBox(0, {
      id: 'numProcOverallScore',
      label: WiseI18n.t('SKOR_AKHIR_EVALUASI_0_100'),
      datafield: 'overallScore',
      min: 0,
      max: 100,
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    masterGrid.setCell(1, 2, this.numScore);

    this.addControl(masterGrid);

    // 2. Tab Control: Evaluation Matrix, Comments, Documents
    this.tabControl = new WiseTabControl({
      id: 'tabApplicantProcess',
      tabs: [
        { id: 'tabMatrix', title: WiseI18n.t('MATRIKS_HASIL_PENILAIAN') },
        { id: 'tabComments', title: WiseI18n.t('KOMENTAR_CATATAN_EVALUATOR') },
        { id: 'tabDocs', title: WiseI18n.t('DOKUMEN_LAMPIRAN_2') }
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
        alignItems: 'flex-end',
        gap: '8px',
        marginBottom: '10px',
        background: '#f8fafc',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #e2e8f0'
      }
    });

    this.cmbMatrixSelector = new WiseComboBox('', {
      id: 'cmbProcMatrixTemplateSelector',
      label: WiseI18n.t('TERAPKAN_TEMPLATE_MATRIKS'),
      items: [{ value: '', label: WiseI18n.t('PILIH_TEMPLATE_MATRIKS') }],
      style: { ...inputBorderStyle, minWidth: '280px' }
    });
    matrixToolbar.addControl(this.cmbMatrixSelector);

    matrixToolbar.addControl(new WiseButton(WiseI18n.t('TERAPKAN_KRITERIA'), {
      id: 'btnProcApplyMatrix',
      onClick: this.onApplyMatrixTemplateClick.bind(this)
    }));

    matrixToolbar.addControl(new WiseButton(WiseI18n.t('HITUNG_SKOR_AKHIR'), {
      id: 'btnProcCalculateScore',
      onClick: this.onCalculateScoreClick.bind(this),
      style: {
        background: 'var(--accent-dark)',
        color: '#ffffff'
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
      { key: 'no', title: WiseI18n.t('NO'), width: '50px' },
      { key: 'criterion', title: WiseI18n.t('KRITERIA_PENILAIAN'), width: '280px' },
      { key: 'weightBadge', title: WiseI18n.t('BOBOT'), width: '90px' },
      { key: 'score', title: WiseI18n.t('SKOR_NILAI'), width: '100px' },
      { key: 'maxScore', title: WiseI18n.t('MAKS'), width: '70px' },
      { key: 'notes', title: WiseI18n.t('CATATAN_PENILAI_PER_KRITERIA'), width: '320px' }
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

    editScoreBar.addControl(new WiseLabel(WiseI18n.t('UPDATE_SKOR_BARIS_TERPILIH'), {
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
      placeholder: WiseI18n.t('CATATAN_PENILAIAN_KRITERIA'),
      style: { ...inputBorderStyle, flex: '1', padding: '6px 10px' }
    });
    editScoreBar.addControl(this.txtRowNotes);

    editScoreBar.addControl(new WiseButton(WiseI18n.t('SIMPAN_SKOR_KRITERIA'), {
      id: 'btnSaveRowScore',
      onClick: this.onSaveRowScoreClick.bind(this)
    }));

    panelMatrix.addControl(editScoreBar);
    this.tabControl.addTabContent('tabMatrix', panelMatrix);

    // --- TAB 2: Komentar & Catatan Evaluator ---
    const panelComments = new WiseFrame('', { id: 'pnlProcComments', style: { padding: '8px 0' } });
    this.txtComments = new WiseTextArea('', {
      id: 'txtProcComments',
      label: WiseI18n.t('KOMENTAR_CATATAN_PENILAI_KESELURUHAN'),
      datafield: 'comments',
      rows: 8,
      placeholder: WiseI18n.t('TULISKAN_CATATAN_MENYELURUH_MENGENAI_PERFORMA_KANDIDAT'),
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
        alignItems: 'flex-end',
        gap: '8px',
        marginBottom: '12px',
        background: '#f8fafc',
        padding: '10px 14px',
        borderRadius: '6px',
        border: '1px solid #e2e8f0'
      }
    });

    this.txtDocName = new WiseTextBox('', {
      id: 'txtProcDocName',
      label: WiseI18n.t('NAMA_DOKUMEN'),
      placeholder: WiseI18n.t('CONTOH_LEMBAR_EVALUASI_WAWANCARA_HASIL_TES_CODING'),
      style: { ...inputBorderStyle, width: '280px', padding: '6px 10px' }
    });
    uploadBar.addControl(this.txtDocName);

    this.txtDocFile = new WiseTextBox('', {
      id: 'txtProcDocFileName',
      placeholder: WiseI18n.t('URL_DOKUMEN_FILE_LAMPIRAN'),
      style: { ...inputBorderStyle, flex: '1', padding: '6px 10px' }
    });
    uploadBar.addControl(this.txtDocFile);

    uploadBar.addControl(new WiseButton(WiseI18n.t('TAMBAH_LAMPIRAN'), {
      id: 'btnAddDocAttachment',
      onClick: this.onAddDocumentAttachmentClick.bind(this)
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
      { key: 'no', title: WiseI18n.t('NO'), width: '50px' },
      { key: 'name', title: WiseI18n.t('NAMA_DOKUMEN_2'), width: '320px' },
      { key: 'fileUrl', title: WiseI18n.t('LOKASI_LINK_BERKAS'), width: '380px' },
      { key: 'uploadedAt', title: WiseI18n.t('WAKTU_UNGGAH'), width: '180px' }
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

    bottomBar.addControl(new WiseButton(WiseI18n.t('SIMPAN_HASIL_PROSES'), {
      id: 'btnProcSave',
      onClick: this.onSaveClick.bind(this)
    }));

    bottomBar.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnProcCancel',
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
      const matrixRes = await api.listMatrixTemplates();
      this.matrixTemplates = matrixRes.rows || [];

      if (this.cmbMatrixSelector) {
        this.cmbMatrixSelector.setItems([
          { value: '', label: WiseI18n.t('PILIH_TEMPLATE_MATRIKS') },
          ...this.matrixTemplates.map((m) => ({ value: String(m.id), label: `${m.name} (${(m.criteria || []).length} kriteria)` }))
        ]);
      }

      if (this.processId) {
        const proc = await api.getProcess(this.processId);
        this.currentProcess = proc;

        this.populate(proc);

        this.evaluationMatrixList = Array.isArray(proc.evaluationMatrix) ? [...proc.evaluationMatrix] : [];
        this.documentsList = Array.isArray(proc.documents) ? [...proc.documents] : [];

        this.renderMatrixTable();
        this.renderDocsTable();
      }
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
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
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_BARIS_KRITERIA_PENILAIAN_PADA_TABEL'), 'warning');
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
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_TEMPLATE_MATRIKS_TERLEBIH_DAHULU'), 'warning');
      return;
    }

    const tpl = this.matrixTemplates.find((m) => String(m.id) === String(matrixIdStr));
    if (!tpl || !Array.isArray(tpl.criteria)) {
      this.showInfo(WiseI18n.t('ERROR'), WiseI18n.t('DATA_MATRIKS_TIDAK_VALID'), 'error');
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
    this.showInfo(WiseI18n.t('SUKSES'), `${WiseI18n.t('BERHASIL_MENERAPKAN')} ${this.evaluationMatrixList.length} ${WiseI18n.t('KRITERIA_PENILAIAN_DARI_TEMPLATE')}`, 'success');
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
      this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('NAMA_DOKUMEN_LAMPIRAN_WAJIB_DIISI'), 'warning');
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
    const values = this.getValues();
    const stageName = (values.stageName || '').trim();
    if (!stageName) {
      this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('NAMA_TAHAPAN_PROSES_SELEKSI_WAJIB_DIISI'), 'warning');
      return;
    }

    const payload = {
      applicantId: this.applicantId,
      jobVacancyId: this.jobVacancyId,
      stageName,
      status: values.status || 'Not Starting',
      result: values.result || 'PENDING',
      scheduledDate: values.scheduledDate || null,
      interviewerName: (values.interviewerName || '').trim() || null,
      overallScore: parseFloat(values.overallScore) || 0,
      comments: (values.comments || '').trim(),
      evaluationMatrix: this.evaluationMatrixList,
      documents: this.documentsList
    };

    try {
      if (this.processId) {
        await api.updateProcess(this.processId, payload);
        this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('DATA_PROSES_DAN_MATRIKS_HASIL_EVALUASI_BERHASIL_DISIMPAN'), 'success');
      } else {
        await api.createProcess(payload);
        this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('TAHAPAN_SELEKSI_BARU_BERHASIL_DITAMBAHKAN'), 'success');
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

export default WinApplicantProcessEdit;
