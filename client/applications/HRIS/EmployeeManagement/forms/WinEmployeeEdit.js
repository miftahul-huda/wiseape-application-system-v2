const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseNumericBox = require('../../../../system/controls/WiseNumericBox');
const WiseComboBox = require('../../../../system/controls/WiseComboBox');
const WiseDate = require('../../../../system/controls/WiseDate');
const WiseTabControl = require('../../../../system/controls/WiseTabControl');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseFrame = require('../../../../system/controls/WiseFrame');

const WinEmployeeDocumentEdit = require('./WinEmployeeDocumentEdit');
const WinEmployeeExperienceEdit = require('./WinEmployeeExperienceEdit');
const WinEmployeeEducationEdit = require('./WinEmployeeEducationEdit');
const WinEmployeeCareerEdit = require('./WinEmployeeCareerEdit');
const WinEmployeeFamilyEdit = require('./WinEmployeeFamilyEdit');

const HrisApiRepository = require('../services/HrisApiRepository');
const api = new HrisApiRepository();

const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];
const WiseI18n = typeof window !== 'undefined' ? window.WiseI18n : require('../../../../system/WiseI18n');
const EMPLOYMENT_STATUSES = ['Karyawan Tetap', 'Kontrak/PKWT', 'Paruh Waktu', 'Magang'];
const TAX_STATUSES = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'];
const BANKS = ['BCA', 'Bank Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'Bank Danamon', 'Bank Permata', 'Lainnya'];

class WinEmployeeEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = 'Edit Data Karyawan — Wise HRIS';
    this.appIcon = options.appIcon || '✏️';
    this.width = options.width || '88%';
    this.height = options.height || '88%';
    this.centered = true;

    this.selectedEmployeeId = options.employeeId || null;
    this.currentEmployeeData = null;
  }

  onWindowInit() {
    this.controls = [];

    // ── Header / Hero Card ───────────────────────────────────────
    const heroBanner = new WiseFrame('', {
      id: 'frameEditHero',
      style: {
        background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '14px',
        boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.18)',
        color: '#ffffff'
      }
    });

    const tblHero = new WiseTableLayout({ rows: 1, columns: 2, id: 'tblEditHeroLayout' });
    
    const heroLeft = new WiseFrame('', { style: { background: 'transparent', border: 'none', padding: '0' } });
    heroLeft.addControl(new WiseLabel('✏️ Formulir Data Karyawan', {
      id: 'lblEditHeroTitle',
      style: { fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }
    }));
    heroLeft.addControl(new WiseLabel('Tambah / Edit Data Karyawan', {
      id: 'lblEditEmployeeName',
      style: { fontSize: 20, color: '#ffffff', display: 'block', fontWeight: 800, marginBottom: '2px' }
    }));
    heroLeft.addControl(new WiseLabel('Lengkapi seluruh informasi data profil karyawan di bawah ini.', {
      id: 'lblEditEmployeeSub',
      style: { color: 'rgba(255,255,255,0.9)', display: 'block' }
    }));

    const heroRight = new WiseFrame('', { style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' } });
    heroRight.addControl(new WiseButton('💾 Simpan Perubahan', {
      id: 'btnEditSave',
      onClick: this.onSaveEmployee.bind(this),
      style: {
        background: '#ffffff',
        color: 'var(--accent-dark)',
        fontWeight: 700,
        borderRadius: '8px',
        padding: '8px 18px',
        border: 'none',
        boxShadow: 'none',
        marginRight: '8px',
        cursor: 'pointer'
      }
    }));
    heroRight.addControl(new WiseButton('✕ Tutup', {
      id: 'btnEditClose',
      onClick: this.onCloseClick.bind(this),
      style: {
        background: 'rgba(255,255,255,0.2)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '8px',
        padding: '8px 14px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    tblHero.setCell(0, 0, heroLeft);
    tblHero.setCell(0, 1, heroRight);
    heroBanner.addControl(tblHero);
    this.addControl(heroBanner);

    // ── Tab Control ─────────────────────────────────────────────
    const editTabs = new WiseTabControl({
      id: 'editTabs',
      layout: 'horizontal',
      activeIndex: 0,
      onTabChanged: () => {}
    });

    // ── TAB 1: DATA PRIBADI ─────────────────────────────────────
    const tabPersControls = [];
    const tblPersonal = new WiseTableLayout({
      rows: 5,
      columns: 2,
      columnWidths: ['50%', '50%'],
      tableLayout: 'fixed',
      id: 'tblEditPersonal',
      style: { width: '100%', tableLayout: 'fixed', marginBottom: '8px' }
    });
    tblPersonal.setCell(0, 0, this.formGroup('Nama Lengkap *', new WiseTextBox('', { id: 'txtFullName', placeholder: 'e.g. Raden Ayu Annisa Putri, S.T.' })));
    tblPersonal.setCell(0, 1, this.formGroup('Nama Panggilan', new WiseTextBox('', { id: 'txtNickname', placeholder: 'e.g. Annisa' })));
    tblPersonal.setCell(1, 0, this.formGroup('Tempat Lahir', new WiseTextBox('', { id: 'txtBirthPlace', placeholder: 'e.g. Yogyakarta' })));
    tblPersonal.setCell(1, 1, this.formGroup('Tanggal Lahir', new WiseDate('', { id: 'dtBirthDate' })));
    tblPersonal.setCell(2, 0, this.formGroup('Jenis Kelamin', new WiseComboBox([{ value: 'Laki-laki', label: 'Laki-laki' }, { value: 'Perempuan', label: 'Perempuan' }], { id: 'cmbGender', value: 'Laki-laki', style: { width: '100%' } })));
    tblPersonal.setCell(2, 1, this.formGroup('Agama', new WiseComboBox(RELIGIONS.map(r => ({ value: r, label: r })), { id: 'cmbReligion', value: 'Islam', style: { width: '100%' } })));
    tblPersonal.setCell(3, 0, this.formGroup('Nomor Telepon / WhatsApp *', new WiseTextBox('', { id: 'txtPhoneNumber', placeholder: '081234567890' })));
    tblPersonal.setCell(3, 1, this.formGroup('Email Pribadi *', new WiseTextBox('', { id: 'txtPersonalEmail', placeholder: 'karyawan@example.com' })));
    tblPersonal.setCell(4, 0, this.formGroup('Alamat Tempat Tinggal Saat Ini', new WiseTextBox('', { id: 'txtCurrentAddress', placeholder: 'Alamat domisili saat ini' })));
    tblPersonal.setCell(4, 1, this.formGroup('Alamat Sesuai KTP', new WiseTextBox('', { id: 'txtIdCardAddress', placeholder: 'Alamat lengkap sesuai KTP' })));
    tabPersControls.push(tblPersonal);

    const frameEmergency = new WiseFrame('Kontak Darurat (Emergency Contact)', {
      id: 'frameEmergency',
      style: {
        marginTop: '6px',
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        padding: '12px'
      }
    });
    const tblEmergency = new WiseTableLayout({
      rows: 1,
      columns: 3,
      columnWidths: ['33.33%', '33.33%', '33.34%'],
      tableLayout: 'fixed',
      id: 'tblEmergency',
      style: { width: '100%', tableLayout: 'fixed' }
    });
    tblEmergency.setCell(0, 0, this.formGroup('Nama Kontak Darurat', new WiseTextBox('', { id: 'txtEmergencyName', placeholder: 'Nama kontak darurat' })));
    tblEmergency.setCell(0, 1, this.formGroup('Hubungan', new WiseComboBox(['Orang Tua', 'Suami/Istri', 'Saudara Kandung', 'Anak', 'Teman'].map(h => ({ value: h, label: h })), { id: 'cmbEmergencyRelation', value: 'Orang Tua', style: { width: '100%' } })));
    tblEmergency.setCell(0, 2, this.formGroup('Nomor Telepon Darurat', new WiseTextBox('', { id: 'txtEmergencyPhone', placeholder: '0812xxxxxxxx' })));
    frameEmergency.addControl(tblEmergency);
    tabPersControls.push(frameEmergency);

    editTabs.addTab({ label: 'Data Pribadi', icon: '👤', controls: tabPersControls });

    // ── TAB 2: DATA PEKERJAAN ───────────────────────────────────
    const tabEmplControls = [];
    const tblEmployment = new WiseTableLayout({
      rows: 5,
      columns: 2,
      columnWidths: ['50%', '50%'],
      tableLayout: 'fixed',
      id: 'tblEditEmployment',
      style: { width: '100%', tableLayout: 'fixed', marginBottom: '8px' }
    });
    tblEmployment.setCell(0, 0, this.formGroup('NIK / ID Karyawan *', new WiseTextBox('', { id: 'txtNik', placeholder: 'EMP-2024-001' })));
    // Department / Division / Job Title / Job Level are fed from the Organization,
    // Position and Job Level master data (see loadMasterData / applyOrgSelection).
    const orgComboStyle = { width: '100%' };
    tblEmployment.setCell(0, 1, this.formGroup('Departemen', new WiseComboBox([], {
      id: 'cmbDepartment', value: '', style: orgComboStyle,
      onChange: this.onDepartmentChanged.bind(this)
    })));
    tblEmployment.setCell(1, 0, this.formGroup('Divisi / Sub-Departemen', new WiseComboBox([], {
      id: 'cmbDivision', value: '', style: orgComboStyle,
      onChange: this.onDivisionChanged.bind(this)
    })));
    tblEmployment.setCell(1, 1, this.formGroup('Jabatan / Posisi *', new WiseComboBox([], {
      id: 'cmbJobTitle', value: '', style: orgComboStyle,
      onChange: this.onJobTitleChanged.bind(this)
    })));
    tblEmployment.setCell(2, 0, this.formGroup('Tingkat Jabatan', new WiseComboBox([], {
      id: 'cmbJobLevel', value: '', style: orgComboStyle
    })));
    tblEmployment.setCell(2, 1, this.formGroup('Status Kepegawaian', new WiseComboBox(EMPLOYMENT_STATUSES.map(s => ({ value: s, label: s })), { id: 'cmbEmploymentStatus', value: 'Karyawan Tetap', style: orgComboStyle })));
    tblEmployment.setCell(3, 0, this.formGroup('Tanggal Bergabung', new WiseDate('', { id: 'dtJoinDate' })));
    tblEmployment.setCell(3, 1, this.formGroup('Tanggal Berakhir (Kontrak/Magang)', new WiseDate('', { id: 'dtEndDate' })));
    tblEmployment.setCell(4, 0, this.formGroup('Atasan Langsung', new WiseTextBox('', { id: 'txtManagerName', placeholder: 'Nama Atasan Langsung' })));
    tblEmployment.setCell(4, 1, this.formGroup('Lokasi Kerja', new WiseComboBox(['Kantor Pusat', 'Kantor Cabang', 'Remote', 'Hybrid'].map(l => ({ value: l, label: l })), { id: 'cmbWorkLocation', value: 'Kantor Pusat', style: orgComboStyle })));
    tabEmplControls.push(tblEmployment);
    editTabs.addTab({ label: 'Data Pekerjaan', icon: '💼', controls: tabEmplControls });

    // ── TAB 3: KOMPENSASI & PAYROLL ─────────────────────────────
    const tabPayControls = [];
    const tblPayroll = new WiseTableLayout({
      rows: 6,
      columns: 2,
      columnWidths: ['50%', '50%'],
      tableLayout: 'fixed',
      id: 'tblEditPayroll',
      style: { width: '100%', tableLayout: 'fixed', marginBottom: '8px' }
    });
    tblPayroll.setCell(0, 0, this.formGroup('Nama Bank', new WiseComboBox(BANKS.map(b => ({ value: b, label: b })), { id: 'cmbBankName', value: 'BCA', style: { width: '100%' } })));
    tblPayroll.setCell(0, 1, this.formGroup('Nomor Rekening Bank', new WiseTextBox('', { id: 'txtBankAccountNumber', placeholder: 'Nomor rekening untuk transfer gaji' })));
    tblPayroll.setCell(1, 0, this.formGroup('Nama Pemilik Rekening', new WiseTextBox('', { id: 'txtBankAccountHolder', placeholder: 'Harus sesuai buku tabungan' })));
    tblPayroll.setCell(1, 1, this.formGroup('Gaji Pokok', new WiseNumericBox('0', { id: 'numBasicSalary', value: 0, prefix: 'Rp ' })));
    tblPayroll.setCell(2, 0, this.formGroup('Tunjangan Jabatan', new WiseNumericBox('0', { id: 'numAllowancePosition', value: 0, prefix: 'Rp ' })));
    tblPayroll.setCell(2, 1, this.formGroup('Tunjangan Transport', new WiseNumericBox('0', { id: 'numAllowanceTransport', value: 0, prefix: 'Rp ' })));
    tblPayroll.setCell(3, 0, this.formGroup('Tunjangan Makan', new WiseNumericBox('0', { id: 'numAllowanceMeal', value: 0, prefix: 'Rp ' })));
    tblPayroll.setCell(3, 1, this.formGroup('Tunjangan Lainnya', new WiseNumericBox('0', { id: 'numAllowanceOther', value: 0, prefix: 'Rp ' })));
    tblPayroll.setCell(4, 0, this.formGroup('Status Perpajakan (PTKP)', new WiseComboBox(TAX_STATUSES.map(t => ({ value: t, label: t })), { id: 'cmbTaxStatus', value: 'TK/0' })));
    tblPayroll.setCell(4, 1, this.formGroup('Nomor NPWP', new WiseTextBox('', { id: 'txtNpwp', placeholder: '00.000.000.0-000.000' })));
    tblPayroll.setCell(5, 0, this.formGroup('Nomor BPJS Kesehatan', new WiseTextBox('', { id: 'txtBpjsKesehatan', placeholder: '13 digit nomor BPJS Kesehatan' })));
    tblPayroll.setCell(5, 1, this.formGroup('Nomor BPJS Ketenagakerjaan', new WiseTextBox('', { id: 'txtBpjsKetenagakerjaan', placeholder: 'Nomor kartu BPJS TK' })));
    tabPayControls.push(tblPayroll);
    editTabs.addTab({ label: 'Kompensasi & Payroll', icon: '💰', controls: tabPayControls });

    // ── TAB 4: DOKUMEN & LEGALITAS ──────────────────────────────
    const tabDocControls = [];
    const docToolbar = new WiseFrame('', {
      id: 'frameDocToolbar',
      layout: 'horizontal',
      style: { background: 'transparent', border: 'none', padding: '0', marginBottom: '10px' }
    });
    docToolbar.addControl(new WiseButton('➕ Tambah Dokumen', {
      id: 'btnOpenAddDoc',
      onClick: this.onOpenAddDocClick.bind(this),
      style: { background: 'var(--accent)', color: '#ffffff', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    docToolbar.addControl(new WiseButton('✏️ Edit Dokumen', {
      id: 'btnOpenEditDoc',
      onClick: this.onOpenEditDocClick.bind(this),
      style: { background: '#f1f5f9', color: '#334155', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    docToolbar.addControl(new WiseButton('🗑️ Hapus Dokumen', {
      id: 'btnDeleteDoc',
      onClick: this.onDeleteDocClick.bind(this),
      style: { background: '#fee2e2', color: '#dc2626', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    tabDocControls.push(docToolbar);

    const dtDocuments = new WiseDataTable({ id: 'dtDocuments', pageSize: 6 });
    dtDocuments.setColumns([
      { dataField: 'documentType', header: 'Jenis Dokumen', width: 140 },
      { dataField: 'title', header: 'Nama / Judul Dokumen', width: 220 },
      { dataField: 'documentNumber', header: 'Nomor Dokumen', width: 160 },
      { dataField: 'issueDate', header: 'Tgl Terbit', width: 110 },
      { dataField: 'expiryDate', header: 'Tgl Berakhir', width: 110 },
      { dataField: 'description', header: 'Keterangan', width: 200 }
    ]);
    dtDocuments.addContextMenu([
      { id: 'edit', label: 'Edit Dokumen', onClick: (row) => this.onOpenEditDocClick(row) },
      { id: 'delete', label: 'Hapus Dokumen', onClick: (row) => this.onDeleteDocClick(row) }
    ]);
    tabDocControls.push(dtDocuments);
    editTabs.addTab({ label: 'Dokumen & Legalitas', icon: '📁', controls: tabDocControls });

    // ── TAB 5: PENGALAMAN KERJA ──────────────────────────────────
    const tabExpControls = [];
    const expToolbar = new WiseFrame('', {
      id: 'frameExpToolbar',
      layout: 'horizontal',
      style: { background: 'transparent', border: 'none', padding: '0', marginBottom: '10px' }
    });
    expToolbar.addControl(new WiseButton('➕ Tambah Pengalaman', {
      id: 'btnOpenAddExp',
      onClick: this.onOpenAddExpClick.bind(this),
      style: { background: 'var(--accent)', color: '#ffffff', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    expToolbar.addControl(new WiseButton('✏️ Edit Pengalaman', {
      id: 'btnOpenEditExp',
      onClick: this.onOpenEditExpClick.bind(this),
      style: { background: '#f1f5f9', color: '#334155', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    expToolbar.addControl(new WiseButton('🗑️ Hapus Pengalaman', {
      id: 'btnDeleteExp',
      onClick: this.onDeleteExpClick.bind(this),
      style: { background: '#fee2e2', color: '#dc2626', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    tabExpControls.push(expToolbar);

    const dtExperiences = new WiseDataTable({ id: 'dtExperiences', pageSize: 6 });
    dtExperiences.setColumns([
      { dataField: 'companyName', header: 'Perusahaan', width: 200 },
      { dataField: 'position', header: 'Posisi', width: 180 },
      { dataField: 'startDate', header: 'Tgl Mulai', width: 110 },
      { dataField: 'endDate', header: 'Tgl Selesai', width: 110 },
      { dataField: 'lastSalary', header: 'Gaji Terakhir', width: 130 },
      { dataField: 'description', header: 'Keterangan', width: 220 }
    ]);
    dtExperiences.addContextMenu([
      { id: 'edit', label: 'Edit Pengalaman', onClick: (row) => this.onOpenEditExpClick(row) },
      { id: 'delete', label: 'Hapus Pengalaman', onClick: (row) => this.onDeleteExpClick(row) }
    ]);
    tabExpControls.push(dtExperiences);
    editTabs.addTab({ label: 'Pengalaman Kerja', icon: '🏢', controls: tabExpControls });

    // ── TAB 6: RIWAYAT PENDIDIKAN ───────────────────────────────
    const tabEduControls = [];
    const eduToolbar = new WiseFrame('', {
      id: 'frameEduToolbar',
      layout: 'horizontal',
      style: { background: 'transparent', border: 'none', padding: '0', marginBottom: '10px' }
    });
    eduToolbar.addControl(new WiseButton('➕ Tambah Pendidikan', {
      id: 'btnOpenAddEdu',
      onClick: this.onOpenAddEduClick.bind(this),
      style: { background: 'var(--accent)', color: '#ffffff', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    eduToolbar.addControl(new WiseButton('✏️ Edit Pendidikan', {
      id: 'btnOpenEditEdu',
      onClick: this.onOpenEditEduClick.bind(this),
      style: { background: '#f1f5f9', color: '#334155', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    eduToolbar.addControl(new WiseButton('🗑️ Hapus Pendidikan', {
      id: 'btnDeleteEdu',
      onClick: this.onDeleteEduClick.bind(this),
      style: { background: '#fee2e2', color: '#dc2626', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    tabEduControls.push(eduToolbar);

    const dtEducation = new WiseDataTable({ id: 'dtEducation', pageSize: 6 });
    dtEducation.setColumns([
      { dataField: 'institutionName', header: 'Institusi Pendidikan', width: 220 },
      { dataField: 'degree', header: 'Jenjang', width: 100 },
      { dataField: 'major', header: 'Jurusan', width: 180 },
      { dataField: 'startDate', header: 'Tgl Mulai', width: 110 },
      { dataField: 'graduationDate', header: 'Tgl Lulus', width: 110 },
      { dataField: 'gpa', header: 'IPK', width: 90 },
      { dataField: 'description', header: 'Keterangan', width: 200 }
    ]);
    dtEducation.addContextMenu([
      { id: 'edit', label: 'Edit Pendidikan', onClick: (row) => this.onOpenEditEduClick(row) },
      { id: 'delete', label: 'Hapus Pendidikan', onClick: (row) => this.onDeleteEduClick(row) }
    ]);
    tabEduControls.push(dtEducation);
    editTabs.addTab({ label: 'Riwayat Pendidikan', icon: '🎓', controls: tabEduControls });

    // ── TAB 7: RIWAYAT KARIR INTERNAL ───────────────────────────
    const tabCareerControls = [];
    const careerToolbar = new WiseFrame('', {
      id: 'frameCareerToolbar',
      layout: 'horizontal',
      style: { background: 'transparent', border: 'none', padding: '0', marginBottom: '10px' }
    });
    careerToolbar.addControl(new WiseButton('➕ Catat Riwayat Karir', {
      id: 'btnOpenAddCareer',
      onClick: this.onOpenAddCareerClick.bind(this),
      style: { background: 'var(--accent)', color: '#ffffff', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    careerToolbar.addControl(new WiseButton('✏️ Edit Riwayat Karir', {
      id: 'btnOpenEditCareer',
      onClick: this.onOpenEditCareerClick.bind(this),
      style: { background: '#f1f5f9', color: '#334155', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    careerToolbar.addControl(new WiseButton('🗑️ Hapus Riwayat Karir', {
      id: 'btnDeleteCareer',
      onClick: this.onDeleteCareerClick.bind(this),
      style: { background: '#fee2e2', color: '#dc2626', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    tabCareerControls.push(careerToolbar);

    const dtCareer = new WiseDataTable({ id: 'dtCareer', pageSize: 6 });
    dtCareer.setColumns([
      { dataField: 'changeType', header: 'Jenis Perubahan', width: 140 },
      { dataField: 'effectiveDate', header: 'Tgl Efektif', width: 110 },
      { dataField: 'newJobTitle', header: 'Jabatan Baru', width: 160 },
      { dataField: 'newDepartment', header: 'Departemen Baru', width: 140 },
      { dataField: 'newSalary', header: 'Gaji Baru', width: 130 },
      { dataField: 'referenceNumber', header: 'Nomor SK', width: 140 },
      { dataField: 'notes', header: 'Catatan', width: 220 }
    ]);
    dtCareer.addContextMenu([
      { id: 'edit', label: 'Edit Riwayat Karir', onClick: (row) => this.onOpenEditCareerClick(row) },
      { id: 'delete', label: 'Hapus Riwayat Karir', onClick: (row) => this.onDeleteCareerClick(row) }
    ]);
    tabCareerControls.push(dtCareer);
    editTabs.addTab({ label: 'Riwayat Karir', icon: '📈', controls: tabCareerControls });

    // ── TAB 8: DATA KELUARGA ────────────────────────────────────
    const tabFamilyControls = [];
    const familyToolbar = new WiseFrame('', {
      id: 'frameFamilyToolbar',
      layout: 'horizontal',
      style: { background: 'transparent', border: 'none', padding: '0', marginBottom: '10px' }
    });
    familyToolbar.addControl(new WiseButton('➕ Tambah Anggota Keluarga', {
      id: 'btnOpenAddFamily',
      onClick: this.onOpenAddFamilyClick.bind(this),
      style: { background: 'var(--accent)', color: '#ffffff', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    familyToolbar.addControl(new WiseButton('✏️ Edit Anggota Keluarga', {
      id: 'btnOpenEditFamily',
      onClick: this.onOpenEditFamilyClick.bind(this),
      style: { background: '#f1f5f9', color: '#334155', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    familyToolbar.addControl(new WiseButton('🗑️ Hapus Anggota Keluarga', {
      id: 'btnDeleteFamily',
      onClick: this.onDeleteFamilyClick.bind(this),
      style: { background: '#fee2e2', color: '#dc2626', fontWeight: 600, borderRadius: '8px', padding: '8px 14px', border: 'none', boxShadow: 'none', cursor: 'pointer' }
    }));
    tabFamilyControls.push(familyToolbar);

    const dtFamily = new WiseDataTable({ id: 'dtFamily', pageSize: 6 });
    dtFamily.setColumns([
      { dataField: 'name', header: 'Nama Anggota Keluarga', width: 240 },
      { dataField: 'gender', header: 'Gender', width: 140 },
      { dataField: 'relationship', header: 'Hubungan', width: 180 },
      { dataField: 'phone', header: 'Nomor Kontak', width: 200 }
    ]);
    dtFamily.addContextMenu([
      { id: 'edit', label: 'Edit Anggota Keluarga', onClick: (row) => this.onOpenEditFamilyClick(row) },
      { id: 'delete', label: 'Hapus Anggota Keluarga', onClick: (row) => this.onDeleteFamilyClick(row) }
    ]);
    tabFamilyControls.push(dtFamily);
    editTabs.addTab({ label: 'Data Keluarga', icon: '👨‍👩‍👧‍👦', controls: tabFamilyControls });

    this.addControl(editTabs);
    return this;
  }

  formGroup(label, control) {
    const frame = new WiseFrame('', { style: { padding: '4px 6px', border: 'none', background: 'transparent', width: '100%', boxSizing: 'border-box' } });
    frame.addControl(new WiseLabel(label, { style: { fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' } }));
    frame.addControl(control);
    return frame;
  }

  async onShow(options = {}) {
    this.visible = true;
    const opts = options || {};
    const employeeId = opts.employeeId || this.selectedEmployeeId;
    await this.loadMasterData();
    if (employeeId) {
      await this.loadEmployee(employeeId);
    } else {
      this.applyOrgSelection({});
    }
  }

  // ── Organization / Position / Job Level master data ───────────
  async loadMasterData() {
    try {
      const [orgRes, levelRes, posRes] = await Promise.all([
        api.listOrganizations({ isActive: 'true', sortBy: 'sortOrder', sortOrder: 'ASC' }),
        api.listJobLevels({ isActive: 'true', sortBy: 'levelNumber', sortOrder: 'ASC' }),
        api.listPositions({ isActive: 'true', sortBy: 'title', sortOrder: 'ASC' })
      ]);
      this.orgs = orgRes.rows || [];
      this.jobLevels = levelRes.rows || [];
      this.positions = posRes.rows || [];
    } catch (err) {
      this.orgs = [];
      this.jobLevels = [];
      this.positions = [];
      this.showInfo('Gagal Memuat Master Data', err.message, 'error');
    }
  }

  t(key) {
    return WiseI18n.t(key);
  }

  // Builds combobox items from a list of names, prepending a blank option and
  // keeping the current value selectable even if it is no longer in master
  // data (legacy employee records) so saving never silently drops it.
  buildNameItems(names, current, blankLabel) {
    const unique = [...new Set(names.filter(Boolean))];
    if (current && !unique.includes(current)) unique.push(current);
    return [{ value: '', label: this.t(blankLabel) }, ...unique.map((n) => ({ value: n, label: n }))];
  }

  // Re-populates the four dependent comboboxes for the given selection:
  //   Department  = root organizations (no parent)
  //   Division    = child organizations of selected Department (or all child orgs if no Dept selected)
  //   Job Title   = positions of Division/Department, or all active positions
  //   Job Level   = all job levels
  applyOrgSelection({ department = '', division = '', jobTitle = '', jobLevel = '' }) {
    const orgs = this.orgs || [];
    const positions = this.positions || [];
    const levels = this.jobLevels || [];

    const roots = orgs.filter((o) => !o.parentId);
    const deptObj = roots.find((o) => o.name === department) || null;

    // If a parent department is selected, list its sub-departments/divisions.
    // Otherwise list ALL sub-departments/divisions so the user can always pick a division.
    let divisions;
    if (deptObj) {
      divisions = orgs.filter((o) => o.parentId === deptObj.id);
    } else {
      divisions = orgs.filter((o) => o.parentId);
    }
    const divObj = orgs.find((o) => o.name === division) || null;

    // Filter candidate positions based on division or department
    let candidateOrgIds;
    if (divObj) {
      candidateOrgIds = new Set([divObj.id]);
    } else if (deptObj) {
      const childIds = orgs.filter((o) => o.parentId === deptObj.id).map((o) => o.id);
      candidateOrgIds = new Set([deptObj.id, ...childIds]);
    } else {
      candidateOrgIds = null;
    }

    let candidates = candidateOrgIds ? positions.filter((p) => candidateOrgIds.has(p.organizationId)) : [];
    if (candidates.length === 0) candidates = positions;
    const titles = candidates.map((p) => p.title);
    const levelNames = levels.map((l) => l.name);

    if (this.cmbDepartment) {
      this.cmbDepartment.setItems(this.buildNameItems(roots.map((o) => o.name), department, '(Pilih Departemen)'));
      this.cmbDepartment.setValue(department);
    }
    if (this.cmbDivision) {
      this.cmbDivision.setItems(this.buildNameItems(divisions.map((o) => o.name), division, '(Pilih Divisi / Sub-Departemen)'));
      this.cmbDivision.setValue(division);
    }
    if (this.cmbJobTitle) {
      this.cmbJobTitle.setItems(this.buildNameItems(titles, jobTitle, '(Pilih Jabatan)'));
      this.cmbJobTitle.setValue(jobTitle);
    }
    if (this.cmbJobLevel) {
      this.cmbJobLevel.setItems(this.buildNameItems(levelNames, jobLevel, '(Pilih Tingkat Jabatan)'));
      this.cmbJobLevel.setValue(jobLevel);
    }
  }

  currentOrgSelection() {
    return {
      department: this.cmbDepartment ? this.cmbDepartment.value : '',
      division: this.cmbDivision ? this.cmbDivision.value : '',
      jobTitle: this.cmbJobTitle ? this.cmbJobTitle.value : '',
      jobLevel: this.cmbJobLevel ? this.cmbJobLevel.value : ''
    };
  }

  onDepartmentChanged() {
    const sel = this.currentOrgSelection();
    const orgs = this.orgs || [];
    const deptObj = orgs.find((o) => !o.parentId && o.name === sel.department);
    if (deptObj) {
      const childOrgs = orgs.filter((o) => o.parentId === deptObj.id);
      const isChild = childOrgs.some((o) => o.name === sel.division);
      if (!isChild && sel.division) {
        sel.division = '';
        sel.jobTitle = '';
      }
    }
    this.applyOrgSelection(sel);
  }

  onDivisionChanged() {
    const sel = this.currentOrgSelection();
    const orgs = this.orgs || [];
    const divObj = orgs.find((o) => o.name === sel.division && o.parentId) || orgs.find((o) => o.name === sel.division) || null;
    if (divObj && divObj.parentId) {
      const parentDept = orgs.find((o) => o.id === divObj.parentId);
      if (parentDept) {
        sel.department = parentDept.name;
      }
    }
    if (sel.jobTitle && divObj) {
      const pos = (this.positions || []).find((p) => p.title === sel.jobTitle);
      if (pos && pos.organizationId && pos.organizationId !== divObj.id) {
        sel.jobTitle = '';
      }
    }
    this.applyOrgSelection(sel);
  }

  onJobTitleChanged() {
    const sel = this.currentOrgSelection();
    const pos = (this.positions || []).find((p) => p.title === sel.jobTitle);
    if (pos) {
      if (pos.jobLevelId) {
        const level = (this.jobLevels || []).find((l) => l.id === pos.jobLevelId);
        if (level) sel.jobLevel = level.name;
      }
      if (pos.organizationId) {
        const orgs = this.orgs || [];
        const posOrg = orgs.find((o) => o.id === pos.organizationId);
        if (posOrg) {
          if (posOrg.parentId) {
            sel.division = posOrg.name;
            const parentDept = orgs.find((o) => o.id === posOrg.parentId);
            if (parentDept) sel.department = parentDept.name;
          } else {
            sel.department = posOrg.name;
          }
        }
      }
    }
    this.applyOrgSelection(sel);
  }

  async loadEmployee(employeeId) {
    if (!employeeId) return;
    this.selectedEmployeeId = employeeId;
    try {
      const emp = await api.getEmployeeById(employeeId);
      this.currentEmployeeData = emp;
      this.title = `Edit Data Karyawan — ${emp.fullName || emp.nik}`;
      this.populateForm(emp);
    } catch (err) {
      this.showInfo('Gagal Memuat Data', err.message, 'error');
    }
  }

  populateForm(emp) {
    if (!emp) return;

    if (this.lblEditEmployeeName) {
      this.lblEditEmployeeName.text(`${emp.fullName || ''} (${emp.nik || ''})`);
    }

    // Personal
    if (this.txtFullName) this.txtFullName.setValue(emp.fullName || '');
    if (this.txtNickname) this.txtNickname.setValue(emp.nickname || '');
    if (this.txtBirthPlace) this.txtBirthPlace.setValue(emp.birthPlace || '');
    if (this.dtBirthDate) this.dtBirthDate.setValue(emp.birthDate || '');
    if (this.cmbGender) this.cmbGender.setValue(emp.gender || 'Laki-laki');
    if (this.cmbReligion) this.cmbReligion.setValue(emp.religion || 'Islam');
    if (this.txtPhoneNumber) this.txtPhoneNumber.setValue(emp.phoneNumber || '');
    if (this.txtPersonalEmail) this.txtPersonalEmail.setValue(emp.personalEmail || '');
    if (this.txtCurrentAddress) this.txtCurrentAddress.setValue(emp.currentAddress || '');
    if (this.txtIdCardAddress) this.txtIdCardAddress.setValue(emp.idCardAddress || '');
    if (this.txtEmergencyName) this.txtEmergencyName.setValue(emp.emergencyContactName || '');
    if (this.cmbEmergencyRelation) this.cmbEmergencyRelation.setValue(emp.emergencyContactRelation || 'Orang Tua');
    if (this.txtEmergencyPhone) this.txtEmergencyPhone.setValue(emp.emergencyContactPhone || '');

    // Employment
    if (this.txtNik) this.txtNik.setValue(emp.nik || '');
    this.applyOrgSelection({
      department: emp.department || '',
      division: emp.division || '',
      jobTitle: emp.jobTitle || '',
      jobLevel: emp.jobLevel || ''
    }, true);
    if (this.cmbEmploymentStatus) this.cmbEmploymentStatus.setValue(emp.employmentStatus || 'Karyawan Tetap');
    if (this.dtJoinDate) this.dtJoinDate.setValue(emp.joinDate || '');
    if (this.dtEndDate) this.dtEndDate.setValue(emp.endDate || '');
    if (this.txtManagerName) this.txtManagerName.setValue(emp.managerName || (emp.manager ? emp.manager.fullName : ''));
    if (this.cmbWorkLocation) this.cmbWorkLocation.setValue(emp.workLocation || 'Kantor Pusat');

    // Payroll
    if (this.cmbBankName) this.cmbBankName.setValue(emp.bankName || 'BCA');
    if (this.txtBankAccountNumber) this.txtBankAccountNumber.setValue(emp.bankAccountNumber || '');
    if (this.txtBankAccountHolder) this.txtBankAccountHolder.setValue(emp.bankAccountHolder || '');
    if (this.numBasicSalary) this.numBasicSalary.setValue(parseFloat(emp.basicSalary || 0));
    if (this.numAllowancePosition) this.numAllowancePosition.setValue(parseFloat(emp.allowancePosition || 0));
    if (this.numAllowanceTransport) this.numAllowanceTransport.setValue(parseFloat(emp.allowanceTransport || 0));
    if (this.numAllowanceMeal) this.numAllowanceMeal.setValue(parseFloat(emp.allowanceMeal || 0));
    if (this.numAllowanceOther) this.numAllowanceOther.setValue(parseFloat(emp.allowanceOther || 0));
    if (this.cmbTaxStatus) this.cmbTaxStatus.setValue(emp.taxStatus || 'TK/0');
    if (this.txtNpwp) this.txtNpwp.setValue(emp.npwp || '');
    if (this.txtBpjsKesehatan) this.txtBpjsKesehatan.setValue(emp.bpjsKesehatan || '');
    if (this.txtBpjsKetenagakerjaan) this.txtBpjsKetenagakerjaan.setValue(emp.bpjsKetenagakerjaan || '');

    // Sub-records
    if (this.dtDocuments) this.dtDocuments.setData(emp.documents || [], (emp.documents || []).length);
    if (this.dtExperiences) this.dtExperiences.setData(emp.workExperiences || [], (emp.workExperiences || []).length);
    if (this.dtEducation) this.dtEducation.setData(emp.educationHistories || [], (emp.educationHistories || []).length);
    if (this.dtCareer) this.dtCareer.setData(emp.careerHistories || [], (emp.careerHistories || []).length);
    if (this.dtFamily) this.dtFamily.setData(emp.familyMembers || [], (emp.familyMembers || []).length);
  }

  async onSaveEmployee() {
    try {
      const payload = {
        fullName: this.txtFullName ? this.txtFullName.value : '',
        nickname: this.txtNickname ? this.txtNickname.value : '',
        birthPlace: this.txtBirthPlace ? this.txtBirthPlace.value : '',
        birthDate: (this.dtBirthDate ? this.dtBirthDate.value : null) || null,
        gender: this.cmbGender ? this.cmbGender.value : 'Laki-laki',
        religion: this.cmbReligion ? this.cmbReligion.value : 'Islam',
        phoneNumber: this.txtPhoneNumber ? this.txtPhoneNumber.value : '',
        personalEmail: this.txtPersonalEmail ? this.txtPersonalEmail.value : '',
        currentAddress: this.txtCurrentAddress ? this.txtCurrentAddress.value : '',
        idCardAddress: this.txtIdCardAddress ? this.txtIdCardAddress.value : '',
        emergencyContactName: this.txtEmergencyName ? this.txtEmergencyName.value : '',
        emergencyContactRelation: this.cmbEmergencyRelation ? this.cmbEmergencyRelation.value : '',
        emergencyContactPhone: this.txtEmergencyPhone ? this.txtEmergencyPhone.value : '',

        nik: this.txtNik ? this.txtNik.value : '',
        jobTitle: this.cmbJobTitle ? this.cmbJobTitle.value : '',
        jobLevel: this.cmbJobLevel ? this.cmbJobLevel.value : '',
        department: this.cmbDepartment ? this.cmbDepartment.value : '',
        division: this.cmbDivision ? this.cmbDivision.value : '',
        employmentStatus: this.cmbEmploymentStatus ? this.cmbEmploymentStatus.value : 'Karyawan Tetap',
        joinDate: (this.dtJoinDate ? this.dtJoinDate.value : null) || new Date().toISOString().slice(0, 10),
        endDate: (this.dtEndDate ? this.dtEndDate.value : null) || null,
        managerName: this.txtManagerName ? this.txtManagerName.value : '',
        workLocation: this.cmbWorkLocation ? this.cmbWorkLocation.value : 'Kantor Pusat',

        bankName: this.cmbBankName ? this.cmbBankName.value : 'BCA',
        bankAccountNumber: this.txtBankAccountNumber ? this.txtBankAccountNumber.value : '',
        bankAccountHolder: this.txtBankAccountHolder ? this.txtBankAccountHolder.value : '',
        basicSalary: Number(this.numBasicSalary ? this.numBasicSalary.value : 0) || 0,
        allowancePosition: Number(this.numAllowancePosition ? this.numAllowancePosition.value : 0) || 0,
        allowanceTransport: Number(this.numAllowanceTransport ? this.numAllowanceTransport.value : 0) || 0,
        allowanceMeal: Number(this.numAllowanceMeal ? this.numAllowanceMeal.value : 0) || 0,
        allowanceOther: Number(this.numAllowanceOther ? this.numAllowanceOther.value : 0) || 0,
        taxStatus: this.cmbTaxStatus ? this.cmbTaxStatus.value : 'TK/0',
        npwp: this.txtNpwp ? this.txtNpwp.value : '',
        bpjsKesehatan: this.txtBpjsKesehatan ? this.txtBpjsKesehatan.value : '',
        bpjsKetenagakerjaan: this.txtBpjsKetenagakerjaan ? this.txtBpjsKetenagakerjaan.value : '',
      };

      if (!payload.fullName) return this.showInfo('Validasi', 'Nama lengkap karyawan wajib diisi.', 'warning');
      if (!payload.nik) return this.showInfo('Validasi', 'NIK / ID Karyawan wajib diisi.', 'warning');

      if (this.selectedEmployeeId) {
        const updated = await api.updateEmployee(this.selectedEmployeeId, payload);
        this.showInfo('Berhasil', `Data karyawan ${updated.fullName} berhasil diperbarui.`, 'success');
        await this.loadEmployee(this.selectedEmployeeId);
      } else {
        const created = await api.createEmployee(payload);
        this.selectedEmployeeId = created.id;
        this.showInfo('Berhasil', `Karyawan baru ${created.fullName} (${created.nik}) berhasil didaftarkan.`, 'success');
        await this.loadEmployee(this.selectedEmployeeId);
      }
      if (this.parentWindow && typeof this.parentWindow.loadInitialData === 'function') {
        await this.parentWindow.loadInitialData();
      }
    } catch (err) {
      this.showInfo('Gagal Menyimpan', err.message, 'error');
    }
  }

  // ── Document Handlers ─────────────────────────────────────────
  async onOpenAddDocClick() {
    if (!this.selectedEmployeeId) return this.showInfo('Peringatan', 'Simpan data karyawan terlebih dahulu sebelum menambahkan dokumen.', 'warning');
    await this.openWindow(WinEmployeeDocumentEdit, { employeeId: this.selectedEmployeeId, data: null });
  }

  async onOpenEditDocClick(row) {
    const targetRow = row || (this.dtDocuments ? this.dtDocuments.getSelectedRow() : null);
    if (!targetRow) return this.showInfo('Pilih Dokumen', 'Pilih dokumen dari tabel yang ingin diedit.', 'warning');
    await this.openWindow(WinEmployeeDocumentEdit, { employeeId: this.selectedEmployeeId, data: targetRow });
  }

  async onDeleteDocClick(row) {
    const targetRow = row || (this.dtDocuments ? this.dtDocuments.getSelectedRow() : null);
    if (!targetRow) return this.showInfo('Pilih Dokumen', 'Pilih dokumen dari tabel yang ingin dihapus.', 'warning');
    try {
      await api.deleteDocument(targetRow.id);
      this.showInfo('Berhasil', `Dokumen "${targetRow.title}" berhasil dihapus.`, 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo('Gagal Menghapus', err.message, 'error');
    }
  }

  // ── Experience Handlers ───────────────────────────────────────
  async onOpenAddExpClick() {
    if (!this.selectedEmployeeId) return this.showInfo('Peringatan', 'Simpan data karyawan terlebih dahulu sebelum menambahkan pengalaman.', 'warning');
    await this.openWindow(WinEmployeeExperienceEdit, { employeeId: this.selectedEmployeeId, data: null });
  }

  async onOpenEditExpClick(row) {
    const targetRow = row || (this.dtExperiences ? this.dtExperiences.getSelectedRow() : null);
    if (!targetRow) return this.showInfo('Pilih Pengalaman', 'Pilih riwayat pengalaman kerja dari tabel yang ingin diedit.', 'warning');
    await this.openWindow(WinEmployeeExperienceEdit, { employeeId: this.selectedEmployeeId, data: targetRow });
  }

  async onDeleteExpClick(row) {
    const targetRow = row || (this.dtExperiences ? this.dtExperiences.getSelectedRow() : null);
    if (!targetRow) return this.showInfo('Pilih Pengalaman', 'Pilih riwayat pengalaman kerja dari tabel yang ingin dihapus.', 'warning');
    try {
      await api.deleteWorkExperience(targetRow.id);
      this.showInfo('Berhasil', `Pengalaman kerja di "${targetRow.companyName}" berhasil dihapus.`, 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo('Gagal Menghapus', err.message, 'error');
    }
  }

  // ── Education Handlers ────────────────────────────────────────
  async onOpenAddEduClick() {
    if (!this.selectedEmployeeId) return this.showInfo('Peringatan', 'Simpan data karyawan terlebih dahulu sebelum menambahkan pendidikan.', 'warning');
    await this.openWindow(WinEmployeeEducationEdit, { employeeId: this.selectedEmployeeId, data: null });
  }

  async onOpenEditEduClick(row) {
    const targetRow = row || (this.dtEducation ? this.dtEducation.getSelectedRow() : null);
    if (!targetRow) return this.showInfo('Pilih Pendidikan', 'Pilih riwayat pendidikan dari tabel yang ingin diedit.', 'warning');
    await this.openWindow(WinEmployeeEducationEdit, { employeeId: this.selectedEmployeeId, data: targetRow });
  }

  async onDeleteEduClick(row) {
    const targetRow = row || (this.dtEducation ? this.dtEducation.getSelectedRow() : null);
    if (!targetRow) return this.showInfo('Pilih Pendidikan', 'Pilih riwayat pendidikan dari tabel yang ingin dihapus.', 'warning');
    try {
      await api.deleteEducationHistory(targetRow.id);
      this.showInfo('Berhasil', `Pendidikan di "${targetRow.institutionName}" berhasil dihapus.`, 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo('Gagal Menghapus', err.message, 'error');
    }
  }

  // ── Career Handlers ───────────────────────────────────────────
  async onOpenAddCareerClick() {
    if (!this.selectedEmployeeId) return this.showInfo('Peringatan', 'Simpan data karyawan terlebih dahulu sebelum mencatat mutasi/promosi.', 'warning');
    await this.openWindow(WinEmployeeCareerEdit, { employeeId: this.selectedEmployeeId, data: null });
  }

  async onOpenEditCareerClick(row) {
    const targetRow = row || (this.dtCareer ? this.dtCareer.getSelectedRow() : null);
    if (!targetRow) return this.showInfo('Pilih Riwayat Karir', 'Pilih riwayat karir dari tabel yang ingin diedit.', 'warning');
    await this.openWindow(WinEmployeeCareerEdit, { employeeId: this.selectedEmployeeId, data: targetRow });
  }

  async onDeleteCareerClick(row) {
    const targetRow = row || (this.dtCareer ? this.dtCareer.getSelectedRow() : null);
    if (!targetRow) return this.showInfo('Pilih Riwayat Karir', 'Pilih riwayat karir dari tabel yang ingin dihapus.', 'warning');
    try {
      await api.deleteCareerHistory(targetRow.id);
      this.showInfo('Berhasil', 'Riwayat karir berhasil dihapus.', 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo('Gagal Menghapus', err.message, 'error');
    }
  }

  // ── Family Handlers ───────────────────────────────────────────
  async onOpenAddFamilyClick() {
    if (!this.selectedEmployeeId) return this.showInfo('Peringatan', 'Simpan data karyawan terlebih dahulu sebelum menambahkan data keluarga.', 'warning');
    await this.openWindow(WinEmployeeFamilyEdit, { employeeId: this.selectedEmployeeId, data: null });
  }

  async onOpenEditFamilyClick(row) {
    const targetRow = row || (this.dtFamily ? this.dtFamily.getSelectedRow() : null);
    if (!targetRow) return this.showInfo('Pilih Anggota Keluarga', 'Pilih anggota keluarga dari tabel yang ingin diedit.', 'warning');
    await this.openWindow(WinEmployeeFamilyEdit, { employeeId: this.selectedEmployeeId, data: targetRow });
  }

  async onDeleteFamilyClick(row) {
    const targetRow = row || (this.dtFamily ? this.dtFamily.getSelectedRow() : null);
    if (!targetRow) return this.showInfo('Pilih Anggota Keluarga', 'Pilih anggota keluarga dari tabel yang ingin dihapus.', 'warning');
    try {
      await api.deleteFamilyMember(targetRow.id);
      this.showInfo('Berhasil', `Data anggota keluarga "${targetRow.name}" berhasil dihapus.`, 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo('Gagal Menghapus', err.message, 'error');
    }
  }

  onCloseClick() {
    this.close();
  }
}

module.exports = WinEmployeeEdit;
