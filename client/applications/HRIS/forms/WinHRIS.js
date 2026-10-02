const WiseWindow = require('../../../system/WiseWindow');
const WiseLabel = require('../../../system/controls/WiseLabel');
const WiseButton = require('../../../system/controls/WiseButton');
const WiseFrame = require('../../../system/controls/WiseFrame');
const WiseTableLayout = require('../../../system/controls/WiseTableLayout');

class WinHRIS extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = 'Wise HRIS — Human Resource Information System Portal';
    this.appTitle = options.appTitle || 'Wise HRIS';
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

    bannerFrame.addControl(new WiseLabel('🏢 Wise HRIS Enterprise Portal', {
      id: 'lblPortalTitle',
      style: { fontSize: 20, fontWeight: 800, color: '#ffffff', display: 'block', marginBottom: '3px' }
    }));
    bannerFrame.addControl(new WiseLabel('Pusat Layanan & Integrasi Manajemen Sumber Daya Manusia Terpadu', {
      id: 'lblPortalSubtitle',
      style: { color: 'rgba(255, 255, 255, 0.9)', display: 'block' }
    }));
    bannerFrame.addControl(new WiseLabel('Pilih sub-aplikasi di bawah ini untuk mengelola modul HRIS perusahaan:', {
      id: 'lblPortalDesc',
      style: { color: 'rgba(255, 255, 255, 0.8)', display: 'block', marginTop: '2px' }
    }));

    this.addControl(bannerFrame);

    // Section Title
    this.addControl(new WiseLabel('Modul HRIS Terdaftar', {
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
    const cardEmployee = new WiseFrame('🟢 AKTIF — Employee Management', {
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
    cardEmployee.addControl(new WiseLabel('👤 Employee Management', {
      id: 'lblEmpCardTitle',
      style: { fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '2px' }
    }));
    cardEmployee.addControl(new WiseLabel('Kelola data profil lengkap, posisi, legalitas dokumen, riwayat karir, dan keluarga karyawan.', {
      id: 'lblEmpCardDesc',
      style: { ...descStyle, color: '#475569' }
    }));
    cardEmployee.addControl(new WiseButton('🚀 Buka Employee Management', {
      id: 'btnOpenEmployeeMgmt',
      onClick: () => this.launchApp('employeeManagement'),
      style: { marginTop: '4px', background: 'var(--accent)', color: '#ffffff', fontWeight: 600, padding: '7px 14px', borderRadius: '6px' }
    }));
    gridLayout.setCell(0, 0, cardEmployee);

    // --- Sub-App 2: Organization Management (Active) ---
    const cardOrg = new WiseFrame('🟢 AKTIF — Struktur Organisasi & Jabatan', {
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
    cardOrg.addControl(new WiseLabel('🏛️ Organization Management', {
      id: 'lblOrgCardTitle',
      style: { fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '2px' }
    }));
    cardOrg.addControl(new WiseLabel('Kelola struktur divisi, departemen, jenjang jabatan (job level), dan master daftar posisi jabatan (jabatan).', {
      id: 'lblOrgCardDesc',
      style: { ...descStyle, color: '#475569' }
    }));
    cardOrg.addControl(new WiseButton('🚀 Buka Organization Management', {
      id: 'btnOpenOrgMgmt',
      onClick: () => this.launchApp('organizationManagement'),
      style: { marginTop: '4px', background: 'var(--accent)', color: '#ffffff', fontWeight: 600, padding: '7px 14px', borderRadius: '6px' }
    }));
    gridLayout.setCell(0, 1, cardOrg);

    // --- Sub-App 3: Master Data Management (Active) ---
    const cardMaster = new WiseFrame('🟢 AKTIF — Master Data Management', {
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
    cardMaster.addControl(new WiseLabel('🗂️ Master Data Management', {
      id: 'lblMasterCardTitle',
      style: { fontWeight: 700, color: 'var(--accent-dark)', display: 'block', marginBottom: '2px' }
    }));
    cardMaster.addControl(new WiseLabel('Kelola tabel master referensi: Agama, Hubungan Keluarga, Bank Payroll, Status Pegawai, Jenis Dokumen, Lokasi Kerja, dll.', {
      id: 'lblMasterCardDesc',
      style: { ...descStyle, color: '#475569' }
    }));
    cardMaster.addControl(new WiseButton('🚀 Buka Master Data Management', {
      id: 'btnOpenMasterMgmt',
      onClick: () => this.launchApp('masterDataManagement'),
      style: { marginTop: '4px', background: 'var(--accent)', color: '#ffffff', fontWeight: 600, padding: '7px 14px', borderRadius: '6px' }
    }));
    gridLayout.setCell(1, 0, cardMaster);

    // --- Sub-App 4: Attendance & Leave (Coming Soon) ---
    const cardAttendance = new WiseFrame('⏳ SEGERA HADIR — Presensi & Cuti', {
      id: 'cardAttendance',
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
    cardAttendance.addControl(new WiseLabel('⏱️ Attendance & Leave', {
      id: 'lblAttTitle',
      style: { fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }
    }));
    cardAttendance.addControl(new WiseLabel('Pencatatan jam kerja, absensi check-in/out, approval cuti tahunan, lembur, dan izin sakit.', {
      id: 'lblAttDesc',
      style: descStyle
    }));
    cardAttendance.addControl(new WiseButton('Modul Dalam Pengembangan', {
      id: 'btnAttDisabled',
      disabled: true,
      style: { marginTop: '4px', padding: '6px 12px', borderRadius: '6px' }
    }));
    gridLayout.setCell(1, 1, cardAttendance);

    // --- Sub-App 5: Payroll & Compensation (Coming Soon) ---
    const cardPayroll = new WiseFrame('⏳ SEGERA HADIR — Penggajian & Pajak', {
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
    cardPayroll.addControl(new WiseLabel('💳 Payroll & Tax', {
      id: 'lblPayCardTitle',
      style: { fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }
    }));
    cardPayroll.addControl(new WiseLabel('Perhitungan gaji otomatis, potongan PPh 21, iuran BPJS, dan penerbitan e-slip gaji karyawan.', {
      id: 'lblPayCardDesc',
      style: descStyle
    }));
    cardPayroll.addControl(new WiseButton('Modul Dalam Pengembangan', {
      id: 'btnPayDisabled',
      disabled: true,
      style: { marginTop: '4px', padding: '6px 12px', borderRadius: '6px' }
    }));
    gridLayout.setCell(2, 0, cardPayroll);

    // --- Sub-App 6: Performance & Appraisal (Coming Soon) ---
    const cardPerformance = new WiseFrame('⏳ SEGERA HADIR — Kinerja & Penilaian', {
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
    cardPerformance.addControl(new WiseLabel('🎯 Performance & KPI', {
      id: 'lblPerfCardTitle',
      style: { fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }
    }));
    cardPerformance.addControl(new WiseLabel('Penilaian KPI karyawan, evaluasi 360 derajat, dan review kinerja berkala oleh atasan langsung.', {
      id: 'lblPerfCardDesc',
      style: descStyle
    }));
    cardPerformance.addControl(new WiseButton('Modul Dalam Pengembangan', {
      id: 'btnPerfDisabled',
      disabled: true,
      style: { marginTop: '4px', padding: '6px 12px', borderRadius: '6px' }
    }));
    gridLayout.setCell(2, 1, cardPerformance);

    this.addControl(gridLayout);

    // Quick Status Bar
    this.addControl(new WiseLabel('Backend: HRIS Service (Port 4001)  •  DB: PostgreSQL wiseape-hris', {
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
