const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseFrame = require('../../../../system/controls/WiseFrame');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

const WinApplicantProcessEdit = require('./WinApplicantProcessEdit');
const RecruitmentApiRepository = require('../services/RecruitmentApiRepository');
const api = new RecruitmentApiRepository();

class WinApplicantDetail extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('Detail Pelamar & Alur Proses Seleksi — Wise Recruitment');
    this.appIcon = options.appIcon || '👤';
    this.width = options.width || '92%';
    this.height = options.height || '88%';
    this.centered = true;

    this.applicantId = options.applicantId || null;
    this.currentApplicant = null;
    this.processesList = [];
    this.selectedProcess = null;
  }

  onWindowInit() {
    this.controls = [];

    // 1. Applicant Profile Summary Info Frame (Clean, unadorned header)
    this.frmProfileSummary = new WiseFrame('', {
      id: 'frmApplicantSummary',
      style: {
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '14px'
      }
    });

    const summaryGrid = new WiseTableLayout({
      rows: 2,
      columns: 4,
      id: 'tblApplicantSummaryGrid',
      style: { tableLayout: 'fixed', width: '100%' }
    });

    const infoLabelStyle = { color: '#64748b', display: 'block' };
    const infoValueStyle = { fontWeight: 700, color: '#1e293b', display: 'block', marginTop: '2px' };

    // Row 0 Col 0: Nama & No Pelamar
    const cName = new WiseFrame('', { id: 'frmSumName' });
    cName.addControl(new WiseLabel(WiseI18n.t('Nama Lengkap Pelamar'), { id: 'lblSumNameLabel', style: infoLabelStyle }));
    this.lblSumName = new WiseLabel('-', { id: 'lblSumNameVal', style: { ...infoValueStyle, color: 'var(--accent-dark)' } });
    cName.addControl(this.lblSumName);
    summaryGrid.setCell(0, 0, cName);

    // Row 0 Col 1: Lowongan
    const cVac = new WiseFrame('', { id: 'frmSumVac' });
    cVac.addControl(new WiseLabel(WiseI18n.t('Lowongan Pekerjaan Target'), { id: 'lblSumVacLabel', style: infoLabelStyle }));
    this.lblSumVac = new WiseLabel('-', { id: 'lblSumVacVal', style: infoValueStyle });
    cVac.addControl(this.lblSumVac);
    summaryGrid.setCell(0, 1, cVac);

    // Row 0 Col 2: Kontak
    const cContact = new WiseFrame('', { id: 'frmSumContact' });
    cContact.addControl(new WiseLabel(WiseI18n.t('Email & Kontak Telepon'), { id: 'lblSumContactLabel', style: infoLabelStyle }));
    this.lblSumContact = new WiseLabel('-', { id: 'lblSumContactVal', style: infoValueStyle });
    cContact.addControl(this.lblSumContact);
    summaryGrid.setCell(0, 2, cContact);

    // Row 0 Col 3: Status Pelamar
    const cStatus = new WiseFrame('', { id: 'frmSumStatus' });
    cStatus.addControl(new WiseLabel(WiseI18n.t('Status Pelamar'), { id: 'lblSumStatusLabel', style: infoLabelStyle }));
    this.lblSumStatus = new WiseLabel('-', { id: 'lblSumStatusVal', style: infoValueStyle });
    cStatus.addControl(this.lblSumStatus);
    summaryGrid.setCell(0, 3, cStatus);

    // Row 1 Col 0: Pendidikan
    const cEdu = new WiseFrame('', { id: 'frmSumEdu' });
    cEdu.addControl(new WiseLabel(WiseI18n.t('Pendidikan & Jurusan'), { id: 'lblSumEduLabel', style: infoLabelStyle }));
    this.lblSumEdu = new WiseLabel('-', { id: 'lblSumEduVal', style: infoValueStyle });
    cEdu.addControl(this.lblSumEdu);
    summaryGrid.setCell(1, 0, cEdu);

    // Row 1 Col 1: Pengalaman Terakhir
    const cExp = new WiseFrame('', { id: 'frmSumExp' });
    cExp.addControl(new WiseLabel(WiseI18n.t('Perusahaan / Posisi Terakhir'), { id: 'lblSumExpLabel', style: infoLabelStyle }));
    this.lblSumExp = new WiseLabel('-', { id: 'lblSumExpVal', style: infoValueStyle });
    cExp.addControl(this.lblSumExp);
    summaryGrid.setCell(1, 1, cExp);

    // Row 1 Col 2: Gaji yang Diharapkan
    const cSal = new WiseFrame('', { id: 'frmSumSal' });
    cSal.addControl(new WiseLabel(WiseI18n.t('Ekspektasi Gaji'), { id: 'lblSumSalLabel', style: infoLabelStyle }));
    this.lblSumSal = new WiseLabel('-', { id: 'lblSumSalVal', style: infoValueStyle });
    cSal.addControl(this.lblSumSal);
    summaryGrid.setCell(1, 2, cSal);

    // Row 1 Col 3: Tanggal Lamar
    const cDate = new WiseFrame('', { id: 'frmSumDate' });
    cDate.addControl(new WiseLabel(WiseI18n.t('Tanggal Melamar'), { id: 'lblSumDateLabel', style: infoLabelStyle }));
    this.lblSumDate = new WiseLabel('-', { id: 'lblSumDateVal', style: infoValueStyle });
    cDate.addControl(this.lblSumDate);
    summaryGrid.setCell(1, 3, cDate);

    this.frmProfileSummary.addControl(summaryGrid);
    this.addControl(this.frmProfileSummary);

    // 2. Section Heading & Actions Toolbar
    this.addControl(new WiseLabel(WiseI18n.t('Alur & Tahapan Proses Seleksi Pelamar (Recruitment Stages)'), {
      id: 'lblProcListHeading',
      style: { fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }
    }));

    const actionToolbar = new WiseFrame('', {
      id: 'frmApplicantProcActions',
      style: { display: 'flex', gap: '8px', marginBottom: '10px' }
    });

    actionToolbar.addControl(new WiseButton(WiseI18n.t('📝 Evaluasi & Update Tahapan'), {
      id: 'btnProcEditStage',
      onClick: this.onEditProcessClick.bind(this),
      style: {
        background: 'var(--accent)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    actionToolbar.addControl(new WiseButton(WiseI18n.t('➕ Tambah Tahapan Tambahan'), {
      id: 'btnProcAddStage',
      onClick: this.onAddProcessClick.bind(this),
      style: {
        background: 'var(--accent-dark)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    actionToolbar.addControl(new WiseButton(WiseI18n.t('🗑️ Hapus Tahapan'), {
      id: 'btnProcDeleteStage',
      onClick: this.onDeleteProcessClick.bind(this),
      style: {
        background: '#ef4444',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    actionToolbar.addControl(new WiseButton(WiseI18n.t('🔄 Segarkan'), {
      id: 'btnProcRefresh',
      onClick: () => this.loadData(),
      style: {
        background: 'color-mix(in srgb, var(--accent) 15%, white)',
        color: 'var(--accent-dark)',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 16px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    this.addControl(actionToolbar);

    // 3. Data Table for Processes
    this.dtProcesses = new WiseDataTable({
      id: 'dtApplicantProcesses',
      pageSize: 20,
      currentPage: 1,
      multiSelect: false,
      style: { width: '100%' },
      onRowSelect: this.onRowSelect.bind(this),
      onClick: this.onRowClick.bind(this)
    });

    this.dtProcesses.columns = [
      { key: 'stageOrder', title: WiseI18n.t('Urutan'), width: '70px' },
      { key: 'stageName', title: WiseI18n.t('Nama Tahapan Seleksi'), width: '260px' },
      { key: 'statusBadge', title: WiseI18n.t('Status Proses'), width: '140px' },
      { key: 'scheduledDate', title: WiseI18n.t('Jadwal'), width: '120px' },
      { key: 'interviewerName', title: WiseI18n.t('Pewawancara / Evaluator'), width: '200px' },
      { key: 'resultBadge', title: WiseI18n.t('Hasil Keputusan'), width: '130px' },
      { key: 'overallScoreBadge', title: WiseI18n.t('Skor Akhir'), width: '100px' },
      { key: 'docsCountBadge', title: WiseI18n.t('Dokumen'), width: '100px' },
      { key: 'commentsSnippet', title: WiseI18n.t('Catatan Penilai'), width: '280px' }
    ];

    this.dtProcesses.contextMenuItems = [
      { id: 'eval', label: WiseI18n.t('Evaluasi & Update Tahapan'), icon: '📝', onClick: this.onEditProcessClick.bind(this) },
      { id: 'delete', label: WiseI18n.t('Hapus Tahapan'), icon: '🗑️', onClick: this.onDeleteProcessClick.bind(this) }
    ];

    this.addControl(this.dtProcesses);

    // 4. Status Bar
    this.lblStatus = new WiseLabel(WiseI18n.t('Memuat data proses seleksi...'), {
      id: 'lblApplicantProcStatus',
      style: { color: '#64748b', display: 'block', marginTop: '8px' }
    });
    this.addControl(this.lblStatus);

    return this;
  }

  async loadInitialData() {
    await this.loadData();
  }

  async loadData() {
    if (!this.applicantId) return;

    try {
      if (this.lblStatus) this.lblStatus.setText(WiseI18n.t('Memuat rincian pelamar dan proses seleksi...'));
      const applicant = await api.getApplicant(this.applicantId);
      this.currentApplicant = applicant;

      // Update summary cards
      if (this.lblSumName) {
        this.lblSumName.setText(`${applicant.fullName || '-'} (${applicant.applicantNumber || `APP-${applicant.id}`})`);
      }
      if (this.lblSumVac) {
        const vac = applicant.vacancy;
        this.lblSumVac.setText(vac ? `${vac.title} [${vac.department}]` : '-');
      }
      if (this.lblSumContact) {
        this.lblSumContact.setText(`${applicant.email || '-'} • ${applicant.phone || '-'}`);
      }
      if (this.lblSumStatus) {
        let stBadge = applicant.status;
        if (stBadge === 'APPLIED') stBadge = WiseI18n.t('🟡 Melamar');
        else if (stBadge === 'IN_PROCESS') stBadge = WiseI18n.t('🔵 Sedang Proses');
        else if (stBadge === 'OFFERED') stBadge = WiseI18n.t('🟣 Ditawarkan');
        else if (stBadge === 'HIRED') stBadge = WiseI18n.t('🟢 Diterima (Hired)');
        else if (stBadge === 'REJECTED') stBadge = WiseI18n.t('🔴 Ditolak');
        this.lblSumStatus.setText(stBadge);
      }
      if (this.lblSumEdu) {
        this.lblSumEdu.setText(`${applicant.lastEducation || '-'} — ${applicant.major || '-'}`);
      }
      if (this.lblSumExp) {
        this.lblSumExp.setText(`${applicant.currentPosition || '-'} @ ${applicant.currentCompany || '-'}`);
      }
      if (this.lblSumSal) {
        this.lblSumSal.setText(applicant.expectedSalary ? WiseI18n.formatCurrency(applicant.expectedSalary) : '-');
      }
      if (this.lblSumDate) {
        this.lblSumDate.setText(applicant.appliedDate || '-');
      }

      // Processes
      const processes = Array.isArray(applicant.processes) ? applicant.processes : [];
      this.processesList = processes;

      this.dtProcesses.data = processes.map((p) => {
        let sBadge = p.status;
        if (p.status === 'Not Starting') sBadge = WiseI18n.t('⚪ Belum Dimulai');
        else if (p.status === 'Ongoing') sBadge = WiseI18n.t('🟡 Berlangsung');
        else if (p.status === 'Done') sBadge = WiseI18n.t('🟢 Selesai');
        else if (p.status === 'Canceled') sBadge = WiseI18n.t('🔴 Dibatalkan');

        let rBadge = p.result || '-';
        if (p.result === 'PASSED') rBadge = WiseI18n.t('✅ Lolos');
        else if (p.result === 'FAILED') rBadge = WiseI18n.t('❌ Tidak Lolos');
        else if (p.result === 'PENDING') rBadge = WiseI18n.t('⏳ Menunggu');
        else if (p.result === 'ON_HOLD') rBadge = WiseI18n.t('⏸️ Ditunda');

        const docsCount = Array.isArray(p.documents) ? p.documents.length : 0;

        return {
          id: p.id,
          stageOrder: p.stageOrder || 1,
          stageName: p.stageName || '-',
          statusBadge: sBadge,
          scheduledDate: p.scheduledDate || '-',
          interviewerName: p.interviewerName || '-',
          resultBadge: rBadge,
          overallScoreBadge: p.overallScore !== null && p.overallScore !== undefined ? `🎯 ${p.overallScore}` : '-',
          docsCountBadge: `📎 ${docsCount}`,
          commentsSnippet: p.comments ? (p.comments.length > 50 ? `${p.comments.slice(0, 47)}...` : p.comments) : '-',
          _raw: p
        };
      });
      this.dtProcesses.totalCount = processes.length;

      if (this.lblStatus) {
        this.lblStatus.setText(`${WiseI18n.t('Pelamar memiliki')} ${processes.length} ${WiseI18n.t('tahapan proses seleksi.')}`);
      }
    } catch (err) {
      if (this.lblStatus) this.lblStatus.setText(`${WiseI18n.t('Gagal memuat detail')}: ${err.message}`);
      this.showInfo(WiseI18n.t('Error'), err.message, 'error');
    }
  }

  onRowSelect() {
    const idx = this.dtProcesses.selectedRowIndex;
    if (idx !== null && idx >= 0 && this.processesList[idx]) {
      this.selectedProcess = this.processesList[idx];
    } else {
      this.selectedProcess = null;
    }
  }

  onRowClick() {
    this.onRowSelect();
  }

  async onEditProcessClick() {
    if (!this.selectedProcess) {
      this.showInfo(WiseI18n.t('Pemberitahuan'), WiseI18n.t('Pilih salah satu baris tahapan proses yang ingin dievaluasi.'), 'warning');
      return;
    }

    await this.openWindow(WinApplicantProcessEdit, {
      processId: this.selectedProcess.id,
      applicantId: this.applicantId,
      jobVacancyId: this.currentApplicant ? this.currentApplicant.jobVacancyId : null,
      onSaved: () => this.loadData()
    });
  }

  async onAddProcessClick() {
    await this.openWindow(WinApplicantProcessEdit, {
      processId: null,
      applicantId: this.applicantId,
      jobVacancyId: this.currentApplicant ? this.currentApplicant.jobVacancyId : null,
      onSaved: () => this.loadData()
    });
  }

  async onDeleteProcessClick() {
    if (!this.selectedProcess) {
      this.showInfo(WiseI18n.t('Pemberitahuan'), WiseI18n.t('Pilih salah satu baris tahapan proses yang ingin dihapus.'), 'warning');
      return;
    }

    const conf = await this.confirm(
      WiseI18n.t('Konfirmasi Hapus'),
      `${WiseI18n.t('Apakah Anda yakin ingin menghapus tahapan')} "${this.selectedProcess.stageName}" ${WiseI18n.t('untuk pelamar ini?')}`
    );
    if (!conf) return;

    try {
      await api.deleteProcess(this.selectedProcess.id);
      this.showInfo(WiseI18n.t('Sukses'), WiseI18n.t('Tahapan proses berhasil dihapus.'), 'success');
      this.selectedProcess = null;
      await this.loadData();
    } catch (err) {
      this.showInfo(WiseI18n.t('Gagal Menghapus'), err.message, 'error');
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinApplicantDetail;
