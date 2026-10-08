const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseFrame = require('../../../../system/controls/WiseFrame');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseIconMenu = require('../../../../system/controls/WiseIconMenu');
const WiseIconMenuGroup = require('../../../../system/controls/WiseIconMenuGroup');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

const WinJobVacancyList = require('./WinJobVacancyList');
const WinApplicantList = require('./WinApplicantList');
const WinStageTemplateList = require('./WinStageTemplateList');
const WinMatrixTemplateList = require('./WinMatrixTemplateList');
const RecruitmentApiRepository = require('../services/RecruitmentApiRepository');
const api = new RecruitmentApiRepository();

class WinRecruitmentPortal extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('WISE_RECRUITMENT_PORTAL_REKRUTMEN_TALENT_ACQUISITION');
    this.appTitle = options.appTitle || WiseI18n.t('WISE_RECRUITMENT');
    this.appIcon = options.appIcon || '🎯';
    this.width = options.width || '92%';
    this.height = options.height || '88%';
    this.centered = true;

    this.stats = {
      activeVacancies: 0,
      totalApplicants: 0,
      inProcessApplicants: 0,
      templatesCount: 0
    };
  }

  onWindowInit() {
    this.controls = [];

    // 1. Icon Menu Bar Toolbar (Quick navigation)
    const iconMenuGroup = new WiseIconMenuGroup('', [
      new WiseIconMenu(WiseI18n.t('LOWONGAN_PEKERJAAN'), {
        icon: '💼',
        iconSize: 32,
        description: WiseI18n.t('POSTING_DAN_KELOLA_LOWONGAN_PEKERJAAN_SERTA_ALUR_PROSES'),
        onClick: () => this.openWindow(WinJobVacancyList)
      }),
      new WiseIconMenu(WiseI18n.t('PELAMAR'), {
        icon: '👥',
        iconSize: 32,
        description: WiseI18n.t('MANAJEMEN_PELAMAR_DAN_PELACAKAN_PROSES_RECRUITMENT_SETIAP'),
        onClick: () => this.openWindow(WinApplicantList)
      }),
      new WiseIconMenu(WiseI18n.t('TEMPLATE_TAHAPAN'), {
        icon: '⚙️',
        iconSize: 32,
        description: WiseI18n.t('KELOLA_TEMPLATE_TAHAPAN_PROSES_SELEKSI_INTERVIEW_USER_HRD'),
        onClick: () => this.openWindow(WinStageTemplateList)
      }),
      new WiseIconMenu(WiseI18n.t('TEMPLATE_MATRIKS'), {
        icon: '📊',
        iconSize: 32,
        description: WiseI18n.t('KELOLA_TEMPLATE_MATRIKS_EVALUASI_KRITERIA_BOBOT_PENILAIAN'),
        onClick: () => this.openWindow(WinMatrixTemplateList)
      }),
      new WiseIconMenu(WiseI18n.t('PERBARUI_DATA'), {
        icon: '🔄',
        iconSize: 32,
        description: WiseI18n.t('PERBARUI_RINGKASAN_STATISTIK_DAN_METRIK_REKRUTMEN_TERBARU'),
        onClick: () => this.loadInitialData()
      })
    ], {
      id: 'grpRecruitmentIcons',
      style: {
        marginBottom: '16px',
        padding: '6px 12px',
        background: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '8px',
        border: '1px solid #cbd5e1'
      }
    });
    this.addControl(iconMenuGroup);

    // 2. Summary Metric Cards Layout (4 columns)
    const metricLayout = new WiseTableLayout({
      rows: 1,
      columns: 4,
      id: 'tblPortalMetrics',
      style: { tableLayout: 'fixed', width: '100%', marginBottom: '16px' }
    });

    const metricCardStyle = {
      borderRadius: '8px',
      border: '1px solid #cbd5e1',
      background: 'color-mix(in srgb, var(--accent) 6%, white)',
      padding: '12px 14px',
      height: '100%'
    };

    // Metric 1: Lowongan Aktif
    const cardVac = new WiseFrame('', { id: 'cardStatVac', style: metricCardStyle });
    cardVac.addControl(new WiseLabel(WiseI18n.t('LOWONGAN_AKTIF_2'), { id: 'lblStatVacTitle', style: { fontWeight: 600, color: 'var(--accent-dark)', display: 'block', marginBottom: '4px' } }));
    this.lblVacCount = new WiseLabel(String(this.stats.activeVacancies), { id: 'lblStatVacCount', style: { fontSize: 24, fontWeight: 700, color: '#1e293b', display: 'block' } });
    cardVac.addControl(this.lblVacCount);
    cardVac.addControl(new WiseLabel(WiseI18n.t('POSISI_YANG_SEDANG_DIBUKA'), { id: 'lblStatVacSub', style: { color: '#64748b', display: 'block' } }));
    metricLayout.setCell(0, 0, cardVac);

    // Metric 2: Total Pelamar
    const cardApp = new WiseFrame('', { id: 'cardStatApp', style: metricCardStyle });
    cardApp.addControl(new WiseLabel(WiseI18n.t('TOTAL_PELAMAR_2'), { id: 'lblStatAppTitle', style: { fontWeight: 600, color: 'var(--accent-dark)', display: 'block', marginBottom: '4px' } }));
    this.lblAppCount = new WiseLabel(String(this.stats.totalApplicants), { id: 'lblStatAppCount', style: { fontSize: 24, fontWeight: 700, color: '#1e293b', display: 'block' } });
    cardApp.addControl(this.lblAppCount);
    cardApp.addControl(new WiseLabel(WiseI18n.t('KANDIDAT_TERDAFTAR'), { id: 'lblStatAppSub', style: { color: '#64748b', display: 'block' } }));
    metricLayout.setCell(0, 1, cardApp);

    // Metric 3: Pelamar Dalam Proses
    const cardProcess = new WiseFrame('', { id: 'cardStatProc', style: metricCardStyle });
    cardProcess.addControl(new WiseLabel(WiseI18n.t('DALAM_PROSES_SELEKSI'), { id: 'lblStatProcTitle', style: { fontWeight: 600, color: 'var(--accent-dark)', display: 'block', marginBottom: '4px' } }));
    this.lblProcCount = new WiseLabel(String(this.stats.inProcessApplicants), { id: 'lblStatProcCount', style: { fontSize: 24, fontWeight: 700, color: '#1e293b', display: 'block' } });
    cardProcess.addControl(this.lblProcCount);
    cardProcess.addControl(new WiseLabel(WiseI18n.t('SEDANG_MENJALANI_TAHAPAN'), { id: 'lblStatProcSub', style: { color: '#64748b', display: 'block' } }));
    metricLayout.setCell(0, 2, cardProcess);

    // Metric 4: Template Alur & Matriks
    const cardTpl = new WiseFrame('', { id: 'cardStatTpl', style: metricCardStyle });
    cardTpl.addControl(new WiseLabel(WiseI18n.t('TEMPLATE_TERSEDIA'), { id: 'lblStatTplTitle', style: { fontWeight: 600, color: 'var(--accent-dark)', display: 'block', marginBottom: '4px' } }));
    this.lblTplCount = new WiseLabel(String(this.stats.templatesCount), { id: 'lblStatTplCount', style: { fontSize: 24, fontWeight: 700, color: '#1e293b', display: 'block' } });
    cardTpl.addControl(this.lblTplCount);
    cardTpl.addControl(new WiseLabel(WiseI18n.t('TEMPLATE_ALUR_MATRIKS'), { id: 'lblStatTplSub', style: { color: '#64748b', display: 'block' } }));
    metricLayout.setCell(0, 3, cardTpl);

    this.addControl(metricLayout);

    // 3. Main Modules Grid (2 rows x 2 cols)
    const modulesGrid = new WiseTableLayout({
      rows: 2,
      columns: 2,
      id: 'tblRecruitmentModules',
      style: { tableLayout: 'fixed', width: '100%', marginBottom: '14px' }
    });

    const moduleCardStyle = {
      borderRadius: '10px',
      border: '1px solid #cbd5e1',
      background: '#ffffff',
      padding: '16px 18px',
      height: '100%'
    };

    const descStyle = { color: '#475569', display: 'block', marginBottom: '12px', lineHeight: '1.5' };

    // --- Module 1: Job Vacancy Posting ---
    const modVacancy = new WiseFrame('', { id: 'frameModVacancy', style: moduleCardStyle });
    modVacancy.addControl(new WiseLabel(WiseI18n.t('POSTING_LOWONGAN_KERJA'), {
      id: 'lblModVacTitle',
      style: { fontSize: 16, fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '4px' }
    }));
    modVacancy.addControl(new WiseLabel(WiseI18n.t('POSTING_DAN_KELOLA_INFORMASI_LOWONGAN_PEKERJAAN_JUDUL'), {
      id: 'lblModVacDesc',
      style: descStyle
    }));
    modVacancy.addControl(new WiseButton(WiseI18n.t('BUKA_LOWONGAN_PEKERJAAN'), {
      id: 'btnOpenVacancies',
      onClick: () => this.openWindow(WinJobVacancyList),
      style: { background: 'var(--accent)', color: '#ffffff', fontWeight: 600, padding: '7px 16px', borderRadius: '6px', border: 'none', boxShadow: 'none' }
    }));
    modulesGrid.setCell(0, 0, modVacancy);

    // --- Module 2: Applicant Management ---
    const modApplicant = new WiseFrame('', { id: 'frameModApplicant', style: moduleCardStyle });
    modApplicant.addControl(new WiseLabel(WiseI18n.t('MANAJEMEN_PELAMAR'), {
      id: 'lblModAppTitle',
      style: { fontSize: 16, fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '4px' }
    }));
    modApplicant.addControl(new WiseLabel(WiseI18n.t('KELOLA_DATA_KANDIDAT_PELAMAR_DAFTAR_TAMBAH_EDIT_HAPUS_SERTA'), {
      id: 'lblModAppDesc',
      style: descStyle
    }));
    modApplicant.addControl(new WiseButton(WiseI18n.t('BUKA_DATA_PELAMAR'), {
      id: 'btnOpenApplicants',
      onClick: () => this.openWindow(WinApplicantList),
      style: { background: 'var(--accent)', color: '#ffffff', fontWeight: 600, padding: '7px 16px', borderRadius: '6px', border: 'none', boxShadow: 'none' }
    }));
    modulesGrid.setCell(0, 1, modApplicant);

    // --- Module 3: Template Proses Recruitment ---
    const modStageTemplate = new WiseFrame('', { id: 'frameModStageTpl', style: moduleCardStyle });
    modStageTemplate.addControl(new WiseLabel(WiseI18n.t('TEMPLATE_PROSES_REKRUTMEN'), {
      id: 'lblModStageTplTitle',
      style: { fontSize: 16, fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '4px' }
    }));
    modStageTemplate.addControl(new WiseLabel(WiseI18n.t('BUAT_EDIT_DAN_HAPUS_TEMPLATE_ALUR_PROSES_SELEKSI_SCREENING'), {
      id: 'lblModStageTplDesc',
      style: descStyle
    }));
    modStageTemplate.addControl(new WiseButton(WiseI18n.t('BUKA_TEMPLATE_PROSES'), {
      id: 'btnOpenStageTemplates',
      onClick: () => this.openWindow(WinStageTemplateList),
      style: { background: 'var(--accent)', color: '#ffffff', fontWeight: 600, padding: '7px 16px', borderRadius: '6px', border: 'none', boxShadow: 'none' }
    }));
    modulesGrid.setCell(1, 0, modStageTemplate);

    // --- Module 4: Template Matriks Penilaian ---
    const modMatrixTemplate = new WiseFrame('', { id: 'frameModMatrixTpl', style: moduleCardStyle });
    modMatrixTemplate.addControl(new WiseLabel(WiseI18n.t('TEMPLATE_MATRIKS_PENILAIAN'), {
      id: 'lblModMatrixTplTitle',
      style: { fontSize: 16, fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '4px' }
    }));
    modMatrixTemplate.addControl(new WiseLabel(WiseI18n.t('BUAT_DAN_ATUR_TEMPLATE_MATRIKS_EVALUASI_UNTUK_SETIAP_PROSES'), {
      id: 'lblModMatrixTplDesc',
      style: descStyle
    }));
    modMatrixTemplate.addControl(new WiseButton(WiseI18n.t('BUKA_TEMPLATE_MATRIKS'), {
      id: 'btnOpenMatrixTemplates',
      onClick: () => this.openWindow(WinMatrixTemplateList),
      style: { background: 'var(--accent)', color: '#ffffff', fontWeight: 600, padding: '7px 16px', borderRadius: '6px', border: 'none', boxShadow: 'none' }
    }));
    modulesGrid.setCell(1, 1, modMatrixTemplate);

    this.addControl(modulesGrid);

    return this;
  }

  async loadInitialData() {
    try {
      const [vacRes, appRes, stageRes, matrixRes] = await Promise.all([
        api.listVacancies({ limit: 100 }),
        api.listApplicants({ limit: 100 }),
        api.listStageTemplates(),
        api.listMatrixTemplates()
      ]);

      const vacancies = vacRes.rows || [];
      const applicants = appRes.rows || [];
      const stageTpls = stageRes.rows || [];
      const matrixTpls = matrixRes.rows || [];

      this.stats.activeVacancies = vacancies.filter((v) => v.status === 'ACTIVE').length;
      this.stats.totalApplicants = applicants.length;
      this.stats.inProcessApplicants = applicants.filter((a) => a.status === 'IN_PROCESS' || a.status === 'APPLIED').length;
      this.stats.templatesCount = stageTpls.length + matrixTpls.length;

      if (this.lblVacCount) this.lblVacCount.setValue(String(this.stats.activeVacancies));
      if (this.lblAppCount) this.lblAppCount.setValue(String(this.stats.totalApplicants));
      if (this.lblProcCount) this.lblProcCount.setValue(String(this.stats.inProcessApplicants));
      if (this.lblTplCount) this.lblTplCount.setValue(String(this.stats.templatesCount));
    } catch (err) {
      console.warn('Failed to load recruitment portal stats:', err.message);
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinRecruitmentPortal;
