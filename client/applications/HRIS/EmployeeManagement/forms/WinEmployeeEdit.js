import {
  WiseWindow,
  WiseButton,
  WiseTextBox,
  WiseNumericBox,
  WiseComboBox,
  WiseDate,
  WiseTabControl,
  WiseDataTable,
  WiseTableLayout,
  WiseFrame,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

import WinEmployeeDocumentEdit from './WinEmployeeDocumentEdit';
import WinEmployeeExperienceEdit from './WinEmployeeExperienceEdit';
import WinEmployeeEducationEdit from './WinEmployeeEducationEdit';
import WinEmployeeCareerEdit from './WinEmployeeCareerEdit';
import WinEmployeeFamilyEdit from './WinEmployeeFamilyEdit';

import HrisApiRepository from '../services/HrisApiRepository';
const api = new HrisApiRepository();

const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];
const EMPLOYMENT_STATUSES = [
  'Tetap (PKWTT)',
  'Kontrak (PKWT)',
  'Probation / Masa Percobaan',
  'Magang (Internship)',
  'Freelance / Mitra',
  'Konsultan'
];
const TAX_STATUSES = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'];
const BANKS = ['BCA', 'Bank Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'Bank Danamon', 'Bank Permata', 'Lainnya'];

class WinEmployeeEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('EDIT_KARYAWAN_WISE_HRIS');
    this.appIcon = options.appIcon || '✏️';
    this.width = options.width || '88%';
    this.height = options.height || '88%';
    this.centered = true;

    this.selectedEmployeeId = options.employeeId || null;
    this.currentEmployeeData = null;
  }

  onWindowInit() {
    this.controls = [];

    // ── Toolbar: Save & Close side by side ─────────────────────────
    const editToolbar = new WiseFrame('', {
      id: 'frameEditToolbar',
      layout: 'horizontal',
      style: { background: 'transparent', border: 'none', padding: '0', marginBottom: '10px' }
    });
    editToolbar.addControl(new WiseButton(WiseI18n.t('SIMPAN_PERUBAHAN'), {
      id: 'btnEditSave',
      onClick: this.onSaveEmployee.bind(this)
    }));
    editToolbar.addControl(new WiseButton(WiseI18n.t('TUTUP_2'), {
      id: 'btnEditClose',
      onClick: this.onCloseClick.bind(this),
      style: {
        background: '#f1f5f9',
        color: '#334155'
      }
    }));
    this.addControl(editToolbar);

    // ── Tab Control ─────────────────────────────────────────────
    const editTabs = new WiseTabControl({
      id: 'editTabs',
      layout: 'horizontal',
      activeIndex: 0,
      onTabChanged: () => { }
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

    this.txtFullName = new WiseTextBox('', { id: 'txtFullName', datafield: 'fullName', placeholder: 'e.g. Raden Ayu Annisa Putri, S.T.' });
    this.txtNickname = new WiseTextBox('', { id: 'txtNickname', datafield: 'nickname', placeholder: 'e.g. Annisa' });
    this.txtBirthPlace = new WiseTextBox('', { id: 'txtBirthPlace', datafield: 'birthPlace', placeholder: 'e.g. Yogyakarta' });
    this.dtBirthDate = new WiseDate('', { id: 'dtBirthDate', datafield: 'birthDate' });
    this.cmbGender = new WiseComboBox([{ value: 'Laki-laki', label: WiseI18n.t('LAKI_LAKI') }, { value: 'Perempuan', label: WiseI18n.t('PEREMPUAN') }], { id: 'cmbGender', datafield: 'gender', value: 'Laki-laki', style: { width: '100%' } });
    this.cmbReligion = new WiseComboBox(RELIGIONS.map(r => ({ value: r, label: r })), { id: 'cmbReligion', datafield: 'religion', value: 'Islam', style: { width: '100%' } });
    this.txtPhoneNumber = new WiseTextBox('', { id: 'txtPhoneNumber', datafield: 'phoneNumber', placeholder: '081234567890' });
    this.txtPersonalEmail = new WiseTextBox('', { id: 'txtPersonalEmail', datafield: 'personalEmail', placeholder: 'karyawan@example.com' });
    this.txtCurrentAddress = new WiseTextBox('', { id: 'txtCurrentAddress', datafield: 'currentAddress', placeholder: WiseI18n.t('ALAMAT_DOMISILI_SAAT_INI') });
    this.txtIdCardAddress = new WiseTextBox('', { id: 'txtIdCardAddress', datafield: 'idCardAddress', placeholder: WiseI18n.t('ALAMAT_LENGKAP_SESUAI_KTP') });

    tblPersonal.setCell(0, 0, this.formGroup(WiseI18n.t('NAMA_LENGKAP'), this.txtFullName));
    tblPersonal.setCell(0, 1, this.formGroup(WiseI18n.t('NAMA_PANGGILAN'), this.txtNickname));
    tblPersonal.setCell(1, 0, this.formGroup(WiseI18n.t('TEMPAT_LAHIR'), this.txtBirthPlace));
    tblPersonal.setCell(1, 1, this.formGroup(WiseI18n.t('TANGGAL_LAHIR'), this.dtBirthDate));
    tblPersonal.setCell(2, 0, this.formGroup(WiseI18n.t('JENIS_KELAMIN'), this.cmbGender));
    tblPersonal.setCell(2, 1, this.formGroup(WiseI18n.t('AGAMA'), this.cmbReligion));
    tblPersonal.setCell(3, 0, this.formGroup(WiseI18n.t('NOMOR_TELEPON_WHATSAPP'), this.txtPhoneNumber));
    tblPersonal.setCell(3, 1, this.formGroup(WiseI18n.t('EMAIL_PRIBADI'), this.txtPersonalEmail));
    tblPersonal.setCell(4, 0, this.formGroup(WiseI18n.t('ALAMAT_TEMPAT_TINGGAL_SAAT_INI'), this.txtCurrentAddress));
    tblPersonal.setCell(4, 1, this.formGroup(WiseI18n.t('ALAMAT_SESUAI_KTP'), this.txtIdCardAddress));
    tabPersControls.push(tblPersonal);

    const frameEmergency = new WiseFrame(WiseI18n.t('KONTAK_DARURAT_EMERGENCY_CONTACT'), {
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
    this.txtEmergencyName = new WiseTextBox('', { id: 'txtEmergencyName', datafield: 'emergencyContactName', placeholder: WiseI18n.t('NAMA_KONTAK_DARURAT') });
    this.cmbEmergencyRelation = new WiseComboBox(['Orang Tua', 'Suami/Istri', 'Saudara Kandung', 'Anak', 'Teman'].map(h => ({ value: h, label: WiseI18n.t(h) })), { id: 'cmbEmergencyRelation', datafield: 'emergencyContactRelation', value: 'Orang Tua', style: { width: '100%' } });
    this.txtEmergencyPhone = new WiseTextBox('', { id: 'txtEmergencyPhone', datafield: 'emergencyContactPhone', placeholder: '0812xxxxxxxx' });

    tblEmergency.setCell(0, 0, this.formGroup(WiseI18n.t('NAMA_KONTAK_DARURAT'), this.txtEmergencyName));
    tblEmergency.setCell(0, 1, this.formGroup(WiseI18n.t('HUBUNGAN'), this.cmbEmergencyRelation));
    tblEmergency.setCell(0, 2, this.formGroup(WiseI18n.t('NOMOR_TELEPON_DARURAT'), this.txtEmergencyPhone));
    frameEmergency.addControl(tblEmergency);
    tabPersControls.push(frameEmergency);

    editTabs.addTab({ label: WiseI18n.t('DATA_PRIBADI'), icon: '👤', controls: tabPersControls });

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
    const orgComboStyle = { width: '100%' };

    this.txtNik = new WiseTextBox('', { id: 'txtNik', datafield: 'nik', placeholder: 'EMP-2024-001' });
    this.cmbDepartment = new WiseComboBox([], {
      id: 'cmbDepartment', datafield: 'department', value: '', style: orgComboStyle,
      onChange: this.onDepartmentChanged.bind(this)
    });
    this.cmbDivision = new WiseComboBox([], {
      id: 'cmbDivision', datafield: 'division', value: '', style: orgComboStyle,
      onChange: this.onDivisionChanged.bind(this)
    });
    this.cmbJobTitle = new WiseComboBox([], {
      id: 'cmbJobTitle', datafield: 'jobTitle', value: '', style: orgComboStyle,
      onChange: this.onJobTitleChanged.bind(this)
    });
    this.cmbJobLevel = new WiseComboBox([], {
      id: 'cmbJobLevel', datafield: 'jobLevel', value: '', style: orgComboStyle
    });
    this.cmbEmploymentStatus = new WiseComboBox(EMPLOYMENT_STATUSES.map(s => ({ value: s, label: s })), { id: 'cmbEmploymentStatus', datafield: 'employmentStatus', value: 'Tetap (PKWTT)', style: orgComboStyle });
    this.dtJoinDate = new WiseDate('', { id: 'dtJoinDate', datafield: 'joinDate' });
    this.dtEndDate = new WiseDate('', { id: 'dtEndDate', datafield: 'endDate' });
    this.txtManagerName = new WiseTextBox('', { id: 'txtManagerName', datafield: 'managerName', placeholder: WiseI18n.t('NAMA_ATASAN_LANGSUNG') });
    this.cmbWorkLocation = new WiseComboBox([
      { value: 'Kantor Pusat', label: WiseI18n.t('KANTOR_PUSAT') },
      { value: 'Kantor Cabang', label: WiseI18n.t('KANTOR_CABANG') },
      { value: 'Remote', label: WiseI18n.t('REMOTE') },
      { value: 'Hybrid', label: WiseI18n.t('HYBRID') }
    ], { id: 'cmbWorkLocation', datafield: 'workLocation', value: 'Kantor Pusat', style: orgComboStyle });

    tblEmployment.setCell(0, 0, this.formGroup(WiseI18n.t('NIK_ID_KARYAWAN'), this.txtNik));
    tblEmployment.setCell(0, 1, this.formGroup(WiseI18n.t('DEPARTEMEN'), this.cmbDepartment));
    tblEmployment.setCell(1, 0, this.formGroup(WiseI18n.t('DIVISI_SUB_DEPARTEMEN'), this.cmbDivision));
    tblEmployment.setCell(1, 1, this.formGroup(WiseI18n.t('JABATAN_POSISI'), this.cmbJobTitle));
    tblEmployment.setCell(2, 0, this.formGroup(WiseI18n.t('TINGKAT_JABATAN'), this.cmbJobLevel));
    tblEmployment.setCell(2, 1, this.formGroup(WiseI18n.t('STATUS_KEPEGAWAIAN'), this.cmbEmploymentStatus));
    tblEmployment.setCell(3, 0, this.formGroup(WiseI18n.t('TANGGAL_BERGABUNG'), this.dtJoinDate));
    tblEmployment.setCell(3, 1, this.formGroup(WiseI18n.t('TANGGAL_BERAKHIR_KONTRAK_MAGANG'), this.dtEndDate));
    tblEmployment.setCell(4, 0, this.formGroup(WiseI18n.t('ATASAN_LANGSUNG'), this.txtManagerName));
    tblEmployment.setCell(4, 1, this.formGroup(WiseI18n.t('LOKASI_KERJA'), this.cmbWorkLocation));
    tabEmplControls.push(tblEmployment);
    editTabs.addTab({ label: WiseI18n.t('DATA_PEKERJAAN'), icon: '💼', controls: tabEmplControls });

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

    const currPrefix = typeof WiseI18n !== 'undefined' && WiseI18n ? WiseI18n.getCurrencyPrefix() : 'Rp ';
    this.cmbBankName = new WiseComboBox(BANKS.map(b => ({ value: b, label: b })), { id: 'cmbBankName', datafield: 'bankName', value: 'BCA', style: { width: '100%' } });
    this.txtBankAccountNumber = new WiseTextBox('', { id: 'txtBankAccountNumber', datafield: 'bankAccountNumber', placeholder: WiseI18n.t('NOMOR_REKENING_UNTUK_TRANSFER_GAJI') });
    this.txtBankAccountHolder = new WiseTextBox('', { id: 'txtBankAccountHolder', datafield: 'bankAccountHolder', placeholder: WiseI18n.t('HARUS_SESUAI_BUKU_TABUNGAN') });
    this.numBasicSalary = new WiseNumericBox('0', { id: 'numBasicSalary', datafield: 'basicSalary', value: 0, prefix: currPrefix });
    this.numAllowancePosition = new WiseNumericBox('0', { id: 'numAllowancePosition', datafield: 'allowancePosition', value: 0, prefix: currPrefix });
    this.numAllowanceTransport = new WiseNumericBox('0', { id: 'numAllowanceTransport', datafield: 'allowanceTransport', value: 0, prefix: currPrefix });
    this.numAllowanceMeal = new WiseNumericBox('0', { id: 'numAllowanceMeal', datafield: 'allowanceMeal', value: 0, prefix: currPrefix });
    this.numAllowanceOther = new WiseNumericBox('0', { id: 'numAllowanceOther', datafield: 'allowanceOther', value: 0, prefix: currPrefix });
    this.cmbTaxStatus = new WiseComboBox(TAX_STATUSES.map(t => ({ value: t, label: t })), { id: 'cmbTaxStatus', datafield: 'taxStatus', value: 'TK/0' });
    this.txtNpwp = new WiseTextBox('', { id: 'txtNpwp', datafield: 'npwp', placeholder: '00.000.000.0-000.000' });
    this.txtBpjsKesehatan = new WiseTextBox('', { id: 'txtBpjsKesehatan', datafield: 'bpjsKesehatan', placeholder: WiseI18n.t('13_DIGIT_NOMOR_BPJS_KESEHATAN') });
    this.txtBpjsKetenagakerjaan = new WiseTextBox('', { id: 'txtBpjsKetenagakerjaan', datafield: 'bpjsKetenagakerjaan', placeholder: WiseI18n.t('NOMOR_KARTU_BPJS_TK') });

    tblPayroll.setCell(0, 0, this.formGroup(WiseI18n.t('NAMA_BANK'), this.cmbBankName));
    tblPayroll.setCell(0, 1, this.formGroup(WiseI18n.t('NOMOR_REKENING_BANK'), this.txtBankAccountNumber));
    tblPayroll.setCell(1, 0, this.formGroup(WiseI18n.t('NAMA_PEMILIK_REKENING'), this.txtBankAccountHolder));
    tblPayroll.setCell(1, 1, this.formGroup(WiseI18n.t('GAJI_POKOK'), this.numBasicSalary));
    tblPayroll.setCell(2, 0, this.formGroup(WiseI18n.t('TUNJANGAN_JABATAN'), this.numAllowancePosition));
    tblPayroll.setCell(2, 1, this.formGroup(WiseI18n.t('TUNJANGAN_TRANSPORT'), this.numAllowanceTransport));
    tblPayroll.setCell(3, 0, this.formGroup(WiseI18n.t('TUNJANGAN_MAKAN'), this.numAllowanceMeal));
    tblPayroll.setCell(3, 1, this.formGroup(WiseI18n.t('TUNJANGAN_LAINNYA'), this.numAllowanceOther));
    tblPayroll.setCell(4, 0, this.formGroup(WiseI18n.t('STATUS_PERPAJAKAN_PTKP'), this.cmbTaxStatus));
    tblPayroll.setCell(4, 1, this.formGroup(WiseI18n.t('NOMOR_NPWP'), this.txtNpwp));
    tblPayroll.setCell(5, 0, this.formGroup(WiseI18n.t('NOMOR_BPJS_KESEHATAN'), this.txtBpjsKesehatan));
    tblPayroll.setCell(5, 1, this.formGroup(WiseI18n.t('NOMOR_BPJS_KETENAGAKERJAAN'), this.txtBpjsKetenagakerjaan));
    tabPayControls.push(tblPayroll);
    editTabs.addTab({ label: WiseI18n.t('KOMPENSASI_PAYROLL'), icon: '💰', controls: tabPayControls });

    // ── TAB 4: DOKUMEN & LEGALITAS ──────────────────────────────
    const tabDocControls = [];
    const docToolbar = new WiseFrame('', {
      id: 'frameDocToolbar',
      layout: 'horizontal',
      style: { background: 'transparent', border: 'none', padding: '0', marginBottom: '10px' }
    });
    docToolbar.addControl(new WiseButton(WiseI18n.t('TAMBAH_DOKUMEN'), {
      id: 'btnOpenAddDoc',
      onClick: this.onOpenAddDocClick.bind(this)
    }));
    docToolbar.addControl(new WiseButton(WiseI18n.t('EDIT_DOKUMEN'), {
      id: 'btnOpenEditDoc',
      onClick: this.onOpenEditDocClick.bind(this),
      style: { background: '#f1f5f9', color: '#334155' }
    }));
    docToolbar.addControl(new WiseButton(WiseI18n.t('HAPUS_DOKUMEN'), {
      id: 'btnDeleteDoc',
      onClick: this.onDeleteDocClick.bind(this),
      style: { background: '#fee2e2', color: '#dc2626' }
    }));
    tabDocControls.push(docToolbar);

    const dtDocuments = new WiseDataTable({ id: 'dtDocuments', pageSize: 6 });
    dtDocuments.setColumns([
      { dataField: 'documentType', header: WiseI18n.t('JENIS_DOKUMEN'), width: 140 },
      { dataField: 'title', header: WiseI18n.t('NAMA_JUDUL_DOKUMEN'), width: 220 },
      { dataField: 'documentNumber', header: WiseI18n.t('NOMOR_DOKUMEN'), width: 160 },
      { dataField: 'issueDate', header: WiseI18n.t('TGL_TERBIT'), width: 110 },
      { dataField: 'expiryDate', header: WiseI18n.t('TGL_BERAKHIR'), width: 110 },
      { dataField: 'description', header: WiseI18n.t('KETERANGAN'), width: 200 }
    ]);
    dtDocuments.addContextMenu([
      { id: 'edit', label: WiseI18n.t('EDIT_DOKUMEN_MENU'), onClick: (row) => this.onOpenEditDocClick(row) },
      { id: 'delete', label: WiseI18n.t('HAPUS_DOKUMEN_MENU'), onClick: (row) => this.onDeleteDocClick(row) }
    ]);
    tabDocControls.push(dtDocuments);
    editTabs.addTab({ label: WiseI18n.t('DOKUMEN_LEGALITAS'), icon: '📁', controls: tabDocControls });

    // ── TAB 5: PENGALAMAN KERJA ──────────────────────────────────
    const tabExpControls = [];
    const expToolbar = new WiseFrame('', {
      id: 'frameExpToolbar',
      layout: 'horizontal',
      style: { background: 'transparent', border: 'none', padding: '0', marginBottom: '10px' }
    });
    expToolbar.addControl(new WiseButton(WiseI18n.t('TAMBAH_PENGALAMAN'), {
      id: 'btnOpenAddExp',
      onClick: this.onOpenAddExpClick.bind(this)
    }));
    expToolbar.addControl(new WiseButton(WiseI18n.t('EDIT_PENGALAMAN'), {
      id: 'btnOpenEditExp',
      onClick: this.onOpenEditExpClick.bind(this),
      style: { background: '#f1f5f9', color: '#334155' }
    }));
    expToolbar.addControl(new WiseButton(WiseI18n.t('HAPUS_PENGALAMAN'), {
      id: 'btnDeleteExp',
      onClick: this.onDeleteExpClick.bind(this),
      style: { background: '#fee2e2', color: '#dc2626' }
    }));
    tabExpControls.push(expToolbar);

    const dtExperiences = new WiseDataTable({ id: 'dtExperiences', pageSize: 6 });
    dtExperiences.setColumns([
      { dataField: 'companyName', header: WiseI18n.t('PERUSAHAAN'), width: 200 },
      { dataField: 'position', header: WiseI18n.t('POSISI'), width: 180 },
      { dataField: 'startDate', header: WiseI18n.t('TGL_MULAI'), width: 110 },
      { dataField: 'endDate', header: WiseI18n.t('TGL_SELESAI'), width: 110 },
      { dataField: 'lastSalary', header: WiseI18n.t('GAJI_TERAKHIR'), width: 130 },
      { dataField: 'description', header: WiseI18n.t('KETERANGAN'), width: 220 }
    ]);
    dtExperiences.addContextMenu([
      { id: 'edit', label: WiseI18n.t('EDIT_PENGALAMAN_MENU'), onClick: (row) => this.onOpenEditExpClick(row) },
      { id: 'delete', label: WiseI18n.t('HAPUS_PENGALAMAN_MENU'), onClick: (row) => this.onDeleteExpClick(row) }
    ]);
    tabExpControls.push(dtExperiences);
    editTabs.addTab({ label: WiseI18n.t('PENGALAMAN_KERJA'), icon: '🏢', controls: tabExpControls });

    // ── TAB 6: RIWAYAT PENDIDIKAN ───────────────────────────────
    const tabEduControls = [];
    const eduToolbar = new WiseFrame('', {
      id: 'frameEduToolbar',
      layout: 'horizontal',
      style: { background: 'transparent', border: 'none', padding: '0', marginBottom: '10px' }
    });
    eduToolbar.addControl(new WiseButton(WiseI18n.t('TAMBAH_PENDIDIKAN'), {
      id: 'btnOpenAddEdu',
      onClick: this.onOpenAddEduClick.bind(this)
    }));
    eduToolbar.addControl(new WiseButton(WiseI18n.t('EDIT_PENDIDIKAN'), {
      id: 'btnOpenEditEdu',
      onClick: this.onOpenEditEduClick.bind(this),
      style: { background: '#f1f5f9', color: '#334155' }
    }));
    eduToolbar.addControl(new WiseButton(WiseI18n.t('HAPUS_PENDIDIKAN'), {
      id: 'btnDeleteEdu',
      onClick: this.onDeleteEduClick.bind(this),
      style: { background: '#fee2e2', color: '#dc2626' }
    }));
    tabEduControls.push(eduToolbar);

    const dtEducation = new WiseDataTable({ id: 'dtEducation', pageSize: 6 });
    dtEducation.setColumns([
      { dataField: 'institutionName', header: WiseI18n.t('INSTITUSI_PENDIDIKAN'), width: 220 },
      { dataField: 'degree', header: WiseI18n.t('JENJANG'), width: 100 },
      { dataField: 'major', header: WiseI18n.t('JURUSAN'), width: 180 },
      { dataField: 'startDate', header: WiseI18n.t('TGL_MULAI'), width: 110 },
      { dataField: 'graduationDate', header: WiseI18n.t('TGL_LULUS'), width: 110 },
      { dataField: 'gpa', header: WiseI18n.t('IPK'), width: 90 },
      { dataField: 'description', header: WiseI18n.t('KETERANGAN'), width: 200 }
    ]);
    dtEducation.addContextMenu([
      { id: 'edit', label: WiseI18n.t('EDIT_PENDIDIKAN_MENU'), onClick: (row) => this.onOpenEditEduClick(row) },
      { id: 'delete', label: WiseI18n.t('HAPUS_PENDIDIKAN_MENU'), onClick: (row) => this.onDeleteEduClick(row) }
    ]);
    tabEduControls.push(dtEducation);
    editTabs.addTab({ label: WiseI18n.t('RIWAYAT_PENDIDIKAN'), icon: '🎓', controls: tabEduControls });

    // ── TAB 7: RIWAYAT KARIR INTERNAL ───────────────────────────
    const tabCareerControls = [];
    const careerToolbar = new WiseFrame('', {
      id: 'frameCareerToolbar',
      layout: 'horizontal',
      style: { background: 'transparent', border: 'none', padding: '0', marginBottom: '10px' }
    });
    careerToolbar.addControl(new WiseButton(WiseI18n.t('CATAT_RIWAYAT_KARIR'), {
      id: 'btnOpenAddCareer',
      onClick: this.onOpenAddCareerClick.bind(this)
    }));
    careerToolbar.addControl(new WiseButton(WiseI18n.t('EDIT_RIWAYAT_KARIR'), {
      id: 'btnOpenEditCareer',
      onClick: this.onOpenEditCareerClick.bind(this),
      style: { background: '#f1f5f9', color: '#334155' }
    }));
    careerToolbar.addControl(new WiseButton(WiseI18n.t('HAPUS_RIWAYAT_KARIR'), {
      id: 'btnDeleteCareer',
      onClick: this.onDeleteCareerClick.bind(this),
      style: { background: '#fee2e2', color: '#dc2626' }
    }));
    tabCareerControls.push(careerToolbar);

    const dtCareer = new WiseDataTable({ id: 'dtCareer', pageSize: 6 });
    dtCareer.setColumns([
      { dataField: 'changeType', header: WiseI18n.t('JENIS_PERUBAHAN'), width: 140 },
      { dataField: 'effectiveDate', header: WiseI18n.t('TGL_EFEKTIF'), width: 110 },
      { dataField: 'newJobTitle', header: WiseI18n.t('JABATAN_BARU'), width: 160 },
      { dataField: 'newDepartment', header: WiseI18n.t('DEPARTEMEN_BARU'), width: 140 },
      { dataField: 'newSalary', header: WiseI18n.t('GAJI_BARU'), width: 130 },
      { dataField: 'referenceNumber', header: WiseI18n.t('NOMOR_SK'), width: 140 },
      { dataField: 'notes', header: WiseI18n.t('CATATAN'), width: 220 }
    ]);
    dtCareer.addContextMenu([
      { id: 'edit', label: WiseI18n.t('EDIT_RIWAYAT_KARIR_MENU'), onClick: (row) => this.onOpenEditCareerClick(row) },
      { id: 'delete', label: WiseI18n.t('HAPUS_RIWAYAT_KARIR_MENU'), onClick: (row) => this.onDeleteCareerClick(row) }
    ]);
    tabCareerControls.push(dtCareer);
    editTabs.addTab({ label: WiseI18n.t('RIWAYAT_KARIR'), icon: '📈', controls: tabCareerControls });

    // ── TAB 8: DATA KELUARGA ────────────────────────────────────
    const tabFamilyControls = [];
    const familyToolbar = new WiseFrame('', {
      id: 'frameFamilyToolbar',
      layout: 'horizontal',
      style: { background: 'transparent', border: 'none', padding: '0', marginBottom: '10px' }
    });
    familyToolbar.addControl(new WiseButton(WiseI18n.t('TAMBAH_ANGGOTA_KELUARGA'), {
      id: 'btnOpenAddFamily',
      onClick: this.onOpenAddFamilyClick.bind(this)
    }));
    familyToolbar.addControl(new WiseButton(WiseI18n.t('EDIT_ANGGOTA_KELUARGA'), {
      id: 'btnOpenEditFamily',
      onClick: this.onOpenEditFamilyClick.bind(this),
      style: { background: '#f1f5f9', color: '#334155' }
    }));
    familyToolbar.addControl(new WiseButton(WiseI18n.t('HAPUS_ANGGOTA_KELUARGA'), {
      id: 'btnDeleteFamily',
      onClick: this.onDeleteFamilyClick.bind(this),
      style: { background: '#fee2e2', color: '#dc2626' }
    }));
    tabFamilyControls.push(familyToolbar);

    const dtFamily = new WiseDataTable({ id: 'dtFamily', pageSize: 6 });
    dtFamily.setColumns([
      { dataField: 'name', header: WiseI18n.t('NAMA_ANGGOTA_KELUARGA'), width: 240 },
      { dataField: 'gender', header: WiseI18n.t('GENDER'), width: 140 },
      { dataField: 'relationship', header: WiseI18n.t('HUBUNGAN'), width: 180 },
      { dataField: 'phone', header: WiseI18n.t('NOMOR_KONTAK'), width: 200 }
    ]);
    dtFamily.addContextMenu([
      { id: 'edit', label: WiseI18n.t('EDIT_ANGGOTA_KELUARGA_MENU'), onClick: (row) => this.onOpenEditFamilyClick(row) },
      { id: 'delete', label: WiseI18n.t('HAPUS_ANGGOTA_KELUARGA_MENU'), onClick: (row) => this.onDeleteFamilyClick(row) }
    ]);
    tabFamilyControls.push(dtFamily);
    editTabs.addTab({ label: WiseI18n.t('DATA_KELUARGA'), icon: '👨‍👩‍👧‍👦', controls: tabFamilyControls });

    this.addControl(editTabs);
    return this;
  }

  formGroup(label, control) {
    const frame = new WiseFrame('', { style: { padding: '4px 6px', border: 'none', background: 'transparent', width: '100%', boxSizing: 'border-box' } });
    const labelText = typeof WiseI18n !== 'undefined' ? WiseI18n.t(label) : label;
    if (control && typeof control.setLabel === 'function') control.setLabel(labelText);
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
      const [orgRes, levelRes, posRes, statusRes] = await Promise.all([
        api.listOrganizations({ isActive: 'true', sortBy: 'sortOrder', sortOrder: 'ASC' }),
        api.listJobLevels({ isActive: 'true', sortBy: 'levelNumber', sortOrder: 'ASC' }),
        api.listPositions({ isActive: 'true', sortBy: 'title', sortOrder: 'ASC' }),
        api.listMasterData({ dataType: 'EMPLOYMENT_STATUS', isActive: 'true', sortBy: 'sortOrder', sortOrder: 'ASC' })
      ]);
      this.orgs = orgRes.rows || [];
      this.jobLevels = levelRes.rows || [];
      this.positions = posRes.rows || [];
      const masterStatuses = (statusRes.rows || []).map(r => r.name);
      const statuses = masterStatuses.length > 0 ? masterStatuses : EMPLOYMENT_STATUSES;
      if (this.cmbEmploymentStatus) {
        const curVal = this.cmbEmploymentStatus.value;
        const allStatuses = [...new Set([...statuses, ...(curVal ? [curVal] : [])])];
        this.cmbEmploymentStatus.setItems(allStatuses.map(s => ({ value: s, label: s })));
      }
    } catch (err) {
      this.orgs = [];
      this.jobLevels = [];
      this.positions = [];
      this.showInfo(WiseI18n.t('GAGAL_MEMUAT_MASTER_DATA'), err.message, 'error');
    }
  }

  // Builds combobox items from a list of names, prepending a blank option and
  // keeping the current value selectable even if it is no longer in master
  // data (legacy employee records) so saving never silently drops it.
  buildNameItems(names, current, blankLabel) {
    const unique = [...new Set(names.filter(Boolean))];
    if (current && !unique.includes(current)) unique.push(current);
    return [{ value: '', label: WiseI18n.t(blankLabel) }, ...unique.map((n) => ({ value: n, label: n }))];
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
      this.title = `${WiseI18n.t('EDIT_KARYAWAN')} — ${emp.fullName || emp.nik}`;
      this.populateForm(emp);
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MEMUAT_DATA'), err.message, 'error');
    }
  }

  populateForm(emp) {
    if (!emp) return;

    // 1. Populate all input controls based on datafield
    this.populate(emp);

    // 2. Cascaded department, division, jobTitle, jobLevel selection
    this.applyOrgSelection({
      department: emp.department || '',
      division: emp.division || '',
      jobTitle: emp.jobTitle || '',
      jobLevel: emp.jobLevel || ''
    }, true);

    if (this.cmbEmploymentStatus) {
      const val = emp.employmentStatus || 'Tetap (PKWTT)';
      const existingItems = this.cmbEmploymentStatus.items || [];
      if (!existingItems.some(item => item.value === val)) {
        this.cmbEmploymentStatus.setItems([...existingItems, { value: val, label: val }]);
      }
      this.cmbEmploymentStatus.setValue(val);
    }

    if (this.txtManagerName && !emp.managerName && emp.manager && emp.manager.fullName) {
      this.txtManagerName.setValue(emp.manager.fullName);
    }

    // 3. Sub-records data tables
    if (this.dtDocuments) this.dtDocuments.setData(emp.documents || [], (emp.documents || []).length);
    if (this.dtExperiences) this.dtExperiences.setData(emp.workExperiences || [], (emp.workExperiences || []).length);
    if (this.dtEducation) this.dtEducation.setData(emp.educationHistories || [], (emp.educationHistories || []).length);
    if (this.dtCareer) this.dtCareer.setData(emp.careerHistories || [], (emp.careerHistories || []).length);
    if (this.dtFamily) this.dtFamily.setData(emp.familyMembers || [], (emp.familyMembers || []).length);
  }

  async onSaveEmployee() {
    try {
      const values = this.getValues();
      const payload = {
        fullName: values.fullName || '',
        nickname: values.nickname || '',
        birthPlace: values.birthPlace || '',
        birthDate: values.birthDate || null,
        gender: values.gender || 'Laki-laki',
        religion: values.religion || 'Islam',
        phoneNumber: values.phoneNumber || '',
        personalEmail: values.personalEmail || '',
        currentAddress: values.currentAddress || '',
        idCardAddress: values.idCardAddress || '',
        emergencyContactName: values.emergencyContactName || '',
        emergencyContactRelation: values.emergencyContactRelation || '',
        emergencyContactPhone: values.emergencyContactPhone || '',

        nik: values.nik || '',
        jobTitle: values.jobTitle || '',
        jobLevel: values.jobLevel || '',
        department: values.department || '',
        division: values.division || '',
        employmentStatus: values.employmentStatus || 'Tetap (PKWTT)',
        joinDate: values.joinDate || new Date().toISOString().slice(0, 10),
        endDate: values.endDate || null,
        managerName: values.managerName || '',
        workLocation: values.workLocation || 'Kantor Pusat',

        bankName: values.bankName || 'BCA',
        bankAccountNumber: values.bankAccountNumber || '',
        bankAccountHolder: values.bankAccountHolder || '',
        basicSalary: Number(values.basicSalary) || 0,
        allowancePosition: Number(values.allowancePosition) || 0,
        allowanceTransport: Number(values.allowanceTransport) || 0,
        allowanceMeal: Number(values.allowanceMeal) || 0,
        allowanceOther: Number(values.allowanceOther) || 0,
        taxStatus: values.taxStatus || 'TK/0',
        npwp: values.npwp || '',
        bpjsKesehatan: values.bpjsKesehatan || '',
        bpjsKetenagakerjaan: values.bpjsKetenagakerjaan || '',
      };

      if (!payload.fullName) return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('NAMA_LENGKAP_KARYAWAN_WAJIB_DIISI'), 'warning');
      if (!payload.nik) return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('NIK_KARYAWAN_WAJIB_DIISI'), 'warning');

      if (this.selectedEmployeeId) {
        const updated = await api.updateEmployee(this.selectedEmployeeId, payload);
        this.showInfo(WiseI18n.t('BERHASIL'), `${WiseI18n.t('DATA_KARYAWAN')} ${updated.fullName} ${WiseI18n.t('BERHASIL_DIPERBARUI')}.`, 'success');
        await this.loadEmployee(this.selectedEmployeeId);
      } else {
        const created = await api.createEmployee(payload);
        this.selectedEmployeeId = created.id;
        this.showInfo(WiseI18n.t('BERHASIL'), `${WiseI18n.t('KARYAWAN_BARU')} ${created.fullName} (${created.nik}) ${WiseI18n.t('BERHASIL_DIDAFTARKAN')}.`, 'success');
        await this.loadEmployee(this.selectedEmployeeId);
      }
      if (this.parentWindow && typeof this.parentWindow.loadInitialData === 'function') {
        await this.parentWindow.loadInitialData();
      }
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENYIMPAN'), err.message, 'error');
    }
  }

  // ── Document Handlers ─────────────────────────────────────────
  async onOpenAddDocClick() {
    if (!this.selectedEmployeeId) return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('SIMPAN_DATA_KARYAWAN_TERLEBIH_DAHULU_DOKUMEN'), 'warning');
    await this.openWindow(WinEmployeeDocumentEdit, { employeeId: this.selectedEmployeeId, data: null });
  }

  async onOpenEditDocClick(row) {
    const targetRow = row || (this.dtDocuments ? this.dtDocuments.getSelectedRow() : null);
    if (!targetRow) return this.showInfo(WiseI18n.t('PILIH_DOKUMEN'), WiseI18n.t('PILIH_DOKUMEN_YANG_INGIN_DIEDIT'), 'warning');
    await this.openWindow(WinEmployeeDocumentEdit, { employeeId: this.selectedEmployeeId, data: targetRow });
  }

  async onDeleteDocClick(row) {
    const targetRow = row || (this.dtDocuments ? this.dtDocuments.getSelectedRow() : null);
    if (!targetRow) return this.showInfo(WiseI18n.t('PILIH_DOKUMEN'), WiseI18n.t('PILIH_DOKUMEN_YANG_INGIN_DIHAPUS'), 'warning');
    try {
      await api.deleteDocument(targetRow.id);
      this.showInfo(WiseI18n.t('BERHASIL'), `"${targetRow.title}" ${WiseI18n.t('BERHASIL_DIHAPUS')}.`, 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENGHAPUS'), err.message, 'error');
    }
  }

  // ── Experience Handlers ───────────────────────────────────────
  async onOpenAddExpClick() {
    if (!this.selectedEmployeeId) return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('SIMPAN_DATA_KARYAWAN_TERLEBIH_DAHULU_PENGALAMAN'), 'warning');
    await this.openWindow(WinEmployeeExperienceEdit, { employeeId: this.selectedEmployeeId, data: null });
  }

  async onOpenEditExpClick(row) {
    const targetRow = row || (this.dtExperiences ? this.dtExperiences.getSelectedRow() : null);
    if (!targetRow) return this.showInfo(WiseI18n.t('PILIH_PENGALAMAN'), WiseI18n.t('PILIH_PENGALAMAN_KERJA_YANG_INGIN_DIEDIT'), 'warning');
    await this.openWindow(WinEmployeeExperienceEdit, { employeeId: this.selectedEmployeeId, data: targetRow });
  }

  async onDeleteExpClick(row) {
    const targetRow = row || (this.dtExperiences ? this.dtExperiences.getSelectedRow() : null);
    if (!targetRow) return this.showInfo(WiseI18n.t('PILIH_PENGALAMAN'), WiseI18n.t('PILIH_PENGALAMAN_KERJA_YANG_INGIN_DIHAPUS'), 'warning');
    try {
      await api.deleteWorkExperience(targetRow.id);
      this.showInfo(WiseI18n.t('BERHASIL'), `"${targetRow.companyName}" ${WiseI18n.t('BERHASIL_DIHAPUS')}.`, 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENGHAPUS'), err.message, 'error');
    }
  }

  // ── Education Handlers ────────────────────────────────────────
  async onOpenAddEduClick() {
    if (!this.selectedEmployeeId) return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('SIMPAN_DATA_KARYAWAN_TERLEBIH_DAHULU_PENDIDIKAN'), 'warning');
    await this.openWindow(WinEmployeeEducationEdit, { employeeId: this.selectedEmployeeId, data: null });
  }

  async onOpenEditEduClick(row) {
    const targetRow = row || (this.dtEducation ? this.dtEducation.getSelectedRow() : null);
    if (!targetRow) return this.showInfo(WiseI18n.t('PILIH_PENDIDIKAN'), WiseI18n.t('PILIH_RIWAYAT_PENDIDIKAN_YANG_INGIN_DIEDIT'), 'warning');
    await this.openWindow(WinEmployeeEducationEdit, { employeeId: this.selectedEmployeeId, data: targetRow });
  }

  async onDeleteEduClick(row) {
    const targetRow = row || (this.dtEducation ? this.dtEducation.getSelectedRow() : null);
    if (!targetRow) return this.showInfo(WiseI18n.t('PILIH_PENDIDIKAN'), WiseI18n.t('PILIH_RIWAYAT_PENDIDIKAN_YANG_INGIN_DIHAPUS'), 'warning');
    try {
      await api.deleteEducationHistory(targetRow.id);
      this.showInfo(WiseI18n.t('BERHASIL'), `"${targetRow.institutionName}" ${WiseI18n.t('BERHASIL_DIHAPUS')}.`, 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENGHAPUS'), err.message, 'error');
    }
  }

  // ── Career Handlers ───────────────────────────────────────────
  async onOpenAddCareerClick() {
    if (!this.selectedEmployeeId) return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('SIMPAN_DATA_KARYAWAN_TERLEBIH_DAHULU_MUTASI'), 'warning');
    await this.openWindow(WinEmployeeCareerEdit, { employeeId: this.selectedEmployeeId, data: null });
  }

  async onOpenEditCareerClick(row) {
    const targetRow = row || (this.dtCareer ? this.dtCareer.getSelectedRow() : null);
    if (!targetRow) return this.showInfo(WiseI18n.t('PILIH_RIWAYAT_KARIR'), WiseI18n.t('PILIH_RIWAYAT_KARIR_YANG_INGIN_DIEDIT'), 'warning');
    await this.openWindow(WinEmployeeCareerEdit, { employeeId: this.selectedEmployeeId, data: targetRow });
  }

  async onDeleteCareerClick(row) {
    const targetRow = row || (this.dtCareer ? this.dtCareer.getSelectedRow() : null);
    if (!targetRow) return this.showInfo(WiseI18n.t('PILIH_RIWAYAT_KARIR'), WiseI18n.t('PILIH_RIWAYAT_KARIR_YANG_INGIN_DIHAPUS'), 'warning');
    try {
      await api.deleteCareerHistory(targetRow.id);
      this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('RIWAYAT_KARIR_BERHASIL_DIHAPUS'), 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENGHAPUS'), err.message, 'error');
    }
  }

  // ── Family Handlers ───────────────────────────────────────────
  async onOpenAddFamilyClick() {
    if (!this.selectedEmployeeId) return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('SIMPAN_DATA_KARYAWAN_TERLEBIH_DAHULU_KELUARGA'), 'warning');
    await this.openWindow(WinEmployeeFamilyEdit, { employeeId: this.selectedEmployeeId, data: null });
  }

  async onOpenEditFamilyClick(row) {
    const targetRow = row || (this.dtFamily ? this.dtFamily.getSelectedRow() : null);
    if (!targetRow) return this.showInfo(WiseI18n.t('PILIH_ANGGOTA_KELUARGA'), WiseI18n.t('PILIH_ANGGOTA_KELUARGA_YANG_INGIN_DIEDIT'), 'warning');
    await this.openWindow(WinEmployeeFamilyEdit, { employeeId: this.selectedEmployeeId, data: targetRow });
  }

  async onDeleteFamilyClick(row) {
    const targetRow = row || (this.dtFamily ? this.dtFamily.getSelectedRow() : null);
    if (!targetRow) return this.showInfo(WiseI18n.t('PILIH_ANGGOTA_KELUARGA'), WiseI18n.t('PILIH_ANGGOTA_KELUARGA_YANG_INGIN_DIHAPUS'), 'warning');
    try {
      await api.deleteFamilyMember(targetRow.id);
      this.showInfo(WiseI18n.t('BERHASIL'), `"${targetRow.name}" ${WiseI18n.t('BERHASIL_DIHAPUS')}.`, 'success');
      await this.loadEmployee(this.selectedEmployeeId);
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENGHAPUS'), err.message, 'error');
    }
  }

  onCloseClick() {
    this.close();
  }
}

export default WinEmployeeEdit;
