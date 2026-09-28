const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseNumericBox = require('../../../../system/controls/WiseNumericBox');
const WiseComboBox = require('../../../../system/controls/WiseComboBox');
const WiseTabControl = require('../../../../system/controls/WiseTabControl');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseFrame = require('../../../../system/controls/WiseFrame');

const HrisApiRepository = require('../services/HrisApiRepository');
const api = new HrisApiRepository();

const DEPARTMENTS = ['Semua', 'Technology', 'Human Resources', 'Finance', 'Operations', 'Marketing'];
const JOB_LEVELS = ['Staff', 'Senior Staff', 'Supervisor', 'Manager', 'General Manager', 'Director'];
const EMPLOYMENT_STATUSES = ['Karyawan Tetap', 'Kontrak/PKWT', 'Paruh Waktu', 'Magang'];
const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];
const TAX_STATUSES = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'];
const BANKS = ['BCA', 'Bank Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'Bank Danamon', 'Bank Permata', 'Lainnya'];
const EDU_DEGREES = ['SMA/SMK', 'D3', 'D4', 'S1', 'S2', 'S3', 'Sertifikasi Profesi'];
const DOC_TYPES = ['KTP', 'KK', 'NPWP', 'Kontrak Kerja', 'Sertifikat', 'Ijazah', 'Lisensi Profesi', 'Lainnya'];
const CAREER_TYPES = ['Promosi', 'Demosi', 'Rotasi', 'Penyesuaian Gaji', 'Penghargaan', 'Surat Peringatan'];

const HEADING_STYLE = { fontSize: 13, fontWeight: 700, color: '#334155', marginTop: '4px' };
const BADGE_ACTIVE_COLOR = '#059669';
const BADGE_INACTIVE_COLOR = '#dc2626';

class WinEmployeeManagement extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = 'Employee Management — Wise HRIS';
    this.appTitle = options.appTitle || 'Employee Management';
    this.appIcon = options.appIcon || '👤';
    this.width = '88%';
    this.height = 700;
    this.positionX = 70;
    this.positionY = 50;

    this.selectedEmployeeId = null;
    this.currentEmployeeData = null;
    this.cachedEmployees = [];
  }

  onWindowInit() {
    this.controls = [];

    // Header Panel
    const headerFrame = new WiseFrame('', {
      id: 'frameHeader',
      style: { marginBottom: '8px', padding: '10px 14px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff' }
    });

    headerFrame.addControl(new WiseLabel('Sistem Manajemen Data Karyawan (HRIS)', {
      id: 'lblAppHeader',
      style: { fontSize: 18, fontWeight: 700, color: '#ffffff' }
    }));
    headerFrame.addControl(new WiseLabel('Kelola data pribadi, pekerjaan, kompensasi payroll, dokumen digital, riwayat karir & pendidikan karyawan.', {
      id: 'lblAppSubHeader',
      style: { fontSize: 12, color: '#94a3b8', marginTop: '2px' }
    }));
    headerFrame.addControl(new WiseLabel('Statistik: Memuat...', {
      id: 'lblStatsSummary',
      style: { fontSize: 12, fontWeight: 600, color: '#38bdf8', marginTop: '6px' }
    }));

    this.addControl(headerFrame);

    // Toolbar & Search Action Bar
    const toolbarLayout = new WiseTableLayout({ rows: 1, columns: 6, id: 'tblToolbar', style: { marginBottom: '10px' } });
    toolbarLayout.setCell(0, 0, new WiseTextBox('', { id: 'txtSearch', placeholder: '🔍 Cari nama, NIK, jabatan, email...' }), { colSpan: 2 });
    toolbarLayout.setCell(0, 2, new WiseComboBox(DEPARTMENTS.map(d => ({ value: d, label: d })), { id: 'cmbFilterDept', value: 'Semua', onChange: this.onFilterChanged.bind(this) }));
    toolbarLayout.setCell(0, 3, new WiseButton('🔍 Cari', { id: 'btnSearch', onClick: this.onSearchClick.bind(this) }));
    toolbarLayout.setCell(0, 4, new WiseButton('➕ Karyawan Baru', { id: 'btnNewEmployee', onClick: this.onNewEmployeeClick.bind(this), style: { background: '#2563eb' } }));
    toolbarLayout.setCell(0, 5, new WiseButton('🔄 Segarkan', { id: 'btnRefresh', onClick: this.loadInitialData.bind(this) }));
    this.addControl(toolbarLayout);

    // Main Tab Control
    this.mainTabs = new WiseTabControl({
      id: 'mainTabs',
      layout: 'vertical',
      activeIndex: 0,
      onTabChanged: this.onMainTabChanged.bind(this)
    });
    const mainTabs = this.mainTabs;

    // ==========================================
    // TAB 1: DAFTAR KARYAWAN (Data Table)
    // ==========================================
    const tabListControls = [];
    tabListControls.push(new WiseLabel('Daftar Karyawan Aktif & Terdaftar', {
      id: 'lblListTitle',
      style: { fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: '8px' }
    }));

    const dtEmployees = new WiseDataTable({
      id: 'dtEmployees',
      pageSize: 8,
      pageSizeOptions: [5, 8, 15, 25],
      onDataFilterChanged: this.onTableFilterChanged.bind(this),
      onRowSelect: this.onEmployeeRowSelect.bind(this)
    });

    dtEmployees.setColumns([
      { dataField: 'nik', header: 'NIK', width: 120 },
      { dataField: 'fullName', header: 'Nama Lengkap', width: 200 },
      { dataField: 'jobTitle', header: 'Jabatan', width: 160 },
      { dataField: 'department', header: 'Departemen', width: 130 },
      { dataField: 'employmentStatus', header: 'Status Kepegawaian', width: 140 },
      { dataField: 'statusBadge', header: 'Status', width: 90 },
      { dataField: 'tenureText', header: 'Masa Kerja', width: 140 },
      {
        dataField: 'actionBtn',
        header: 'Aksi',
        width: 100,
        sortable: false,
        type: 'button',
        label: 'Detail/Edit',
        onClick: this.onEditEmployeeClick.bind(this)
      }
    ]);
    tabListControls.push(dtEmployees);

    tabListControls.push(new WiseLabel('', {
      id: 'lblSelectedInfo',
      style: { fontSize: 12, marginTop: '8px', color: '#475569', fontWeight: 600 }
    }));

    mainTabs.addTab({ label: 'Daftar Karyawan', icon: '📋', controls: tabListControls });

    // ==========================================
    // TAB 2: DATA PRIBADI (Personal Information)
    // ==========================================
    const tabPersonalControls = [];
    tabPersonalControls.push(new WiseLabel('1. Data Pribadi (Personal Information)', { id: 'lblPersHeading', style: { fontSize: 16, fontWeight: 700, marginBottom: '6px' } }));
    tabPersonalControls.push(new WiseLabel('Informasi dasar mengenai identitas personal karyawan untuk keperluan administrasi dan kontak darurat.', { id: 'lblPersSub', style: { fontSize: 12, color: '#64748b', marginBottom: '12px' } }));

    const tblPersonal = new WiseTableLayout({ rows: 7, columns: 2, id: 'tblPersonal' });
    tblPersonal.setCell(0, 0, this.formGroup('Nama Lengkap *', new WiseTextBox('', { id: 'txtFullName', placeholder: 'e.g. Raden Ayu Annisa Putri, S.T.' })));
    tblPersonal.setCell(0, 1, this.formGroup('Nama Panggilan', new WiseTextBox('', { id: 'txtNickname', placeholder: 'e.g. Annisa' })));

    tblPersonal.setCell(1, 0, this.formGroup('Tempat Lahir', new WiseTextBox('', { id: 'txtBirthPlace', placeholder: 'e.g. Yogyakarta' })));
    tblPersonal.setCell(1, 1, this.formGroup('Tanggal Lahir (YYYY-MM-DD)', new WiseTextBox('', { id: 'txtBirthDate', placeholder: '1995-08-20' })));

    tblPersonal.setCell(2, 0, this.formGroup('Jenis Kelamin', new WiseComboBox([{ value: 'Laki-laki', label: 'Laki-laki' }, { value: 'Perempuan', label: 'Perempuan' }], { id: 'cmbGender', value: 'Laki-laki' })));
    tblPersonal.setCell(2, 1, this.formGroup('Agama', new WiseComboBox(RELIGIONS.map(r => ({ value: r, label: r })), { id: 'cmbReligion', value: 'Islam' })));

    tblPersonal.setCell(3, 0, this.formGroup('Nomor Telepon / WhatsApp *', new WiseTextBox('', { id: 'txtPhoneNumber', placeholder: '081234567890' })));
    tblPersonal.setCell(3, 1, this.formGroup('Email Pribadi *', new WiseTextBox('', { id: 'txtPersonalEmail', placeholder: 'karyawan@example.com' })));

    tblPersonal.setCell(4, 0, this.formGroup('Alamat Tempat Tinggal Saat Ini', new WiseTextBox('', { id: 'txtCurrentAddress', placeholder: 'Alamat domisili saat ini' })));
    tblPersonal.setCell(4, 1, this.formGroup('Alamat Sesuai KTP', new WiseTextBox('', { id: 'txtIdCardAddress', placeholder: 'Alamat lengkap sesuai KTP' })));

    // Emergency Contact Frame
    const emergencyFrame = new WiseFrame('Kontak Darurat (Emergency Contact)', { id: 'frameEmergency', style: { marginTop: '8px' } });
    const tblEmergency = new WiseTableLayout({ rows: 2, columns: 3, id: 'tblEmergency' });
    tblEmergency.setCell(0, 0, this.formGroup('Nama Orang yang Dapat Dihubungi', new WiseTextBox('', { id: 'txtEmergencyName', placeholder: 'Nama kontak darurat' })));
    tblEmergency.setCell(0, 1, this.formGroup('Hubungan', new WiseComboBox(['Orang Tua', 'Suami/Istri', 'Saudara Kandung', 'Anak', 'Teman'].map(h => ({ value: h, label: h })), { id: 'cmbEmergencyRelation', value: 'Orang Tua' })));
    tblEmergency.setCell(0, 2, this.formGroup('Nomor Telepon Darurat', new WiseTextBox('', { id: 'txtEmergencyPhone', placeholder: '0812xxxxxxxx' })));
    emergencyFrame.addControl(tblEmergency);

    tabPersonalControls.push(tblPersonal);
    tabPersonalControls.push(emergencyFrame);

    tabPersonalControls.push(this.createSaveBar('btnSavePersonal'));
    mainTabs.addTab({ label: 'Data Pribadi', icon: '👤', controls: tabPersonalControls });

    // ==========================================
    // TAB 3: DATA PEKERJAAN (Employment Details)
    // ==========================================
    const tabEmployControls = [];
    tabEmployControls.push(new WiseLabel('2. Data Pekerjaan (Employment Details)', { id: 'lblEmpHeading', style: { fontSize: 16, fontWeight: 700, marginBottom: '6px' } }));
    tabEmployControls.push(new WiseLabel('Informasi terkait posisi, status kepegawaian, tanggal bergabung, atasan langsung, dan lokasi penempatan kerja.', { id: 'lblEmpSub', style: { fontSize: 12, color: '#64748b', marginBottom: '12px' } }));

    const tblEmployment = new WiseTableLayout({ rows: 6, columns: 2, id: 'tblEmployment' });
    tblEmployment.setCell(0, 0, this.formGroup('Nomor Induk Karyawan (NIK / ID Karyawan) *', new WiseTextBox('', { id: 'txtNik', placeholder: 'EMP-2024-001' })));
    tblEmployment.setCell(0, 1, this.formGroup('Jabatan / Posisi (Job Title) *', new WiseTextBox('', { id: 'txtJobTitle', placeholder: 'e.g. Senior Software Engineer' })));

    tblEmployment.setCell(1, 0, this.formGroup('Tingkat Jabatan (Job Level)', new WiseComboBox(JOB_LEVELS.map(l => ({ value: l, label: l })), { id: 'cmbJobLevel', value: 'Staff' })));
    tblEmployment.setCell(1, 1, this.formGroup('Departemen', new WiseTextBox('', { id: 'txtDepartment', placeholder: 'Technology / Engineering' })));

    tblEmployment.setCell(2, 0, this.formGroup('Divisi / Sub-Departemen', new WiseTextBox('', { id: 'txtDivision', placeholder: 'e.g. Frontend Engineering' })));
    tblEmployment.setCell(2, 1, this.formGroup('Status Kepegawaian', new WiseComboBox(EMPLOYMENT_STATUSES.map(s => ({ value: s, label: s })), { id: 'cmbEmploymentStatus', value: 'Karyawan Tetap' })));

    tblEmployment.setCell(3, 0, this.formGroup('Tanggal Bergabung (Join Date)', new WiseTextBox('', { id: 'txtJoinDate', placeholder: '2023-01-15' })));
    tblEmployment.setCell(3, 1, this.formGroup('Tanggal Berakhir (Bila Kontrak/Magang)', new WiseTextBox('', { id: 'txtEndDate', placeholder: 'YYYY-MM-DD (opsional)' })));

    tblEmployment.setCell(4, 0, this.formGroup('Atasan Langsung (Manager / Reporting Line)', new WiseTextBox('', { id: 'txtManagerName', placeholder: 'Nama Atasan Langsung' })));
    tblEmployment.setCell(4, 1, this.formGroup('Lokasi Kerja', new WiseComboBox(['Kantor Pusat', 'Kantor Cabang', 'Remote', 'Hybrid'].map(l => ({ value: l, label: l })), { id: 'cmbWorkLocation', value: 'Kantor Pusat' })));

    tblEmployment.setCell(5, 0, this.formGroup('Status Keaktifan Akun', new WiseComboBox(['Aktif', 'Nonaktif', 'Cuti', 'Resign', 'PHK'].map(s => ({ value: s, label: s })), { id: 'cmbStatus', value: 'Aktif' })));

    tabEmployControls.push(tblEmployment);
    tabEmployControls.push(this.createSaveBar('btnSaveEmployment'));
    mainTabs.addTab({ label: 'Data Pekerjaan', icon: '💼', controls: tabEmployControls });

    // ==========================================
    // TAB 4: KOMPENSASI & KEUANGAN (Payroll)
    // ==========================================
    const tabPayControls = [];
    tabPayControls.push(new WiseLabel('3. Data Kompensasi & Keuangan (Compensation & Payroll)', { id: 'lblPayHeading', style: { fontSize: 16, fontWeight: 700, marginBottom: '6px' } }));
    tabPayControls.push(new WiseLabel('Informasi penggajian, rekening perbankan, komponen tunjangan, status perpajakan PPh 21, dan nomor jaminan sosial.', { id: 'lblPaySub', style: { fontSize: 12, color: '#64748b', marginBottom: '12px' } }));

    const tblPayroll = new WiseTableLayout({ rows: 6, columns: 2, id: 'tblPayroll' });
    tblPayroll.setCell(0, 0, this.formGroup('Nama Bank', new WiseComboBox(BANKS.map(b => ({ value: b, label: b })), { id: 'cmbBankName', value: 'BCA' })));
    tblPayroll.setCell(0, 1, this.formGroup('Nomor Rekening Bank', new WiseTextBox('', { id: 'txtBankAccountNumber', placeholder: 'Nomor rekening untuk transfer gaji' })));

    tblPayroll.setCell(1, 0, this.formGroup('Nama Pemilik Rekening (Atas Nama)', new WiseTextBox('', { id: 'txtBankAccountHolder', placeholder: 'Harus sesuai buku tabungan' })));
    tblPayroll.setCell(1, 1, this.formGroup('Gaji Pokok (Basic Salary) - Rp', new WiseNumericBox('0', { id: 'numBasicSalary', value: 0, prefix: 'Rp ' })));

    tblPayroll.setCell(2, 0, this.formGroup('Tunjangan Jabatan - Rp', new WiseNumericBox('0', { id: 'numAllowancePosition', value: 0, prefix: 'Rp ' })));
    tblPayroll.setCell(2, 1, this.formGroup('Tunjangan Transport - Rp', new WiseNumericBox('0', { id: 'numAllowanceTransport', value: 0, prefix: 'Rp ' })));

    tblPayroll.setCell(3, 0, this.formGroup('Tunjangan Makan - Rp', new WiseNumericBox('0', { id: 'numAllowanceMeal', value: 0, prefix: 'Rp ' })));
    tblPayroll.setCell(3, 1, this.formGroup('Tunjangan Lainnya - Rp', new WiseNumericBox('0', { id: 'numAllowanceOther', value: 0, prefix: 'Rp ' })));

    tblPayroll.setCell(4, 0, this.formGroup('Status Perpajakan (PTKP PPh 21)', new WiseComboBox(TAX_STATUSES.map(t => ({ value: t, label: t })), { id: 'cmbTaxStatus', value: 'TK/0' })));
    tblPayroll.setCell(4, 1, this.formGroup('Nomor Pokok Wajib Pajak (NPWP)', new WiseTextBox('', { id: 'txtNpwp', placeholder: '00.000.000.0-000.000' })));

    tblPayroll.setCell(5, 0, this.formGroup('Nomor BPJS Kesehatan', new WiseTextBox('', { id: 'txtBpjsKesehatan', placeholder: '13 digit nomor BPJS Kesehatan' })));
    tblPayroll.setCell(5, 1, this.formGroup('Nomor BPJS Ketenagakerjaan', new WiseTextBox('', { id: 'txtBpjsKetenagakerjaan', placeholder: 'Nomor kartu BPJS TK' })));

    tabPayControls.push(tblPayroll);
    tabPayControls.push(this.createSaveBar('btnSavePayroll'));
    mainTabs.addTab({ label: 'Kompensasi & Payroll', icon: '💰', controls: tabPayControls });

    // ==========================================
    // TAB 5: DOKUMEN & LEGALITAS (Documents)
    // ==========================================
    const tabDocControls = [];
    tabDocControls.push(new WiseLabel('4. Dokumen & Legalitas (Documents & Compliance)', { id: 'lblDocHeading', style: { fontSize: 16, fontWeight: 700, marginBottom: '6px' } }));
    tabDocControls.push(new WiseLabel('Penyimpanan berkas digital resmi: Scan KTP, Kartu Keluarga, NPWP, Salinan Kontrak PKWT/PKWTT, dan Sertifikat profesi.', { id: 'lblDocSub', style: { fontSize: 12, color: '#64748b', marginBottom: '12px' } }));

    const dtDocuments = new WiseDataTable({ id: 'dtDocuments', pageSize: 5 });
    dtDocuments.setColumns([
      { dataField: 'documentType', header: 'Jenis Dokumen', width: 140 },
      { dataField: 'title', header: 'Nama / Judul Dokumen', width: 220 },
      { dataField: 'documentNumber', header: 'Nomor Dokumen', width: 160 },
      { dataField: 'issueDate', header: 'Tgl Terbit', width: 110 },
      { dataField: 'expiryDate', header: 'Tgl Berakhir', width: 110 },
      { dataField: 'description', header: 'Keterangan', width: 180 }
    ]);
    tabDocControls.push(dtDocuments);

    const frameNewDoc = new WiseFrame('Tambah Dokumen / Berkas Baru', { id: 'frameNewDoc', style: { marginTop: '12px' } });
    const tblNewDoc = new WiseTableLayout({ rows: 3, columns: 2, id: 'tblNewDoc' });
    tblNewDoc.setCell(0, 0, this.formGroup('Jenis Dokumen *', new WiseComboBox(DOC_TYPES.map(d => ({ value: d, label: d })), { id: 'cmbNewDocType', value: 'KTP' })));
    tblNewDoc.setCell(0, 1, this.formGroup('Judul Dokumen *', new WiseTextBox('', { id: 'txtNewDocTitle', placeholder: 'e.g. Scan KTP Asli' })));
    tblNewDoc.setCell(1, 0, this.formGroup('Nomor Dokumen', new WiseTextBox('', { id: 'txtNewDocNumber', placeholder: 'Nomor KTP/NPWP/No Kontrak' })));
    tblNewDoc.setCell(1, 1, this.formGroup('Keterangan Dokumen', new WiseTextBox('', { id: 'txtNewDocDesc', placeholder: 'Deskripsi berkas...' })));
    tblNewDoc.setCell(2, 0, new WiseButton('📄 Simpan Data Dokumen', { id: 'btnSubmitDoc', onClick: this.onAddDocumentClick.bind(this) }), { colSpan: 2 });
    frameNewDoc.addControl(tblNewDoc);
    tabDocControls.push(frameNewDoc);

    mainTabs.addTab({ label: 'Dokumen & Legalitas', icon: '📁', controls: tabDocControls });

    // ==========================================
    // TAB 6: RIWAYAT PEKERJAAN SEBELUMNYA (Work Experience)
    // ==========================================
    const tabExpControls = [];
    tabExpControls.push(new WiseLabel('5. Riwayat Pekerjaan di Organisasi Sebelumnya', { id: 'lblExpHeading', style: { fontSize: 16, fontWeight: 700, marginBottom: '6px' } }));
    tabExpControls.push(new WiseLabel('Catatan perjalanan profesional karyawan selama bekerja di perusahaan sebelumnya: nama perusahaan, posisi, durasi kerja, dan deskripsi.', { id: 'lblExpSub', style: { fontSize: 12, color: '#64748b', marginBottom: '12px' } }));

    const dtExperiences = new WiseDataTable({ id: 'dtExperiences', pageSize: 5 });
    dtExperiences.setColumns([
      { dataField: 'companyName', header: 'Perusahaan Sebelumnya', width: 200 },
      { dataField: 'position', header: 'Posisi / Jabatan', width: 180 },
      { dataField: 'startDate', header: 'Tgl Mulai', width: 110 },
      { dataField: 'endDate', header: 'Tgl Selesai', width: 110 },
      { dataField: 'lastSalary', header: 'Gaji Terakhir', width: 130 },
      { dataField: 'description', header: 'Keterangan Tugas & Pencapaian', width: 220 }
    ]);
    tabExpControls.push(dtExperiences);

    const frameNewExp = new WiseFrame('Tambah Riwayat Pekerjaan Sebelumnya', { id: 'frameNewExp', style: { marginTop: '12px' } });
    const tblNewExp = new WiseTableLayout({ rows: 3, columns: 2, id: 'tblNewExp' });
    tblNewExp.setCell(0, 0, this.formGroup('Nama Perusahaan *', new WiseTextBox('', { id: 'txtNewExpCompany', placeholder: 'e.g. PT Telekomunikasi Indonesia' })));
    tblNewExp.setCell(0, 1, this.formGroup('Posisi / Jabatan *', new WiseTextBox('', { id: 'txtNewExpPosition', placeholder: 'e.g. Software Engineer' })));
    tblNewExp.setCell(1, 0, this.formGroup('Tanggal Mulai (YYYY-MM-DD)', new WiseTextBox('', { id: 'txtNewExpStart', placeholder: '2020-01-01' })));
    tblNewExp.setCell(1, 1, this.formGroup('Tanggal Selesai (YYYY-MM-DD)', new WiseTextBox('', { id: 'txtNewExpEnd', placeholder: '2022-12-31' })));
    tblNewExp.setCell(2, 0, this.formGroup('Keterangan / Tanggung Jawab', new WiseTextBox('', { id: 'txtNewExpDesc', placeholder: 'Deskripsi pekerjaan...' })), { colSpan: 2 });
    frameNewExp.addControl(tblNewExp);
    frameNewExp.addControl(new WiseButton('➕ Tambahkan Pengalaman Kerja', { id: 'btnSubmitExp', onClick: this.onAddExperienceClick.bind(this) }));
    tabExpControls.push(frameNewExp);

    mainTabs.addTab({ label: 'Pengalaman Sebelumnya', icon: '🏢', controls: tabExpControls });

    // ==========================================
    // TAB 7: RIWAYAT PENDIDIKAN (Education History)
    // ==========================================
    const tabEduControls = [];
    tabEduControls.push(new WiseLabel('6. Riwayat Pendidikan (Education History)', { id: 'lblEduHeading', style: { fontSize: 16, fontWeight: 700, marginBottom: '6px' } }));
    tabEduControls.push(new WiseLabel('Catatan latar belakang akademis: nama institusi pendidikan, jenjang, jurusan studi, dan tanggal kelulusan.', { id: 'lblEduSub', style: { fontSize: 12, color: '#64748b', marginBottom: '12px' } }));

    const dtEducation = new WiseDataTable({ id: 'dtEducation', pageSize: 5 });
    dtEducation.setColumns([
      { dataField: 'institutionName', header: 'Institusi Pendidikan', width: 220 },
      { dataField: 'degree', header: 'Jenjang', width: 100 },
      { dataField: 'major', header: 'Jurusan / Bidang Studi', width: 180 },
      { dataField: 'startDate', header: 'Tgl Mulai', width: 110 },
      { dataField: 'graduationDate', header: 'Tgl Kelulusan', width: 110 },
      { dataField: 'gpa', header: 'IPK / Nilai', width: 90 },
      { dataField: 'description', header: 'Keterangan Tambahan', width: 180 }
    ]);
    tabEduControls.push(dtEducation);

    const frameNewEdu = new WiseFrame('Tambah Riwayat Pendidikan', { id: 'frameNewEdu', style: { marginTop: '12px' } });
    const tblNewEdu = new WiseTableLayout({ rows: 3, columns: 2, id: 'tblNewEdu' });
    tblNewEdu.setCell(0, 0, this.formGroup('Nama Institusi / Universitas *', new WiseTextBox('', { id: 'txtNewEduInst', placeholder: 'e.g. Institut Teknologi Bandung' })));
    tblNewEdu.setCell(0, 1, this.formGroup('Jenjang Pendidikan', new WiseComboBox(EDU_DEGREES.map(d => ({ value: d, label: d })), { id: 'cmbNewEduDegree', value: 'S1' })));
    tblNewEdu.setCell(1, 0, this.formGroup('Jurusan / Program Studi', new WiseTextBox('', { id: 'txtNewEduMajor', placeholder: 'e.g. Teknik Informatika' })));
    tblNewEdu.setCell(1, 1, this.formGroup('Tanggal Lulus (YYYY-MM-DD)', new WiseTextBox('', { id: 'txtNewEduGrad', placeholder: '2020-10-15' })));
    tblNewEdu.setCell(2, 0, this.formGroup('Keterangan / Judul Skripsi / Prestasi', new WiseTextBox('', { id: 'txtNewEduDesc', placeholder: 'Prestasi atau catatan...' })), { colSpan: 2 });
    frameNewEdu.addControl(tblNewEdu);
    frameNewEdu.addControl(new WiseButton('➕ Tambahkan Riwayat Pendidikan', { id: 'btnSubmitEdu', onClick: this.onAddEducationClick.bind(this) }));
    tabEduControls.push(frameNewEdu);

    mainTabs.addTab({ label: 'Riwayat Pendidikan', icon: '🎓', controls: tabEduControls });

    // ==========================================
    // TAB 8: RIWAYAT KARIR INTERNAL (Career History)
    // ==========================================
    const tabCareerControls = [];
    tabCareerControls.push(new WiseLabel('7. Riwayat Karir & Organisasi Internal', { id: 'lblCarHeading', style: { fontSize: 16, fontWeight: 700, marginBottom: '6px' } }));
    tabCareerControls.push(new WiseLabel('Catatan perjalanan karyawan selama bekerja di perusahaan ini: riwayat promosi, mutasi, penyesuaian gaji, penghargaan, dan sanksi disiplin.', { id: 'lblCarSub', style: { fontSize: 12, color: '#64748b', marginBottom: '12px' } }));

    const dtCareer = new WiseDataTable({ id: 'dtCareer', pageSize: 5 });
    dtCareer.setColumns([
      { dataField: 'changeType', header: 'Jenis Perubahan', width: 140 },
      { dataField: 'effectiveDate', header: 'Tgl Efektif', width: 110 },
      { dataField: 'newJobTitle', header: 'Jabatan Baru', width: 160 },
      { dataField: 'newDepartment', header: 'Departemen Baru', width: 140 },
      { dataField: 'newSalary', header: 'Gaji Baru', width: 130 },
      { dataField: 'referenceNumber', header: 'Nomor SK', width: 140 },
      { dataField: 'notes', header: 'Catatan / Alasan', width: 220 }
    ]);
    tabCareerControls.push(dtCareer);

    const frameNewCar = new WiseFrame('Catat Perubahan Karir / Promosi / Mutasi', { id: 'frameNewCar', style: { marginTop: '12px' } });
    const tblNewCar = new WiseTableLayout({ rows: 3, columns: 2, id: 'tblNewCar' });
    tblNewCar.setCell(0, 0, this.formGroup('Jenis Perubahan *', new WiseComboBox(CAREER_TYPES.map(c => ({ value: c, label: c })), { id: 'cmbNewCareerType', value: 'Promosi' })));
    tblNewCar.setCell(0, 1, this.formGroup('Tanggal Efektif * (YYYY-MM-DD)', new WiseTextBox('', { id: 'txtNewCareerDate', placeholder: '2024-01-01' })));
    tblNewCar.setCell(1, 0, this.formGroup('Jabatan Baru', new WiseTextBox('', { id: 'txtNewCareerTitle', placeholder: 'Posisi jabatan yang baru' })));
    tblNewCar.setCell(1, 1, this.formGroup('Departemen Baru', new WiseTextBox('', { id: 'txtNewCareerDept', placeholder: 'Departemen baru' })));
    tblNewCar.setCell(2, 0, this.formGroup('Nomor SK / Keputusan Direksi', new WiseTextBox('', { id: 'txtNewCareerRef', placeholder: 'SK/DIR/2024/001' })));
    tblNewCar.setCell(2, 1, this.formGroup('Catatan / Alasan', new WiseTextBox('', { id: 'txtNewCareerNotes', placeholder: 'Keterangan prestasi / alasan...' })));
    frameNewCar.addControl(tblNewCar);
    frameNewCar.addControl(new WiseButton('📝 Catat Riwayat Karir', { id: 'btnSubmitCareer', onClick: this.onAddCareerClick.bind(this) }));
    tabCareerControls.push(frameNewCar);

    mainTabs.addTab({ label: 'Riwayat Karir Internal', icon: '📈', controls: tabCareerControls });

    this.addControl(mainTabs);

    return this;
  }

  formGroup(label, control) {
    const frame = new WiseFrame('', { style: { padding: '4px 6px', border: 'none', background: 'transparent' } });
    frame.addControl(new WiseLabel(label, { style: { fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: '2px' } }));
    frame.addControl(control);
    return frame;
  }

  createSaveBar(buttonId) {
    const bar = new WiseTableLayout({ rows: 1, columns: 4, id: `bar_${buttonId}`, style: { marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' } });
    bar.setCell(0, 0, new WiseButton('💾 Simpan Data Karyawan', { id: buttonId, onClick: this.onSaveEmployee.bind(this), style: { background: '#2563eb' } }));
    bar.setCell(0, 1, new WiseButton('⚡ Nonaktifkan / Aktifkan', { id: `btnDeact_${buttonId}`, onClick: this.onToggleDeactivate.bind(this), style: { background: '#d97706' } }));
    bar.setCell(0, 2, new WiseButton('🗑️ Hapus Karyawan', { id: `btnDel_${buttonId}`, onClick: this.onDeleteEmployee.bind(this), style: { background: '#dc2626' } }));
    bar.setCell(0, 3, new WiseButton('⬅️ Kembali ke Daftar', { id: `btnBack_${buttonId}`, onClick: () => this.mainTabs.setValue(0) }));
    return bar;
  }

  async loadInitialData() {
    try {
      await this.refreshStatistics();
      await this.loadEmployeesTable();
    } catch (err) {
      this.showInfo('Error Koneksi Backend', err.message, 'error');
    }
  }

  async refreshStatistics() {
    try {
      const stats = await api.getStatistics();
      if (stats) {
        this.lblStatsSummary.text(
          `👥 Total: ${stats.totalEmployees || 0} Karyawan  |  🟢 Aktif: ${stats.activeEmployees || 0}  |  🔴 Nonaktif: ${stats.inactiveEmployees || 0}`
        );
      }
    } catch (e) {
      this.lblStatsSummary.text('⚠️ Gagal terhubung ke backend service HRIS (Port 4001)');
    }
  }

  async loadEmployeesTable(page = 1, limit = 8) {
    try {
      const search = this.txtSearch ? this.txtSearch.value : '';
      const dept = this.cmbFilterDept ? this.cmbFilterDept.value : 'Semua';

      const res = await api.listEmployees({
        page,
        limit,
        search,
        department: dept !== 'Semua' ? dept : undefined
      });

      this.cachedEmployees = res.rows || [];
      const totalCount = res.meta?.total || this.cachedEmployees.length;

      const formattedRows = this.cachedEmployees.map(emp => ({
        ...emp,
        statusBadge: emp.isActive ? '🟢 Aktif' : '🔴 Nonaktif',
        tenureText: emp.tenure?.formatted || '-'
      }));

      this.dtEmployees.pageSize = limit;
      this.dtEmployees.currentPage = page;
      this.dtEmployees.setData(formattedRows, totalCount);

      if (this.cachedEmployees.length > 0 && !this.selectedEmployeeId) {
        this.selectEmployee(this.cachedEmployees[0]);
      }
    } catch (err) {
      this.showInfo('Gagal Memuat Karyawan', err.message, 'error');
    }
  }

  async onTableFilterChanged(pageSize, page) {
    await this.loadEmployeesTable(page, pageSize);
  }

  async onSearchClick() {
    await this.loadEmployeesTable(1, this.dtEmployees.pageSize);
  }

  async onFilterChanged() {
    await this.loadEmployeesTable(1, this.dtEmployees.pageSize);
  }

  onEmployeeRowSelect(row) {
    if (!row) return;
    this.selectEmployee(row);
  }

  async onEditEmployeeClick(row) {
    if (!row) return;
    await this.selectEmployee(row);
    this.mainTabs.setValue(1); // Jump to Personal Info tab
  }

  async selectEmployee(employeeSummary) {
    this.selectedEmployeeId = employeeSummary.id;
    this.lblSelectedInfo.text(`Karyawan Terpilih: ${employeeSummary.fullName} (${employeeSummary.nik}) — ${employeeSummary.jobTitle}`);

    try {
      const full = await api.getEmployeeById(employeeSummary.id);
      this.currentEmployeeData = full;
      this.populateForm(full);
    } catch (err) {
      this.showInfo('Gagal Memuat Detail', err.message, 'error');
    }
  }

  populateForm(emp) {
    if (!emp) return;

    // Personal Info
    this.txtFullName.setValue(emp.fullName || '');
    this.txtNickname.setValue(emp.nickname || '');
    this.txtBirthPlace.setValue(emp.birthPlace || '');
    this.txtBirthDate.setValue(emp.birthDate || '');
    this.cmbGender.setValue(emp.gender || 'Laki-laki');
    this.cmbReligion.setValue(emp.religion || 'Islam');
    this.txtPhoneNumber.setValue(emp.phoneNumber || '');
    this.txtPersonalEmail.setValue(emp.personalEmail || '');
    this.txtCurrentAddress.setValue(emp.currentAddress || '');
    this.txtIdCardAddress.setValue(emp.idCardAddress || '');
    this.txtEmergencyName.setValue(emp.emergencyContactName || '');
    this.cmbEmergencyRelation.setValue(emp.emergencyContactRelation || 'Orang Tua');
    this.txtEmergencyPhone.setValue(emp.emergencyContactPhone || '');

    // Employment
    this.txtNik.setValue(emp.nik || '');
    this.txtJobTitle.setValue(emp.jobTitle || '');
    this.cmbJobLevel.setValue(emp.jobLevel || 'Staff');
    this.txtDepartment.setValue(emp.department || '');
    this.txtDivision.setValue(emp.division || '');
    this.cmbEmploymentStatus.setValue(emp.employmentStatus || 'Karyawan Tetap');
    this.txtJoinDate.setValue(emp.joinDate || '');
    this.txtEndDate.setValue(emp.endDate || '');
    this.txtManagerName.setValue(emp.managerName || (emp.manager ? emp.manager.fullName : ''));
    this.cmbWorkLocation.setValue(emp.workLocation || 'Kantor Pusat');
    this.cmbStatus.setValue(emp.status || 'Aktif');

    // Payroll
    this.cmbBankName.setValue(emp.bankName || 'BCA');
    this.txtBankAccountNumber.setValue(emp.bankAccountNumber || '');
    this.txtBankAccountHolder.setValue(emp.bankAccountHolder || '');
    this.numBasicSalary.setValue(parseFloat(emp.basicSalary || 0));
    this.numAllowancePosition.setValue(parseFloat(emp.allowancePosition || 0));
    this.numAllowanceTransport.setValue(parseFloat(emp.allowanceTransport || 0));
    this.numAllowanceMeal.setValue(parseFloat(emp.allowanceMeal || 0));
    this.numAllowanceOther.setValue(parseFloat(emp.allowanceOther || 0));
    this.cmbTaxStatus.setValue(emp.taxStatus || 'TK/0');
    this.txtNpwp.setValue(emp.npwp || '');
    this.txtBpjsKesehatan.setValue(emp.bpjsKesehatan || '');
    this.txtBpjsKetenagakerjaan.setValue(emp.bpjsKetenagakerjaan || '');

    // Child relations
    if (this.dtDocuments) {
      this.dtDocuments.setData(emp.documents || [], (emp.documents || []).length);
    }
    if (this.dtExperiences) {
      this.dtExperiences.setData(emp.workExperiences || [], (emp.workExperiences || []).length);
    }
    if (this.dtEducation) {
      this.dtEducation.setData(emp.educationHistories || [], (emp.educationHistories || []).length);
    }
    if (this.dtCareer) {
      this.dtCareer.setData(emp.careerHistories || [], (emp.careerHistories || []).length);
    }
  }

  onNewEmployeeClick() {
    this.selectedEmployeeId = null;
    this.currentEmployeeData = null;

    // Reset fields
    this.txtFullName.setValue('');
    this.txtNickname.setValue('');
    this.txtBirthPlace.setValue('');
    this.txtBirthDate.setValue('');
    this.txtPhoneNumber.setValue('');
    this.txtPersonalEmail.setValue('');
    this.txtCurrentAddress.setValue('');
    this.txtIdCardAddress.setValue('');
    this.txtEmergencyName.setValue('');
    this.txtEmergencyPhone.setValue('');

    const nextNumber = Math.floor(100 + Math.random() * 900);
    this.txtNik.setValue(`EMP-2024-${nextNumber}`);
    this.txtJobTitle.setValue('');
    this.txtDepartment.setValue('Technology');
    this.txtDivision.setValue('');
    this.txtJoinDate.setValue(new Date().toISOString().slice(0, 10));
    this.txtEndDate.setValue('');
    this.txtManagerName.setValue('');

    this.txtBankAccountNumber.setValue('');
    this.txtBankAccountHolder.setValue('');
    this.numBasicSalary.setValue(8000000);
    this.numAllowancePosition.setValue(1000000);
    this.numAllowanceTransport.setValue(1000000);
    this.numAllowanceMeal.setValue(500000);
    this.numAllowanceOther.setValue(0);
    this.txtNpwp.setValue('');
    this.txtBpjsKesehatan.setValue('');
    this.txtBpjsKetenagakerjaan.setValue('');

    if (this.dtDocuments) this.dtDocuments.setData([], 0);
    if (this.dtExperiences) this.dtExperiences.setData([], 0);
    if (this.dtEducation) this.dtEducation.setData([], 0);
    if (this.dtCareer) this.dtCareer.setData([], 0);

    this.lblSelectedInfo.text('Mode Tambah Karyawan Baru (Silakan isi data lalu klik Simpan)');
    this.mainTabs.setValue(1); // Jump to Personal Info
  }

  async onSaveEmployee() {
    try {
      const payload = {
        fullName: this.txtFullName.value,
        nickname: this.txtNickname.value,
        birthPlace: this.txtBirthPlace.value,
        birthDate: this.txtBirthDate.value || null,
        gender: this.cmbGender.value,
        religion: this.cmbReligion.value,
        phoneNumber: this.txtPhoneNumber.value,
        personalEmail: this.txtPersonalEmail.value,
        currentAddress: this.txtCurrentAddress.value,
        idCardAddress: this.txtIdCardAddress.value,
        emergencyContactName: this.txtEmergencyName.value,
        emergencyContactRelation: this.cmbEmergencyRelation.value,
        emergencyContactPhone: this.txtEmergencyPhone.value,

        nik: this.txtNik.value,
        jobTitle: this.txtJobTitle.value,
        jobLevel: this.cmbJobLevel.value,
        department: this.txtDepartment.value,
        division: this.txtDivision.value,
        employmentStatus: this.cmbEmploymentStatus.value,
        joinDate: this.txtJoinDate.value || new Date().toISOString().slice(0, 10),
        endDate: this.txtEndDate.value || null,
        managerName: this.txtManagerName.value,
        workLocation: this.cmbWorkLocation.value,
        status: this.cmbStatus.value,

        bankName: this.cmbBankName.value,
        bankAccountNumber: this.txtBankAccountNumber.value,
        bankAccountHolder: this.txtBankAccountHolder.value,
        basicSalary: Number(this.numBasicSalary.value) || 0,
        allowancePosition: Number(this.numAllowancePosition.value) || 0,
        allowanceTransport: Number(this.numAllowanceTransport.value) || 0,
        allowanceMeal: Number(this.numAllowanceMeal.value) || 0,
        allowanceOther: Number(this.numAllowanceOther.value) || 0,
        taxStatus: this.cmbTaxStatus.value,
        npwp: this.txtNpwp.value,
        bpjsKesehatan: this.txtBpjsKesehatan.value,
        bpjsKetenagakerjaan: this.txtBpjsKetenagakerjaan.value
      };

      if (!payload.fullName) {
        return this.showInfo('Validasi', 'Nama lengkap karyawan wajib diisi.', 'warning');
      }
      if (!payload.nik) {
        return this.showInfo('Validasi', 'NIK / ID Karyawan wajib diisi.', 'warning');
      }

      if (this.selectedEmployeeId) {
        // Update
        const updated = await api.updateEmployee(this.selectedEmployeeId, payload);
        this.showInfo('Berhasil', `Data karyawan ${updated.fullName} berhasil diperbarui.`, 'success');
      } else {
        // Create
        const created = await api.createEmployee(payload);
        this.selectedEmployeeId = created.id;
        this.showInfo('Berhasil', `Karyawan baru ${created.fullName} (${created.nik}) berhasil didaftarkan.`, 'success');
      }

      await this.refreshStatistics();
      await this.loadEmployeesTable(this.dtEmployees.currentPage, this.dtEmployees.pageSize);
    } catch (err) {
      this.showInfo('Gagal Menyimpan', err.message, 'error');
    }
  }

  async onToggleDeactivate() {
    if (!this.selectedEmployeeId) {
      return this.showInfo('Peringatan', 'Pilih karyawan terlebih dahulu.', 'warning');
    }

    try {
      const isCurrentlyActive = this.currentEmployeeData?.isActive;
      if (isCurrentlyActive) {
        await api.deactivateEmployee(this.selectedEmployeeId, {
          status: 'Nonaktif',
          reason: 'Status dinonaktifkan oleh administrator melalui Employee Management'
        });
        this.showInfo('Karyawan Dinonaktifkan', `Karyawan ${this.currentEmployeeData.fullName} berhasil dinonaktifkan.`, 'warning');
      } else {
        await api.activateEmployee(this.selectedEmployeeId);
        this.showInfo('Karyawan Diaktifkan', `Karyawan ${this.currentEmployeeData.fullName} berhasil diaktifkan kembali.`, 'success');
      }

      await this.refreshStatistics();
      await this.selectEmployee({ id: this.selectedEmployeeId });
      await this.loadEmployeesTable(this.dtEmployees.currentPage, this.dtEmployees.pageSize);
    } catch (err) {
      this.showInfo('Gagal Ubah Status', err.message, 'error');
    }
  }

  async onDeleteEmployee() {
    if (!this.selectedEmployeeId) {
      return this.showInfo('Peringatan', 'Pilih karyawan yang ingin dihapus terlebih dahulu.', 'warning');
    }

    const name = this.currentEmployeeData?.fullName || this.selectedEmployeeId;
    try {
      await api.deleteEmployee(this.selectedEmployeeId);
      this.showInfo('Berhasil Dihapus', `Data karyawan ${name} berhasil dihapus.`, 'success');
      this.selectedEmployeeId = null;
      this.currentEmployeeData = null;
      this.onNewEmployeeClick();
      await this.refreshStatistics();
      await this.loadEmployeesTable(1, this.dtEmployees.pageSize);
      this.mainTabs.setValue(0);
    } catch (err) {
      this.showInfo('Gagal Menghapus', err.message, 'error');
    }
  }

  // --- Add Sub-records Handlers ---

  async onAddDocumentClick() {
    if (!this.selectedEmployeeId) {
      return this.showInfo('Peringatan', 'Pilih atau simpan data karyawan terlebih dahulu.', 'warning');
    }
    if (!this.txtNewDocTitle.value) {
      return this.showInfo('Validasi', 'Judul dokumen wajib diisi.', 'warning');
    }

    try {
      await api.addDocument(this.selectedEmployeeId, {
        documentType: this.cmbNewDocType.value,
        title: this.txtNewDocTitle.value,
        documentNumber: this.txtNewDocNumber.value,
        description: this.txtNewDocDesc.value
      });
      this.txtNewDocTitle.setValue('');
      this.txtNewDocNumber.setValue('');
      this.txtNewDocDesc.setValue('');
      this.showInfo('Dokumen Ditambahkan', 'Data berkas/dokumen berhasil dicatat.', 'success');
      await this.selectEmployee({ id: this.selectedEmployeeId });
    } catch (err) {
      this.showInfo('Gagal Tambah Dokumen', err.message, 'error');
    }
  }

  async onAddExperienceClick() {
    if (!this.selectedEmployeeId) {
      return this.showInfo('Peringatan', 'Pilih atau simpan data karyawan terlebih dahulu.', 'warning');
    }
    if (!this.txtNewExpCompany.value || !this.txtNewExpPosition.value) {
      return this.showInfo('Validasi', 'Nama perusahaan dan posisi jabatan wajib diisi.', 'warning');
    }

    try {
      await api.addWorkExperience(this.selectedEmployeeId, {
        companyName: this.txtNewExpCompany.value,
        position: this.txtNewExpPosition.value,
        startDate: this.txtNewExpStart.value || null,
        endDate: this.txtNewExpEnd.value || null,
        description: this.txtNewExpDesc.value
      });
      this.txtNewExpCompany.setValue('');
      this.txtNewExpPosition.setValue('');
      this.txtNewExpStart.setValue('');
      this.txtNewExpEnd.setValue('');
      this.txtNewExpDesc.setValue('');
      this.showInfo('Pengalaman Ditambahkan', 'Data riwayat pekerjaan sebelumnya berhasil ditambahkan.', 'success');
      await this.selectEmployee({ id: this.selectedEmployeeId });
    } catch (err) {
      this.showInfo('Gagal Tambah Riwayat', err.message, 'error');
    }
  }

  async onAddEducationClick() {
    if (!this.selectedEmployeeId) {
      return this.showInfo('Peringatan', 'Pilih atau simpan data karyawan terlebih dahulu.', 'warning');
    }
    if (!this.txtNewEduInst.value) {
      return this.showInfo('Validasi', 'Nama institusi pendidikan wajib diisi.', 'warning');
    }

    try {
      await api.addEducationHistory(this.selectedEmployeeId, {
        institutionName: this.txtNewEduInst.value,
        degree: this.cmbNewEduDegree.value,
        major: this.txtNewEduMajor.value,
        graduationDate: this.txtNewEduGrad.value || null,
        description: this.txtNewEduDesc.value
      });
      this.txtNewEduInst.setValue('');
      this.txtNewEduMajor.setValue('');
      this.txtNewEduGrad.setValue('');
      this.txtNewEduDesc.setValue('');
      this.showInfo('Pendidikan Ditambahkan', 'Data riwayat pendidikan berhasil ditambahkan.', 'success');
      await this.selectEmployee({ id: this.selectedEmployeeId });
    } catch (err) {
      this.showInfo('Gagal Tambah Pendidikan', err.message, 'error');
    }
  }

  async onAddCareerClick() {
    if (!this.selectedEmployeeId) {
      return this.showInfo('Peringatan', 'Pilih atau simpan data karyawan terlebih dahulu.', 'warning');
    }
    if (!this.txtNewCareerDate.value) {
      return this.showInfo('Validasi', 'Tanggal efektif perubahan wajib diisi.', 'warning');
    }

    try {
      await api.addCareerHistory(this.selectedEmployeeId, {
        changeType: this.cmbNewCareerType.value,
        effectiveDate: this.txtNewCareerDate.value,
        newJobTitle: this.txtNewCareerTitle.value || undefined,
        newDepartment: this.txtNewCareerDept.value || undefined,
        referenceNumber: this.txtNewCareerRef.value,
        notes: this.txtNewCareerNotes.value,
        applyToEmployee: true
      });
      this.txtNewCareerDate.setValue('');
      this.txtNewCareerTitle.setValue('');
      this.txtNewCareerDept.setValue('');
      this.txtNewCareerRef.setValue('');
      this.txtNewCareerNotes.setValue('');
      this.showInfo('Riwayat Karir Dicatat', 'Riwayat karir berhasil ditambahkan dan profil karyawan disinkronkan.', 'success');
      await this.selectEmployee({ id: this.selectedEmployeeId });
    } catch (err) {
      this.showInfo('Gagal Catat Karir', err.message, 'error');
    }
  }

  onMainTabChanged(prevTab, newTab) {
    // When switching tabs
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinEmployeeManagement;
