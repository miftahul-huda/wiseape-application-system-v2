const WiseWindow = require('../../../system/WiseWindow');
const WiseLabel = require('../../../system/controls/WiseLabel');
const WiseButton = require('../../../system/controls/WiseButton');
const WiseFrame = require('../../../system/controls/WiseFrame');
const WiseTableLayout = require('../../../system/controls/WiseTableLayout');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../system/WiseI18n');

class WinHRIS extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('WISE_HRIS_PORTAL_SISTEM_INFORMASI_SDM');
    this.appTitle = options.appTitle || WiseI18n.t('WISE_HRIS');
    this.appIcon = options.appIcon || '🏢';
    this.width = options.width || '840';
    this.height = options.height || '680';
    this.positionX = options.positionX !== undefined ? options.positionX : 140;
    this.positionY = options.positionY !== undefined ? options.positionY : 50;
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    // Header Hero Banner
    const bannerFrame = new WiseFrame('', {
      id: 'frameHero',
      style: {
        background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)',
        color: '#ffffff',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '14px',
        boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.15)'
      }
    });

    bannerFrame.addControl(new WiseLabel(WiseI18n.t('WISE_HRIS_ENTERPRISE_PORTAL'), {
      id: 'lblPortalTitle',
      style: { fontSize: 20, fontWeight: 800, color: '#ffffff', display: 'block', marginBottom: '3px' }
    }));
    bannerFrame.addControl(new WiseLabel(WiseI18n.t('PUSAT_LAYANAN_INTEGRASI_MANAJEMEN_SUMBER_DAYA_MANUSIA'), {
      id: 'lblPortalSubtitle',
      style: { color: 'rgba(255, 255, 255, 0.9)', display: 'block' }
    }));
    bannerFrame.addControl(new WiseLabel(WiseI18n.t('PILIH_SUB_APLIKASI_DI_BAWAH_INI_UNTUK_MENGELOLA_MODUL_HRIS'), {
      id: 'lblPortalDesc',
      style: { color: 'rgba(255, 255, 255, 0.8)', display: 'block', marginTop: '2px' }
    }));

    this.addControl(bannerFrame);

    // Section Title
    this.addControl(new WiseLabel(WiseI18n.t('MODUL_HRIS_TERDAFTAR'), {
      id: 'lblSubAppsTitle',
      style: { fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'block' }
    }));

    const descStyle = { color: '#64748b', display: 'block', wordBreak: 'break-word', overflowWrap: 'break-word', marginBottom: '6px' };

    // Grid layout: 3 rows, 2 columns
    const gridLayout = new WiseTableLayout({
      rows: 3,
      columns: 2,
      id: 'tblSubAppsGrid',
      style: { tableLayout: 'fixed', width: '100%', marginBottom: '14px' }
    });

    // --- Sub-App 1: Employee Management (Active) ---
    const cardEmployee = new WiseFrame(WiseI18n.t('AKTIF_EMPLOYEE_MANAGEMENT'), {
      id: 'cardEmployeeMgmt',
      style: {
        border: 'none',
        borderRadius: '12px',
        background: 'linear-gradient(to bottom, color-mix(in srgb, var(--accent) 12%, rgba(255, 255, 255, 0.95)), rgba(255, 255, 255, 0.85))',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
        height: '100%',
        padding: '12px 14px'
      }
    });
    cardEmployee.addControl(new WiseLabel(WiseI18n.t('MANAJEMEN_KARYAWAN_3'), {
      id: 'lblEmpCardTitle',
      style: { fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '2px' }
    }));
    cardEmployee.addControl(new WiseLabel(WiseI18n.t('KELOLA_DATA_PROFIL_LENGKAP_POSISI_LEGALITAS_DOKUMEN_RIWAYAT'), {
      id: 'lblEmpCardDesc',
      style: { ...descStyle, color: '#475569' }
    }));
    cardEmployee.addControl(new WiseButton(WiseI18n.t('BUKA_MANAJEMEN_KARYAWAN'), {
      id: 'btnOpenEmployeeMgmt',
      onClick: () => this.launchApp('employeeManagement'),
      style: { marginTop: '4px', background: 'var(--accent)', color: '#ffffff', fontWeight: 600, padding: '7px 14px', borderRadius: '6px' }
    }));
    gridLayout.setCell(0, 0, cardEmployee);

    // --- Sub-App 2: Organization Management (Active) ---
    const cardOrg = new WiseFrame(WiseI18n.t('AKTIF_STRUKTUR_ORGANISASI_JABATAN'), {
      id: 'cardOrgMgmt',
      style: {
        border: 'none',
        borderRadius: '12px',
        background: 'linear-gradient(to bottom, color-mix(in srgb, var(--accent) 12%, rgba(255, 255, 255, 0.95)), rgba(255, 255, 255, 0.85))',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
        height: '100%',
        padding: '12px 14px'
      }
    });
    cardOrg.addControl(new WiseLabel(WiseI18n.t('MANAJEMEN_ORGANISASI_3'), {
      id: 'lblOrgCardTitle',
      style: { fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '2px' }
    }));
    cardOrg.addControl(new WiseLabel(WiseI18n.t('KELOLA_STRUKTUR_DIVISI_DEPARTEMEN_JENJANG_JABATAN_JOB_LEVEL'), {
      id: 'lblOrgCardDesc',
      style: { ...descStyle, color: '#475569' }
    }));
    cardOrg.addControl(new WiseButton(WiseI18n.t('BUKA_MANAJEMEN_ORGANISASI'), {
      id: 'btnOpenOrgMgmt',
      onClick: () => this.launchApp('organizationManagement'),
      style: { marginTop: '4px', background: 'var(--accent)', color: '#ffffff', fontWeight: 600, padding: '7px 14px', borderRadius: '6px' }
    }));
    gridLayout.setCell(0, 1, cardOrg);

    // --- Sub-App 3: Master Data Management (Active) ---
    const cardMaster = new WiseFrame(WiseI18n.t('AKTIF_MASTER_DATA_MANAGEMENT'), {
      id: 'cardMasterMgmt',
      style: {
        border: 'none',
        borderRadius: '12px',
        background: 'linear-gradient(to bottom, color-mix(in srgb, var(--accent) 12%, rgba(255, 255, 255, 0.95)), rgba(255, 255, 255, 0.85))',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
        height: '100%',
        padding: '12px 14px'
      }
    });
    cardMaster.addControl(new WiseLabel(WiseI18n.t('MANAJEMEN_MASTER_DATA_3'), {
      id: 'lblMasterCardTitle',
      style: { fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '2px' }
    }));
    cardMaster.addControl(new WiseLabel(WiseI18n.t('KELOLA_TABEL_MASTER_REFERENSI_AGAMA_HUBUNGAN_KELUARGA_BANK'), {
      id: 'lblMasterCardDesc',
      style: { ...descStyle, color: '#475569' }
    }));
    cardMaster.addControl(new WiseButton(WiseI18n.t('BUKA_MANAJEMEN_MASTER_DATA'), {
      id: 'btnOpenMasterMgmt',
      onClick: () => this.launchApp('masterDataManagement'),
      style: { marginTop: '4px', background: 'var(--accent)', color: '#ffffff', fontWeight: 600, padding: '7px 14px', borderRadius: '6px' }
    }));
    gridLayout.setCell(1, 0, cardMaster);

    // --- Sub-App 4: Recruitment (Active) ---
    const cardRecruitment = new WiseFrame(WiseI18n.t('AKTIF_REKRUTMEN_TALENT_ACQUISITION'), {
      id: 'cardRecruitmentMgmt',
      style: {
        border: 'none',
        borderRadius: '12px',
        background: 'linear-gradient(to bottom, color-mix(in srgb, var(--accent) 12%, rgba(255, 255, 255, 0.95)), rgba(255, 255, 255, 0.85))',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
        height: '100%',
        padding: '12px 14px'
      }
    });
    cardRecruitment.addControl(new WiseLabel(WiseI18n.t('REKRUTMEN_PEREKRUTAN_2'), {
      id: 'lblRecCardTitle',
      style: { fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '2px' }
    }));
    cardRecruitment.addControl(new WiseLabel(WiseI18n.t('POSTING_LOWONGAN_PEKERJAAN_ALUR_PROSES_SELEKSI_WAWANCARA'), {
      id: 'lblRecCardDesc',
      style: { ...descStyle, color: '#475569' }
    }));
    cardRecruitment.addControl(new WiseButton(WiseI18n.t('BUKA_REKRUTMEN_2'), {
      id: 'btnOpenRecruitment',
      onClick: () => this.launchApp('recruitment'),
      style: { marginTop: '4px', background: 'var(--accent)', color: '#ffffff', fontWeight: 600, padding: '7px 14px', borderRadius: '6px' }
    }));
    gridLayout.setCell(1, 1, cardRecruitment);

    // --- Sub-App 5: Payroll & Compensation (Coming Soon) ---
    const cardPayroll = new WiseFrame(WiseI18n.t('SEGERA_HADIR_PENGGAJIAN_PAJAK'), {
      id: 'cardPayroll',
      style: {
        border: 'none',
        borderRadius: '12px',
        background: 'color-mix(in srgb, var(--bg2) 15%, rgba(255, 255, 255, 0.7))',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        opacity: '0.85',
        height: '100%',
        padding: '12px 14px'
      }
    });
    cardPayroll.addControl(new WiseLabel(WiseI18n.t('PENGGAJIAN_PAJAK'), {
      id: 'lblPayCardTitle',
      style: { fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }
    }));
    cardPayroll.addControl(new WiseLabel(WiseI18n.t('PERHITUNGAN_GAJI_OTOMATIS_POTONGAN_PPH_21_IURAN_BPJS_DAN'), {
      id: 'lblPayCardDesc',
      style: descStyle
    }));
    cardPayroll.addControl(new WiseButton(WiseI18n.t('MODUL_DALAM_PENGEMBANGAN'), {
      id: 'btnPayDisabled',
      disabled: true,
      style: { marginTop: '4px', padding: '6px 12px', borderRadius: '6px' }
    }));
    gridLayout.setCell(2, 0, cardPayroll);

    // --- Sub-App 6: Performance & Appraisal (Coming Soon) ---
    const cardPerformance = new WiseFrame(WiseI18n.t('SEGERA_HADIR_KINERJA_PENILAIAN'), {
      id: 'cardPerformance',
      style: {
        border: 'none',
        borderRadius: '12px',
        background: 'color-mix(in srgb, var(--bg2) 15%, rgba(255, 255, 255, 0.7))',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        opacity: '0.85',
        height: '100%',
        padding: '12px 14px'
      }
    });
    cardPerformance.addControl(new WiseLabel(WiseI18n.t('KINERJA_KPI'), {
      id: 'lblPerfCardTitle',
      style: { fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }
    }));
    cardPerformance.addControl(new WiseLabel(WiseI18n.t('PENILAIAN_KPI_KARYAWAN_EVALUASI_360_DERAJAT_DAN_REVIEW'), {
      id: 'lblPerfCardDesc',
      style: descStyle
    }));
    cardPerformance.addControl(new WiseButton(WiseI18n.t('MODUL_DALAM_PENGEMBANGAN'), {
      id: 'btnPerfDisabled',
      disabled: true,
      style: { marginTop: '4px', padding: '6px 12px', borderRadius: '6px' }
    }));
    gridLayout.setCell(2, 1, cardPerformance);

    this.addControl(gridLayout);

    // Quick Status Bar
    this.addControl(new WiseLabel(WiseI18n.t('BACKEND_HRIS_SERVICE_PORT_4001_DB_POSTGRESQL_WISEAPE_HRIS'), {
      id: 'lblBackendStatus',
      style: { color: '#94a3b8', textAlign: 'center', display: 'block', marginTop: '6px' }
    }));

    return this;
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinHRIS;
