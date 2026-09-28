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

const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];
const JOB_LEVELS = ['Staff', 'Senior Staff', 'Supervisor', 'Manager', 'General Manager', 'Director'];
const EMPLOYMENT_STATUSES = ['Karyawan Tetap', 'Kontrak/PKWT', 'Paruh Waktu', 'Magang'];
const TAX_STATUSES = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'];
const BANKS = ['BCA', 'Bank Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'Bank Danamon', 'Bank Permata', 'Lainnya'];
const EDU_DEGREES = ['SMA/SMK', 'D3', 'D4', 'S1', 'S2', 'S3', 'Sertifikasi Profesi'];
const DOC_TYPES = ['KTP', 'KK', 'NPWP', 'Kontrak Kerja', 'Sertifikat', 'Ijazah', 'Lisensi Profesi', 'Lainnya'];
const CAREER_TYPES = ['Promosi', 'Demosi', 'Rotasi', 'Penyesuaian Gaji', 'Penghargaan', 'Surat Peringatan'];

class WinEmployeeDetail extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = 'Employee Detail — Wise HRIS';
    this.appIcon = options.appIcon || '📋';
    this.width = '90%';
    this.height = '90%';
    this.centered = true;

    this.selectedEmployeeId = null;
    this.currentEmployeeData = null;
  }

  onWindowInit() {
    this.controls = [];

    // ── Hero Banner ───────────────────────────────────────────────
    const heroBanner = new WiseFrame('', {
      id: 'frameDetailHero',
      style: {
        background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)',
        borderRadius: '10px',
        marginBottom: '14px',
        boxShadow: '0 6px 18px -4px rgba(0,0,0,0.18)'
      }
    });
    heroBanner.addControl(new WiseLabel('📋 Employee Detail', {
      id: 'lblDetailHeroTitle',
      style: { fontSize: 18, fontWeight: 800, color: '#ffffff', display: 'block' }
    }));
    heroBanner.addControl(new WiseLabel('', {
      id: 'lblDetailEmployeeName',
      style: { fontSize: 13, color: 'rgba(255,255,255,0.9)', display: 'block', fontWeight: 600 }
    }));
    heroBanner.addControl(new WiseLabel('', {
      id: 'lblDetailEmployeeInfo',
      style: { fontSize: 11, color: 'rgba(255,255,255,0.75)', display: 'block' }
    }));
    this.addControl(heroBanner);

    // ── Action Bar ───────────────────────────────────────────────
    const actionBar = new WiseTableLayout({ rows: 1, columns: 5, id: 'tblDetailActions', style: { marginBottom: '12px' } });
    actionBar.setCell(0, 0, new WiseButton('💾 Simpan Data', { id: 'btnDetailSave', onClick: this.onSaveEmployee.bind(this) }));
    actionBar.setCell(0, 1, new WiseButton('⚡ Aktif / Nonaktif', { id: 'btnDetailToggle', onClick: this.onToggleDeactivate.bind(this), style: { background: '#d97706' } }));
    actionBar.setCell(0, 2, new WiseButton('🗑️ Hapus', { id: 'btnDetailDelete', onClick: this.onDeleteEmployee.bind(this), style: { background: '#dc2626' } }));
    actionBar.setCell(0, 3, new WiseLabel('', { id: 'lblDetailStatus', style: { fontSize: 12, fontWeight: 600, color: '#64748b', padding: '6px 0' } }));
    this.addControl(actionBar);

    // ── Section 1: Personal Data (displayed directly, not in a tab) ──
    const persHeading = new WiseFrame('', {
      id: 'framePersHead',
      style: { background: 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 8%, white) 0%, white 100%)', borderRadius: '8px', marginBottom: '8px', border: 'none' }
    });
    persHeading.addControl(new WiseLabel('👤 Data Pribadi (Personal Information)', {
      id: 'lblPersSection',
      style: { fontSize: 14, fontWeight: 700, color: 'var(--accent-dark)' }
    }));
    persHeading.addControl(new WiseLabel('Identitas personal, kontak, dan alamat karyawan.', {
      id: 'lblPersSectionSub',
      style: { fontSize: 11, color: '#64748b' }
    }));
    this.addControl(persHeading);

    const tblPersonal = new WiseTableLayout({ rows: 6, columns: 2, id: 'tblDetailPersonal', style: { marginBottom: '10px' } });
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

    const emergencyFrame = new WiseFrame('Kontak Darurat (Emergency Contact)', { id: 'frameEmergency', style: { marginTop: '4px' } });
    const tblEmergency = new WiseTableLayout({ rows: 1, columns: 3, id: 'tblEmergency' });
    tblEmergency.setCell(0, 0, this.formGroup('Nama Kontak Darurat', new WiseTextBox('', { id: 'txtEmergencyName', placeholder: 'Nama kontak darurat' })));
    tblEmergency.setCell(0, 1, this.formGroup('Hubungan', new WiseComboBox(['Orang Tua', 'Suami/Istri', 'Saudara Kandung', 'Anak', 'Teman'].map(h => ({ value: h, label: h })), { id: 'cmbEmergencyRelation', value: 'Orang Tua' })));
    tblEmergency.setCell(0, 2, this.formGroup('Nomor Telepon Darurat', new WiseTextBox('', { id: 'txtEmergencyPhone', placeholder: '0812xxxxxxxx' })));
    emergencyFrame.addControl(tblEmergency);

    this.addControl(tblPersonal);
    this.addControl(emergencyFrame);

    // ── Tabs for additional employee info ──────────────────────────
    const detailTabs = new WiseTabControl({
      id: 'detailTabs',
      layout: 'horizontal',
      activeIndex: 0,
      onTabChanged: () => {}
    });

    // TAB 1: DATA PEKERJAAN
    const tabEmplControls = [];
    const tblEmployment = new WiseTableLayout({ rows: 5, columns: 2, id: 'tblDetailEmployment' });
    tblEmployment.setCell(0, 0, this.formGroup('NIK / ID Karyawan *', new WiseTextBox('', { id: 'txtNik', placeholder: 'EMP-2024-001' })));
    tblEmployment.setCell(0, 1, this.formGroup('Jabatan / Posisi *', new WiseTextBox('', { id: 'txtJobTitle', placeholder: 'e.g. Senior Software Engineer' })));
    tblEmployment.setCell(1, 0, this.formGroup('Tingkat Jabatan', new WiseComboBox(JOB_LEVELS.map(l => ({ value: l, label: l })), { id: 'cmbJobLevel', value: 'Staff' })));
    tblEmployment.setCell(1, 1, this.formGroup('Departemen', new WiseTextBox('', { id: 'txtDepartment', placeholder: 'Technology / Engineering' })));
    tblEmployment.setCell(2, 0, this.formGroup('Divisi / Sub-Departemen', new WiseTextBox('', { id: 'txtDivision', placeholder: 'e.g. Frontend Engineering' })));
    tblEmployment.setCell(2, 1, this.formGroup('Status Kepegawaian', new WiseComboBox(EMPLOYMENT_STATUSES.map(s => ({ value: s, label: s })), { id: 'cmbEmploymentStatus', value: 'Karyawan Tetap' })));
    tblEmployment.setCell(3, 0, this.formGroup('Tanggal Bergabung', new WiseTextBox('', { id: 'txtJoinDate', placeholder: '2023-01-15' })));
    tblEmployment.setCell(3, 1, this.formGroup('Tanggal Berakhir (Kontrak/Magang)', new WiseTextBox('', { id: 'txtEndDate', placeholder: 'YYYY-MM-DD (opsional)' })));
    tblEmployment.setCell(4, 0, this.formGroup('Atasan Langsung', new WiseTextBox('', { id: 'txtManagerName', placeholder: 'Nama Atasan Langsung' })));
    tblEmployment.setCell(4, 1, this.formGroup('Lokasi Kerja', new WiseComboBox(['Kantor Pusat', 'Kantor Cabang', 'Remote', 'Hybrid'].map(l => ({ value: l, label: l })), { id: 'cmbWorkLocation', value: 'Kantor Pusat' })));
    tabEmplControls.push(tblEmployment);
    detailTabs.addTab({ label: 'Data Pekerjaan', icon: '💼', controls: tabEmplControls });

    // TAB 2: KOMPENSASI & PAYROLL
    const tabPayControls = [];
    const tblPayroll = new WiseTableLayout({ rows: 6, columns: 2, id: 'tblDetailPayroll' });
    tblPayroll.setCell(0, 0, this.formGroup('Nama Bank', new WiseComboBox(BANKS.map(b => ({ value: b, label: b })), { id: 'cmbBankName', value: 'BCA' })));
    tblPayroll.setCell(0, 1, this.formGroup('Nomor Rekening Bank', new WiseTextBox('', { id: 'txtBankAccountNumber', placeholder: 'Nomor rekening untuk transfer gaji' })));
    tblPayroll.setCell(1, 0, this.formGroup('Nama Pemilik Rekening', new WiseTextBox('', { id: 'txtBankAccountHolder', placeholder: 'Harus sesuai buku tabungan' })));
    tblPayroll.setCell(1, 1, this.formGroup('Gaji Pokok - Rp', new WiseNumericBox('0', { id: 'numBasicSalary', value: 0, prefix: 'Rp ' })));
    tblPayroll.setCell(2, 0, this.formGroup('Tunjangan Jabatan - Rp', new WiseNumericBox('0', { id: 'numAllowancePosition', value: 0, prefix: 'Rp ' })));
    tblPayroll.setCell(2, 1, this.formGroup('Tunjangan Transport - Rp', new WiseNumericBox('0', { id: 'numAllowanceTransport', value: 0, prefix: 'Rp ' })));
    tblPayroll.setCell(3, 0, this.formGroup('Tunjangan Makan - Rp', new WiseNumericBox('0', { id: 'numAllowanceMeal', value: 0, prefix: 'Rp ' })));
    tblPayroll.setCell(3, 1, this.formGroup('Tunjangan Lainnya - Rp', new WiseNumericBox('0', { id: 'numAllowanceOther', value: 0, prefix: 'Rp ' })));
    tblPayroll.setCell(4, 0, this.formGroup('Status Perpajakan (PTKP)', new WiseComboBox(TAX_STATUSES.map(t => ({ value: t, label: t })), { id: 'cmbTaxStatus', value: 'TK/0' })));
    tblPayroll.setCell(4, 1, this.formGroup('Nomor NPWP', new WiseTextBox('', { id: 'txtNpwp', placeholder: '00.000.000.0-000.000' })));
    tblPayroll.setCell(5, 0, this.formGroup('Nomor BPJS Kesehatan', new WiseTextBox('', { id: 'txtBpjsKesehatan', placeholder: '13 digit nomor BPJS Kesehatan' })));
    tblPayroll.setCell(5, 1, this.formGroup('Nomor BPJS Ketenagakerjaan', new WiseTextBox('', { id: 'txtBpjsKetenagakerjaan', placeholder: 'Nomor kartu BPJS TK' })));
    tabPayControls.push(tblPayroll);
    detailTabs.addTab({ label: 'Kompensasi & Payroll', icon: '💰', controls: tabPayControls });

    // TAB 3: DOKUMEN & LEGALITAS
    const tabDocControls = [];
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

    const frameNewDoc = new WiseFrame('Tambah Dokumen / Berkas Baru', { id: 'frameNewDoc', style: { marginTop: '10px' } });
    const tblNewDoc = new WiseTableLayout({ rows: 3, columns: 2, id: 'tblNewDoc' });
    tblNewDoc.setCell(0, 0, this.formGroup('Jenis Dokumen *', new WiseComboBox(DOC_TYPES.map(d => ({ value: d, label: d })), { id: 'cmbNewDocType', value: 'KTP' })));
    tblNewDoc.setCell(0, 1, this.formGroup('Judul Dokumen *', new WiseTextBox('', { id: 'txtNewDocTitle', placeholder: 'e.g. Scan KTP Asli' })));
    tblNewDoc.setCell(1, 0, this.formGroup('Nomor Dokumen', new WiseTextBox('', { id: 'txtNewDocNumber', placeholder: 'Nomor KTP/NPWP/No Kontrak' })));
    tblNewDoc.setCell(1, 1, this.formGroup('Keterangan Dokumen', new WiseTextBox('', { id: 'txtNewDocDesc', placeholder: 'Deskripsi berkas...' })));
    tblNewDoc.setCell(2, 0, new WiseButton('📄 Simpan Data Dokumen', { id: 'btnSubmitDoc', onClick: this.onAddDocumentClick.bind(this) }), { colSpan: 2 });
    frameNewDoc.addControl(tblNewDoc);
    tabDocControls.push(frameNewDoc);
    detailTabs.addTab({ label: 'Dokumen & Legalitas', icon: '📁', controls: tabDocControls });

    // TAB 4: PENGALAMAN KERJA SEBELUMNYA
    const tabExpControls = [];
    const dtExperiences = new WiseDataTable({ id: 'dtExperiences', pageSize: 5 });
    dtExperiences.setColumns([
      { dataField: 'companyName', header: 'Perusahaan', width: 200 },
      { dataField: 'position', header: 'Posisi', width: 180 },
      { dataField: 'startDate', header: 'Tgl Mulai', width: 110 },
      { dataField: 'endDate', header: 'Tgl Selesai', width: 110 },
      { dataField: 'lastSalary', header: 'Gaji Terakhir', width: 130 },
      { dataField: 'description', header: 'Keterangan', width: 220 }
    ]);
    tabExpControls.push(dtExperiences);
    const frameNewExp = new WiseFrame('Tambah Riwayat Pekerjaan', { id: 'frameNewExp', style: { marginTop: '10px' } });
    const tblNewExp = new WiseTableLayout({ rows: 3, columns: 2, id: 'tblNewExp' });
    tblNewExp.setCell(0, 0, this.formGroup('Nama Perusahaan *', new WiseTextBox('', { id: 'txtNewExpCompany', placeholder: 'e.g. PT Telekomunikasi Indonesia' })));
    tblNewExp.setCell(0, 1, this.formGroup('Posisi / Jabatan *', new WiseTextBox('', { id: 'txtNewExpPosition', placeholder: 'e.g. Software Engineer' })));
    tblNewExp.setCell(1, 0, this.formGroup('Tanggal Mulai (YYYY-MM-DD)', new WiseTextBox('', { id: 'txtNewExpStart', placeholder: '2020-01-01' })));
    tblNewExp.setCell(1, 1, this.formGroup('Tanggal Selesai (YYYY-MM-DD)', new WiseTextBox('', { id: 'txtNewExpEnd', placeholder: '2022-12-31' })));
    tblNewExp.setCell(2, 0, this.formGroup('Keterangan / Tanggung Jawab', new WiseTextBox('', { id: 'txtNewExpDesc', placeholder: 'Deskripsi pekerjaan...' })), { colSpan: 2 });
    frameNewExp.addControl(tblNewExp);
    frameNewExp.addControl(new WiseButton('➕ Tambahkan Pengalaman', { id: 'btnSubmitExp', onClick: this.onAddExperienceClick.bind(this) }));
    tabExpControls.push(frameNewExp);
    detailTabs.addTab({ label: 'Pengalaman Kerja', icon: '🏢', controls: tabExpControls });

    // TAB 5: RIWAYAT PENDIDIKAN
    const tabEduControls = [];
    const dtEducation = new WiseDataTable({ id: 'dtEducation', pageSize: 5 });
    dtEducation.setColumns([
      { dataField: 'institutionName', header: 'Institusi Pendidikan', width: 220 },
      { dataField: 'degree', header: 'Jenjang', width: 100 },
      { dataField: 'major', header: 'Jurusan', width: 180 },
      { dataField: 'startDate', header: 'Tgl Mulai', width: 110 },
      { dataField: 'graduationDate', header: 'Tgl Lulus', width: 110 },
      { dataField: 'gpa', header: 'IPK', width: 90 },
      { dataField: 'description', header: 'Keterangan', width: 180 }
    ]);
    tabEduControls.push(dtEducation);
    const frameNewEdu = new WiseFrame('Tambah Riwayat Pendidikan', { id: 'frameNewEdu', style: { marginTop: '10px' } });
    const tblNewEdu = new WiseTableLayout({ rows: 3, columns: 2, id: 'tblNewEdu' });
    tblNewEdu.setCell(0, 0, this.formGroup('Nama Institusi / Universitas *', new WiseTextBox('', { id: 'txtNewEduInst', placeholder: 'e.g. Institut Teknologi Bandung' })));
    tblNewEdu.setCell(0, 1, this.formGroup('Jenjang Pendidikan', new WiseComboBox(EDU_DEGREES.map(d => ({ value: d, label: d })), { id: 'cmbNewEduDegree', value: 'S1' })));
    tblNewEdu.setCell(1, 0, this.formGroup('Jurusan / Program Studi', new WiseTextBox('', { id: 'txtNewEduMajor', placeholder: 'e.g. Teknik Informatika' })));
    tblNewEdu.setCell(1, 1, this.formGroup('Tanggal Lulus (YYYY-MM-DD)', new WiseTextBox('', { id: 'txtNewEduGrad', placeholder: '2020-10-15' })));
    tblNewEdu.setCell(2, 0, this.formGroup('Keterangan / Prestasi', new WiseTextBox('', { id: 'txtNewEduDesc', placeholder: 'Prestasi atau catatan...' })), { colSpan: 2 });
    frameNewEdu.addControl(tblNewEdu);
    frameNewEdu.addControl(new WiseButton('➕ Tambahkan Pendidikan', { id: 'btnSubmitEdu', onClick: this.onAddEducationClick.bind(this) }));
    tabEduControls.push(frameNewEdu);
    detailTabs.addTab({ label: 'Riwayat Pendidikan', icon: '🎓', controls: tabEduControls });

    // TAB 6: RIWAYAT KARIR INTERNAL
    const tabCareerControls = [];
    const dtCareer = new WiseDataTable({ id: 'dtCareer', pageSize: 5 });
    dtCareer.setColumns([
      { dataField: 'changeType', header: 'Jenis Perubahan', width: 140 },
      { dataField: 'effectiveDate', header: 'Tgl Efektif', width: 110 },
      { dataField: 'newJobTitle', header: 'Jabatan Baru', width: 160 },
      { dataField: 'newDepartment', header: 'Departemen Baru', width: 140 },
      { dataField: 'newSalary', header: 'Gaji Baru', width: 130 },
      { dataField: 'referenceNumber', header: 'Nomor SK', width: 140 },
      { dataField: 'notes', header: 'Catatan', width: 220 }
    ]);
    tabCareerControls.push(dtCareer);
    const frameNewCar = new WiseFrame('Catat Perubahan Karir / Promosi', { id: 'frameNewCar', style: { marginTop: '10px' } });
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
    detailTabs.addTab({ label: 'Riwayat Karir', icon: '📈', controls: tabCareerControls });

    this.addControl(detailTabs);
    return this;
  }

  formGroup(label, control) {
    const frame = new WiseFrame('', { style: { padding: '4px 6px', border: 'none', background: 'transparent' } });
    frame.addControl(new WiseLabel(label, { style: { fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: '2px' } }));
    frame.addControl(control);
    return frame;
  }

  async loadEmployee(employeeId) {
    if (!employeeId) return;
    this.selectedEmployeeId = employeeId;
    try {
      const emp = await api.getEmployeeById(employeeId);
      this.currentEmployeeData = emp;
      this.title = `Employee Detail — ${emp.fullName || emp.nik}`;
      this.populateForm(emp);
    } catch (err) {
      this.showInfo('Gagal Memuat Data', err.message, 'error');
    }
  }

  populateForm(emp) {
    if (!emp) return;

    // Hero banner
    if (this.lblDetailEmployeeName) {
      this.lblDetailEmployeeName.text(`${emp.fullName || ''}  (${emp.nik || ''})`);
    }
    if (this.lblDetailEmployeeInfo) {
      const status = emp.isActive ? '🟢 Aktif' : '🔴 Nonaktif';
      this.lblDetailEmployeeInfo.text(`${emp.jobTitle || '—'}  •  ${emp.department || '—'}  •  ${status}`);
    }

    // Personal
    if (this.txtFullName) this.txtFullName.setValue(emp.fullName || '');
    if (this.txtNickname) this.txtNickname.setValue(emp.nickname || '');
    if (this.txtBirthPlace) this.txtBirthPlace.setValue(emp.birthPlace || '');
    if (this.txtBirthDate) this.txtBirthDate.setValue(emp.birthDate || '');
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
    if (this.txtJobTitle) this.txtJobTitle.setValue(emp.jobTitle || '');
    if (this.cmbJobLevel) this.cmbJobLevel.setValue(emp.jobLevel || 'Staff');
    if (this.txtDepartment) this.txtDepartment.setValue(emp.department || '');
    if (this.txtDivision) this.txtDivision.setValue(emp.division || '');
    if (this.cmbEmploymentStatus) this.cmbEmploymentStatus.setValue(emp.employmentStatus || 'Karyawan Tetap');
    if (this.txtJoinDate) this.txtJoinDate.setValue(emp.joinDate || '');
    if (this.txtEndDate) this.txtEndDate.setValue(emp.endDate || '');
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

    // Status label
    if (this.lblDetailStatus) {
      const tenure = emp.tenure?.formatted || '';
      this.lblDetailStatus.text(tenure ? `Masa Kerja: ${tenure}` : '');
    }
  }

  async onSaveEmployee() {
    try {
      const payload = {
        fullName: this.txtFullName ? this.txtFullName.value : '',
        nickname: this.txtNickname ? this.txtNickname.value : '',
        birthPlace: this.txtBirthPlace ? this.txtBirthPlace.value : '',
        birthDate: this.txtBirthDate ? this.txtBirthDate.value || null : null,
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
        jobTitle: this.txtJobTitle ? this.txtJobTitle.value : '',
        jobLevel: this.cmbJobLevel ? this.cmbJobLevel.value : 'Staff',
        department: this.txtDepartment ? this.txtDepartment.value : '',
        division: this.txtDivision ? this.txtDivision.value : '',
        employmentStatus: this.cmbEmploymentStatus ? this.cmbEmploymentStatus.value : 'Karyawan Tetap',
        joinDate: this.txtJoinDate ? this.txtJoinDate.value || new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        endDate: this.txtEndDate ? this.txtEndDate.value || null : null,
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
    } catch (err) {
      this.showInfo('Gagal Menyimpan', err.message, 'error');
    }
  }

  async onToggleDeactivate() {
    if (!this.selectedEmployeeId) {
      return this.showInfo('Peringatan', 'Data karyawan belum dimuat.', 'warning');
    }
    try {
      const isCurrentlyActive = this.currentEmployeeData?.isActive;
      if (isCurrentlyActive) {
        await api.deactivateEmployee(this.selectedEmployeeId, {
          status: 'Nonaktif',
          reason: 'Status dinonaktifkan oleh administrator melalui Employee Detail'
        });
        this.showInfo('Karyawan Dinonaktifkan', `${this.currentEmployeeData.fullName} berhasil dinonaktifkan.`, 'warning');
      } else {
        await api.activateEmployee(this.selectedEmployeeId);
        this.showInfo('Karyawan Diaktifkan', `${this.currentEmployeeData.fullName} berhasil diaktifkan kembali.`, 'success');
      }
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo('Gagal Ubah Status', err.message, 'error');
    }
  }

  async onDeleteEmployee() {
    if (!this.selectedEmployeeId) {
      return this.showInfo('Peringatan', 'Data karyawan belum dimuat.', 'warning');
    }
    const name = this.currentEmployeeData?.fullName || this.selectedEmployeeId;
    try {
      await api.deleteEmployee(this.selectedEmployeeId);
      this.showInfo('Berhasil Dihapus', `Data karyawan ${name} berhasil dihapus.`, 'success');
      this.selectedEmployeeId = null;
      this.currentEmployeeData = null;
    } catch (err) {
      this.showInfo('Gagal Menghapus', err.message, 'error');
    }
  }

  async onAddDocumentClick() {
    if (!this.selectedEmployeeId) return this.showInfo('Peringatan', 'Data karyawan belum dimuat.', 'warning');
    if (!this.txtNewDocTitle || !this.txtNewDocTitle.value) return this.showInfo('Validasi', 'Judul dokumen wajib diisi.', 'warning');
    try {
      await api.addDocument(this.selectedEmployeeId, {
        documentType: this.cmbNewDocType ? this.cmbNewDocType.value : 'KTP',
        title: this.txtNewDocTitle.value,
        documentNumber: this.txtNewDocNumber ? this.txtNewDocNumber.value : '',
        description: this.txtNewDocDesc ? this.txtNewDocDesc.value : ''
      });
      if (this.txtNewDocTitle) this.txtNewDocTitle.setValue('');
      if (this.txtNewDocNumber) this.txtNewDocNumber.setValue('');
      if (this.txtNewDocDesc) this.txtNewDocDesc.setValue('');
      this.showInfo('Dokumen Ditambahkan', 'Data berkas/dokumen berhasil dicatat.', 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo('Gagal Tambah Dokumen', err.message, 'error');
    }
  }

  async onAddExperienceClick() {
    if (!this.selectedEmployeeId) return this.showInfo('Peringatan', 'Data karyawan belum dimuat.', 'warning');
    if (!this.txtNewExpCompany?.value || !this.txtNewExpPosition?.value) return this.showInfo('Validasi', 'Nama perusahaan dan posisi wajib diisi.', 'warning');
    try {
      await api.addWorkExperience(this.selectedEmployeeId, {
        companyName: this.txtNewExpCompany.value,
        position: this.txtNewExpPosition.value,
        startDate: this.txtNewExpStart?.value || null,
        endDate: this.txtNewExpEnd?.value || null,
        description: this.txtNewExpDesc?.value || ''
      });
      if (this.txtNewExpCompany) this.txtNewExpCompany.setValue('');
      if (this.txtNewExpPosition) this.txtNewExpPosition.setValue('');
      if (this.txtNewExpStart) this.txtNewExpStart.setValue('');
      if (this.txtNewExpEnd) this.txtNewExpEnd.setValue('');
      if (this.txtNewExpDesc) this.txtNewExpDesc.setValue('');
      this.showInfo('Pengalaman Ditambahkan', 'Riwayat pekerjaan sebelumnya berhasil ditambahkan.', 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo('Gagal Tambah Riwayat', err.message, 'error');
    }
  }

  async onAddEducationClick() {
    if (!this.selectedEmployeeId) return this.showInfo('Peringatan', 'Data karyawan belum dimuat.', 'warning');
    if (!this.txtNewEduInst?.value) return this.showInfo('Validasi', 'Nama institusi pendidikan wajib diisi.', 'warning');
    try {
      await api.addEducationHistory(this.selectedEmployeeId, {
        institutionName: this.txtNewEduInst.value,
        degree: this.cmbNewEduDegree?.value || 'S1',
        major: this.txtNewEduMajor?.value || '',
        graduationDate: this.txtNewEduGrad?.value || null,
        description: this.txtNewEduDesc?.value || ''
      });
      if (this.txtNewEduInst) this.txtNewEduInst.setValue('');
      if (this.txtNewEduMajor) this.txtNewEduMajor.setValue('');
      if (this.txtNewEduGrad) this.txtNewEduGrad.setValue('');
      if (this.txtNewEduDesc) this.txtNewEduDesc.setValue('');
      this.showInfo('Pendidikan Ditambahkan', 'Riwayat pendidikan berhasil ditambahkan.', 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo('Gagal Tambah Pendidikan', err.message, 'error');
    }
  }

  async onAddCareerClick() {
    if (!this.selectedEmployeeId) return this.showInfo('Peringatan', 'Data karyawan belum dimuat.', 'warning');
    if (!this.txtNewCareerDate?.value) return this.showInfo('Validasi', 'Tanggal efektif perubahan wajib diisi.', 'warning');
    try {
      await api.addCareerHistory(this.selectedEmployeeId, {
        changeType: this.cmbNewCareerType?.value || 'Promosi',
        effectiveDate: this.txtNewCareerDate.value,
        newJobTitle: this.txtNewCareerTitle?.value || undefined,
        newDepartment: this.txtNewCareerDept?.value || undefined,
        referenceNumber: this.txtNewCareerRef?.value || '',
        notes: this.txtNewCareerNotes?.value || '',
        applyToEmployee: true
      });
      if (this.txtNewCareerDate) this.txtNewCareerDate.setValue('');
      if (this.txtNewCareerTitle) this.txtNewCareerTitle.setValue('');
      if (this.txtNewCareerDept) this.txtNewCareerDept.setValue('');
      if (this.txtNewCareerRef) this.txtNewCareerRef.setValue('');
      if (this.txtNewCareerNotes) this.txtNewCareerNotes.setValue('');
      this.showInfo('Riwayat Karir Dicatat', 'Riwayat karir berhasil ditambahkan.', 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo('Gagal Catat Karir', err.message, 'error');
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinEmployeeDetail;
