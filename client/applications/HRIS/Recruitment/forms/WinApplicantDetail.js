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
    this.title = WiseI18n.t('DETAIL_PELAMAR_ALUR_PROSES_SELEKSI_WISE_RECRUITMENT');
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
    cName.addControl(new WiseLabel(WiseI18n.t('NAMA_LENGKAP_PELAMAR_2'), { id: 'lblSumNameLabel', style: infoLabelStyle }));
    this.lblSumName = new WiseLabel('-', { id: 'lblSumNameVal', style: { ...infoValueStyle, color: 'var(--accent-dark)' } });
    cName.addControl(this.lblSumName);
    summaryGrid.setCell(0, 0, cName);

    // Row 0 Col 1: Lowongan
    const cVac = new WiseFrame('', { id: 'frmSumVac' });
    cVac.addControl(new WiseLabel(WiseI18n.t('LOWONGAN_PEKERJAAN_TARGET_2'), { id: 'lblSumVacLabel', style: infoLabelStyle }));
    this.lblSumVac = new WiseLabel('-', { id: 'lblSumVacVal', style: infoValueStyle });
    cVac.addControl(this.lblSumVac);
    summaryGrid.setCell(0, 1, cVac);

    // Row 0 Col 2: Kontak
    const cContact = new WiseFrame('', { id: 'frmSumContact' });
    cContact.addControl(new WiseLabel(WiseI18n.t('EMAIL_KONTAK_TELEPON'), { id: 'lblSumContactLabel', style: infoLabelStyle }));
    this.lblSumContact = new WiseLabel('-', { id: 'lblSumContactVal', style: infoValueStyle });
    cContact.addControl(this.lblSumContact);
    summaryGrid.setCell(0, 2, cContact);

    // Row 0 Col 3: Status Pelamar
    const cStatus = new WiseFrame('', { id: 'frmSumStatus' });
    cStatus.addControl(new WiseLabel(WiseI18n.t('STATUS_PELAMAR'), { id: 'lblSumStatusLabel', style: infoLabelStyle }));
    this.lblSumStatus = new WiseLabel('-', { id: 'lblSumStatusVal', style: infoValueStyle });
    cStatus.addControl(this.lblSumStatus);
    summaryGrid.setCell(0, 3, cStatus);

    // Row 1 Col 0: Pendidikan
    const cEdu = new WiseFrame('', { id: 'frmSumEdu' });
    cEdu.addControl(new WiseLabel(WiseI18n.t('PENDIDIKAN_JURUSAN'), { id: 'lblSumEduLabel', style: infoLabelStyle }));
    this.lblSumEdu = new WiseLabel('-', { id: 'lblSumEduVal', style: infoValueStyle });
    cEdu.addControl(this.lblSumEdu);
    summaryGrid.setCell(1, 0, cEdu);

    // Row 1 Col 1: Pengalaman Terakhir
    const cExp = new WiseFrame('', { id: 'frmSumExp' });
    cExp.addControl(new WiseLabel(WiseI18n.t('PERUSAHAAN_POSISI_TERAKHIR'), { id: 'lblSumExpLabel', style: infoLabelStyle }));
    this.lblSumExp = new WiseLabel('-', { id: 'lblSumExpVal', style: infoValueStyle });
    cExp.addControl(this.lblSumExp);
    summaryGrid.setCell(1, 1, cExp);

    // Row 1 Col 2: Gaji yang Diharapkan
    const cSal = new WiseFrame('', { id: 'frmSumSal' });
    cSal.addControl(new WiseLabel(WiseI18n.t('EKSPEKTASI_GAJI'), { id: 'lblSumSalLabel', style: infoLabelStyle }));
    this.lblSumSal = new WiseLabel('-', { id: 'lblSumSalVal', style: infoValueStyle });
    cSal.addControl(this.lblSumSal);
    summaryGrid.setCell(1, 2, cSal);

    // Row 1 Col 3: Tanggal Lamar
    const cDate = new WiseFrame('', { id: 'frmSumDate' });
    cDate.addControl(new WiseLabel(WiseI18n.t('TANGGAL_MELAMAR_2'), { id: 'lblSumDateLabel', style: infoLabelStyle }));
    this.lblSumDate = new WiseLabel('-', { id: 'lblSumDateVal', style: infoValueStyle });
    cDate.addControl(this.lblSumDate);
    summaryGrid.setCell(1, 3, cDate);

    this.frmProfileSummary.addControl(summaryGrid);
    this.addControl(this.frmProfileSummary);

    // 2. Section Heading & Actions Toolbar
    this.addControl(new WiseLabel(WiseI18n.t('ALUR_TAHAPAN_PROSES_SELEKSI_PELAMAR_RECRUITMENT_STAGES'), {
      id: 'lblProcListHeading',
      style: { fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }
    }));

    const actionToolbar = new WiseFrame('', {
      id: 'frmApplicantProcActions',
      style: { display: 'flex', gap: '8px', marginBottom: '10px' }
    });

    actionToolbar.addControl(new WiseButton(WiseI18n.t('EVALUASI_UPDATE_TAHAPAN'), {
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('TAMBAH_TAHAPAN_TAMBAHAN'), {
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('HAPUS_TAHAPAN'), {
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

    actionToolbar.addControl(new WiseButton(WiseI18n.t('SEGARKAN_3'), {
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
      { key: 'stageOrder', title: WiseI18n.t('URUTAN'), width: '70px' },
      { key: 'stageName', title: WiseI18n.t('NAMA_TAHAPAN_SELEKSI'), width: '260px' },
      { key: 'statusBadge', title: WiseI18n.t('STATUS_PROSES'), width: '140px' },
      { key: 'scheduledDate', title: WiseI18n.t('JADWAL'), width: '120px' },
      { key: 'interviewerName', title: WiseI18n.t('PEWAWANCARA_EVALUATOR'), width: '200px' },
      { key: 'resultBadge', title: WiseI18n.t('HASIL_KEPUTUSAN'), width: '130px' },
      { key: 'overallScoreBadge', title: WiseI18n.t('SKOR_AKHIR'), width: '100px' },
      { key: 'docsCountBadge', title: WiseI18n.t('DOKUMEN'), width: '100px' },
      { key: 'commentsSnippet', title: WiseI18n.t('CATATAN_PENILAI'), width: '280px' }
    ];

    this.dtProcesses.contextMenuItems = [
      { id: 'eval', label: WiseI18n.t('EVALUASI_UPDATE_TAHAPAN_2'), icon: '📝', onClick: this.onEditProcessClick.bind(this) },
      { id: 'delete', label: WiseI18n.t('HAPUS_TAHAPAN_2'), icon: '🗑️', onClick: this.onDeleteProcessClick.bind(this) }
    ];

    this.addControl(this.dtProcesses);

    // 4. Status Bar
    this.lblStatus = new WiseLabel(WiseI18n.t('MEMUAT_DATA_PROSES_SELEKSI'), {
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
      if (this.lblStatus) this.lblStatus.setText(WiseI18n.t('MEMUAT_RINCIAN_PELAMAR_DAN_PROSES_SELEKSI'));
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
        if (stBadge === 'APPLIED') stBadge = WiseI18n.t('MELAMAR');
        else if (stBadge === 'IN_PROCESS') stBadge = WiseI18n.t('SEDANG_PROSES');
        else if (stBadge === 'OFFERED') stBadge = WiseI18n.t('DITAWARKAN');
        else if (stBadge === 'HIRED') stBadge = WiseI18n.t('DITERIMA_HIRED');
        else if (stBadge === 'REJECTED') stBadge = WiseI18n.t('DITOLAK');
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
        if (p.status === 'Not Starting') sBadge = WiseI18n.t('BELUM_DIMULAI_2');
        else if (p.status === 'Ongoing') sBadge = WiseI18n.t('BERLANGSUNG_2');
        else if (p.status === 'Done') sBadge = WiseI18n.t('SELESAI_2');
        else if (p.status === 'Canceled') sBadge = WiseI18n.t('DIBATALKAN_2');

        let rBadge = p.result || '-';
        if (p.result === 'PASSED') rBadge = WiseI18n.t('LOLOS');
        else if (p.result === 'FAILED') rBadge = WiseI18n.t('TIDAK_LOLOS');
        else if (p.result === 'PENDING') rBadge = WiseI18n.t('MENUNGGU');
        else if (p.result === 'ON_HOLD') rBadge = WiseI18n.t('DITUNDA');

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
        this.lblStatus.setText(`${WiseI18n.t('PELAMAR_MEMILIKI')} ${processes.length} ${WiseI18n.t('TAHAPAN_PROSES_SELEKSI')}`);
      }
    } catch (err) {
      if (this.lblStatus) this.lblStatus.setText(`${WiseI18n.t('GAGAL_MEMUAT_DETAIL')}: ${err.message}`);
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
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
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_BARIS_TAHAPAN_PROSES_YANG_INGIN_DIEVALUASI'), 'warning');
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
      this.showInfo(WiseI18n.t('PEMBERITAHUAN'), WiseI18n.t('PILIH_SALAH_SATU_BARIS_TAHAPAN_PROSES_YANG_INGIN_DIHAPUS'), 'warning');
      return;
    }

    const conf = await this.confirm(
      WiseI18n.t('KONFIRMASI_HAPUS'),
      `${WiseI18n.t('APAKAH_ANDA_YAKIN_INGIN_MENGHAPUS_TAHAPAN')} "${this.selectedProcess.stageName}" ${WiseI18n.t('UNTUK_PELAMAR_INI')}`
    );
    if (!conf) return;

    try {
      await api.deleteProcess(this.selectedProcess.id);
      this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('TAHAPAN_PROSES_BERHASIL_DIHAPUS'), 'success');
      this.selectedProcess = null;
      await this.loadData();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENGHAPUS'), err.message, 'error');
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinApplicantDetail;
