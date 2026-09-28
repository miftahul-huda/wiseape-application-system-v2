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
    // Honour explicit size/position from caller (e.g. AppHRIS passes '90%'/'80%');
    // fall back to sensible pixel defaults only when not provided.
    this.width = options.width || '780';
    this.height = options.height || '600';
    this.positionX = options.positionX !== undefined ? options.positionX : 180;
    this.positionY = options.positionY !== undefined ? options.positionY : 80;
    // When a percentage size is requested, center the window on screen.
    this.centered = options.centered !== undefined ? options.centered
      : (String(this.width).endsWith('%') || String(this.height).endsWith('%'));
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
        marginBottom: '14px',
        boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.15)'
      }
    });

    bannerFrame.addControl(new WiseLabel('🏢 Wise HRIS Enterprise Portal', {
      id: 'lblPortalTitle',
      style: { fontSize: 20, fontWeight: 800, color: '#ffffff', display: 'block' }
    }));
    bannerFrame.addControl(new WiseLabel('Pusat Layanan & Integrasi Manajemen Sumber Daya Manusia Terpadu', {
      id: 'lblPortalSubtitle',
      style: { fontSize: 12, color: 'rgba(255, 255, 255, 0.9)', display: 'block' }
    }));
    bannerFrame.addControl(new WiseLabel('Pilih sub-aplikasi di bawah ini untuk mengelola modul HRIS perusahaan:', {
      id: 'lblPortalDesc',
      style: { fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', display: 'block' }
    }));

    this.addControl(bannerFrame);

    // Section Title
    this.addControl(new WiseLabel('Sub-Aplikasi HRIS Terdaftar', {
      id: 'lblSubAppsTitle',
      style: { fontSize: 14, fontWeight: 700, color: '#1e293b' }
    }));

    // DESC label style — block + word-wrap to prevent text from spilling across table cells
    const descStyle = { fontSize: 12, color: '#64748b', display: 'block', wordBreak: 'break-word', overflowWrap: 'break-word' };

    // Grid layout: 2 columns, table-layout fixed so each column = 50% width
    const gridLayout = new WiseTableLayout({
      rows: 2,
      columns: 2,
      id: 'tblSubAppsGrid',
      style: { tableLayout: 'fixed', width: '100%' }
    });

    // --- Sub-App 1: Employee Management (Active & Integrated) ---
    const cardEmployee = new WiseFrame('🟢 AKTIF — Employee Management', {
      id: 'cardEmployeeMgmt',
      style: {
        border: 'none',
        borderRadius: '12px',
        background: 'linear-gradient(to bottom, color-mix(in srgb, var(--accent) 12%, rgba(255, 255, 255, 0.95)), rgba(255, 255, 255, 0.85))',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
        height: '100%'
      }
    });
    cardEmployee.addControl(new WiseLabel('👤 Employee Management', {
      id: 'lblEmpCardTitle',
      style: { fontSize: 14, fontWeight: 700, color: 'var(--accent-dark)', display: 'block' }
    }));
    cardEmployee.addControl(new WiseLabel('Kelola data pribadi, posisi pekerjaan, kompensasi payroll, berkas legalitas, riwayat karir, dan pendidikan karyawan.', {
      id: 'lblEmpCardDesc',
      style: { ...descStyle, color: '#475569' }
    }));
    cardEmployee.addControl(new WiseButton('🚀 Buka Employee Management', {
      id: 'btnOpenEmployeeMgmt',
      onClick: this.onOpenEmployeeManagement.bind(this),
      style: { marginTop: '8px' }
    }));
    gridLayout.setCell(0, 0, cardEmployee);

    // --- Sub-App 2: Attendance & Leave (Coming Soon) ---
    const cardAttendance = new WiseFrame('⏳ SEGERA HADIR — Presensi & Cuti', {
      id: 'cardAttendance',
      style: {
        border: 'none',
        borderRadius: '12px',
        background: 'color-mix(in srgb, var(--bg2) 15%, rgba(255, 255, 255, 0.7))',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        opacity: '0.82',
        height: '100%'
      }
    });
    cardAttendance.addControl(new WiseLabel('⏱️ Attendance & Leave', {
      id: 'lblAttTitle',
      style: { fontSize: 14, fontWeight: 700, color: '#334155', display: 'block' }
    }));
    cardAttendance.addControl(new WiseLabel('Pencatatan jam kerja, absensi check-in/out, approval cuti tahunan, lembur, dan izin sakit.', {
      id: 'lblAttDesc',
      style: descStyle
    }));
    cardAttendance.addControl(new WiseButton('Modul Dalam Pengembangan', {
      id: 'btnAttDisabled',
      disabled: true,
      style: { marginTop: '8px' },
      onClick: () => this.showInfo('Presensi & Cuti', 'Modul ini sedang dalam tahap pengembangan.', 'information')
    }));
    gridLayout.setCell(0, 1, cardAttendance);

    // --- Sub-App 3: Payroll & Compensation (Coming Soon) ---
    const cardPayroll = new WiseFrame('⏳ SEGERA HADIR — Penggajian & Pajak', {
      id: 'cardPayroll',
      style: {
        border: 'none',
        borderRadius: '12px',
        background: 'color-mix(in srgb, var(--bg2) 15%, rgba(255, 255, 255, 0.7))',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        opacity: '0.82',
        height: '100%'
      }
    });
    cardPayroll.addControl(new WiseLabel('💳 Payroll & Tax', {
      id: 'lblPayCardTitle',
      style: { fontSize: 14, fontWeight: 700, color: '#334155', display: 'block' }
    }));
    cardPayroll.addControl(new WiseLabel('Perhitungan gaji otomatis, potongan PPh 21, iuran BPJS, dan penerbitan e-slip gaji karyawan.', {
      id: 'lblPayCardDesc',
      style: descStyle
    }));
    cardPayroll.addControl(new WiseButton('Modul Dalam Pengembangan', {
      id: 'btnPayDisabled',
      disabled: true,
      style: { marginTop: '8px' },
      onClick: () => this.showInfo('Payroll', 'Modul ini sedang dalam tahap pengembangan.', 'information')
    }));
    gridLayout.setCell(1, 0, cardPayroll);

    // --- Sub-App 4: Performance & Appraisal (Coming Soon) ---
    const cardPerformance = new WiseFrame('⏳ SEGERA HADIR — Kinerja & Penilaian', {
      id: 'cardPerformance',
      style: {
        border: 'none',
        borderRadius: '12px',
        background: 'color-mix(in srgb, var(--bg2) 15%, rgba(255, 255, 255, 0.7))',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        opacity: '0.82',
        height: '100%'
      }
    });
    cardPerformance.addControl(new WiseLabel('🎯 Performance & KPI', {
      id: 'lblPerfCardTitle',
      style: { fontSize: 14, fontWeight: 700, color: '#334155', display: 'block' }
    }));
    cardPerformance.addControl(new WiseLabel('Penilaian KPI karyawan, evaluasi 360 derajat, dan review kinerja berkala oleh atasan langsung.', {
      id: 'lblPerfCardDesc',
      style: descStyle
    }));
    cardPerformance.addControl(new WiseButton('Modul Dalam Pengembangan', {
      id: 'btnPerfDisabled',
      disabled: true,
      style: { marginTop: '8px' },
      onClick: () => this.showInfo('Performance', 'Modul ini sedang dalam tahap pengembangan.', 'information')
    }));
    gridLayout.setCell(1, 1, cardPerformance);

    this.addControl(gridLayout);

    // Quick Status Bar
    this.addControl(new WiseLabel('Backend: HRIS Service (Port 4001)  •  DB: PostgreSQL wiseape-hris', {
      id: 'lblBackendStatus',
      style: { fontSize: 11, color: '#94a3b8', textAlign: 'center' }
    }));

    return this;
  }

  async onOpenEmployeeManagement() {
    // Launch AppEmployeeManagement in the desktop environment
    this.launchApp('employeeManagement');
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinHRIS;
