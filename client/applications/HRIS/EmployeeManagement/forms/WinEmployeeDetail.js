const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTabControl = require('../../../../system/controls/WiseTabControl');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseFrame = require('../../../../system/controls/WiseFrame');

const HrisApiRepository = require('../services/HrisApiRepository');
const api = new HrisApiRepository();

class WinEmployeeDetail extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = 'Detail Karyawan — Wise HRIS';
    this.appIcon = options.appIcon || '📋';
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
      id: 'frameDetailHero',
      style: {
        background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '14px',
        boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.18)',
        color: '#ffffff'
      }
    });

    const tblHero = new WiseTableLayout({ rows: 1, columns: 2, id: 'tblDetailHeroLayout' });
    
    const heroLeft = new WiseFrame('', { style: { background: 'transparent', border: 'none', padding: '0' } });
    heroLeft.addControl(new WiseLabel('📋 Detail Informasi Karyawan', {
      id: 'lblDetailHeroTitle',
      style: { fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }
    }));
    heroLeft.addControl(new WiseLabel('Memuat data karyawan...', {
      id: 'lblDetailEmployeeName',
      style: { fontSize: 22, color: '#ffffff', display: 'block', fontWeight: 800, marginBottom: '4px' }
    }));
    heroLeft.addControl(new WiseLabel('', {
      id: 'lblDetailEmployeeInfo',
      style: { color: 'rgba(255,255,255,0.9)', display: 'block' }
    }));

    const heroRight = new WiseFrame('', { style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' } });
    heroRight.addControl(new WiseButton('✏️ Edit Data Karyawan', {
      id: 'btnDetailOpenEdit',
      onClick: this.onOpenEditClick.bind(this),
      style: {
        background: '#ffffff',
        color: 'var(--accent-dark)',
        fontWeight: 700,
        borderRadius: '8px',
        padding: '8px 16px',
        border: 'none',
        boxShadow: 'none',
        marginRight: '8px',
        cursor: 'pointer'
      }
    }));
    heroRight.addControl(new WiseButton('✕ Tutup', {
      id: 'btnDetailClose',
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
    const detailTabs = new WiseTabControl({
      id: 'detailTabs',
      layout: 'horizontal',
      activeIndex: 0,
      onTabChanged: () => {}
    });

    // ── TAB 1: DATA PRIBADI ─────────────────────────────────────
    const tabPersControls = [];
    const tblPersonal = new WiseTableLayout({ rows: 5, columns: 2, id: 'tblDetailPersonal', style: { marginBottom: '8px' } });
    tblPersonal.setCell(0, 0, this.infoField('Nama Lengkap', 'lblValFullName'));
    tblPersonal.setCell(0, 1, this.infoField('Nama Panggilan', 'lblValNickname'));
    tblPersonal.setCell(1, 0, this.infoField('Tempat Lahir', 'lblValBirthPlace'));
    tblPersonal.setCell(1, 1, this.infoField('Tanggal Lahir', 'lblValBirthDate'));
    tblPersonal.setCell(2, 0, this.infoField('Jenis Kelamin', 'lblValGender'));
    tblPersonal.setCell(2, 1, this.infoField('Agama', 'lblValReligion'));
    tblPersonal.setCell(3, 0, this.infoField('Nomor Telepon / WA', 'lblValPhoneNumber'));
    tblPersonal.setCell(3, 1, this.infoField('Email Pribadi', 'lblValPersonalEmail'));
    tblPersonal.setCell(4, 0, this.infoField('Alamat Domisili Saat Ini', 'lblValCurrentAddress'));
    tblPersonal.setCell(4, 1, this.infoField('Alamat Sesuai KTP', 'lblValIdCardAddress'));
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
    const tblEmergency = new WiseTableLayout({ rows: 1, columns: 3, id: 'tblEmergency' });
    tblEmergency.setCell(0, 0, this.infoField('Nama Kontak', 'lblValEmergencyName'));
    tblEmergency.setCell(0, 1, this.infoField('Hubungan', 'lblValEmergencyRelation'));
    tblEmergency.setCell(0, 2, this.infoField('Nomor Telepon', 'lblValEmergencyPhone'));
    frameEmergency.addControl(tblEmergency);
    tabPersControls.push(frameEmergency);

    detailTabs.addTab({ label: 'Data Pribadi', icon: '👤', controls: tabPersControls });

    // ── TAB 2: DATA PEKERJAAN ───────────────────────────────────
    const tabEmplControls = [];
    const tblEmployment = new WiseTableLayout({ rows: 5, columns: 2, id: 'tblDetailEmployment', style: { marginBottom: '8px' } });
    tblEmployment.setCell(0, 0, this.infoField('NIK / ID Karyawan', 'lblValNik'));
    tblEmployment.setCell(0, 1, this.infoField('Jabatan / Posisi', 'lblValJobTitle'));
    tblEmployment.setCell(1, 0, this.infoField('Tingkat Jabatan (Job Level)', 'lblValJobLevel'));
    tblEmployment.setCell(1, 1, this.infoField('Departemen', 'lblValDepartment'));
    tblEmployment.setCell(2, 0, this.infoField('Divisi / Unit Kerja', 'lblValDivision'));
    tblEmployment.setCell(2, 1, this.infoField('Status Kepegawaian', 'lblValEmploymentStatus'));
    tblEmployment.setCell(3, 0, this.infoField('Tanggal Bergabung (Join Date)', 'lblValJoinDate'));
    tblEmployment.setCell(3, 1, this.infoField('Tanggal Selesai (Kontrak/Magang)', 'lblValEndDate'));
    tblEmployment.setCell(4, 0, this.infoField('Atasan Langsung (Manager)', 'lblValManagerName'));
    tblEmployment.setCell(4, 1, this.infoField('Lokasi Penempatan Kerja', 'lblValWorkLocation'));
    tabEmplControls.push(tblEmployment);

    const frameTenure = new WiseFrame('Masa Kerja & Status Akun', {
      id: 'frameTenure',
      style: {
        marginTop: '6px',
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        padding: '12px'
      }
    });
    const tblTenure = new WiseTableLayout({ rows: 1, columns: 2, id: 'tblTenure' });
    tblTenure.setCell(0, 0, this.infoField('Masa Kerja', 'lblValTenure'));
    tblTenure.setCell(0, 1, this.infoField('Status Keaktifan', 'lblValActiveStatus'));
    frameTenure.addControl(tblTenure);
    tabEmplControls.push(frameTenure);

    detailTabs.addTab({ label: 'Data Pekerjaan', icon: '💼', controls: tabEmplControls });

    // ── TAB 3: KOMPENSASI & PAYROLL ─────────────────────────────
    const tabPayControls = [];
    const tblPayroll = new WiseTableLayout({ rows: 5, columns: 2, id: 'tblDetailPayroll', style: { marginBottom: '8px' } });
    tblPayroll.setCell(0, 0, this.infoField('Nama Bank', 'lblValBankName'));
    tblPayroll.setCell(0, 1, this.infoField('Nomor Rekening', 'lblValBankAccountNumber'));
    tblPayroll.setCell(1, 0, this.infoField('Nama Pemilik Rekening', 'lblValBankAccountHolder'));
    tblPayroll.setCell(1, 1, this.infoField('Status PTKP (Pajak)', 'lblValTaxStatus'));
    tblPayroll.setCell(2, 0, this.infoField('Gaji Pokok', 'lblValBasicSalary'));
    tblPayroll.setCell(2, 1, this.infoField('Tunjangan Jabatan', 'lblValAllowancePosition'));
    tblPayroll.setCell(3, 0, this.infoField('Tunjangan Transport', 'lblValAllowanceTransport'));
    tblPayroll.setCell(3, 1, this.infoField('Tunjangan Makan', 'lblValAllowanceMeal'));
    tblPayroll.setCell(4, 0, this.infoField('Tunjangan Lainnya', 'lblValAllowanceOther'));
    tblPayroll.setCell(4, 1, this.infoField('Total Gaji Bruto', 'lblValTotalSalary'));
    tabPayControls.push(tblPayroll);

    const frameTax = new WiseFrame('Legalitas Pajak & Jaminan Sosial (BPJS)', {
      id: 'frameTax',
      style: {
        marginTop: '6px',
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        padding: '12px'
      }
    });
    const tblTax = new WiseTableLayout({ rows: 1, columns: 3, id: 'tblTax' });
    tblTax.setCell(0, 0, this.infoField('Nomor NPWP', 'lblValNpwp'));
    tblTax.setCell(0, 1, this.infoField('Nomor BPJS Kesehatan', 'lblValBpjsKesehatan'));
    tblTax.setCell(0, 2, this.infoField('Nomor BPJS Ketenagakerjaan', 'lblValBpjsKetenagakerjaan'));
    frameTax.addControl(tblTax);
    tabPayControls.push(frameTax);

    detailTabs.addTab({ label: 'Kompensasi & Payroll', icon: '💰', controls: tabPayControls });

    // ── TAB 4: DOKUMEN & LEGALITAS ──────────────────────────────
    const tabDocControls = [];
    const dtDocuments = new WiseDataTable({ id: 'dtDocuments', pageSize: 6 });
    dtDocuments.setColumns([
      { dataField: 'documentType', header: 'Jenis Dokumen', width: 140 },
      { dataField: 'title', header: 'Nama / Judul Dokumen', width: 220 },
      { dataField: 'documentNumber', header: 'Nomor Dokumen', width: 160 },
      { dataField: 'issueDate', header: 'Tgl Terbit', width: 110 },
      { dataField: 'expiryDate', header: 'Tgl Berakhir', width: 110 },
      { dataField: 'description', header: 'Keterangan', width: 200 }
    ]);
    tabDocControls.push(dtDocuments);
    detailTabs.addTab({ label: 'Dokumen & Legalitas', icon: '📁', controls: tabDocControls });

    // ── TAB 5: PENGALAMAN KERJA ──────────────────────────────────
    const tabExpControls = [];
    const dtExperiences = new WiseDataTable({ id: 'dtExperiences', pageSize: 6 });
    dtExperiences.setColumns([
      { dataField: 'companyName', header: 'Perusahaan', width: 200 },
      { dataField: 'position', header: 'Posisi', width: 180 },
      { dataField: 'startDate', header: 'Tgl Mulai', width: 110 },
      { dataField: 'endDate', header: 'Tgl Selesai', width: 110 },
      { dataField: 'lastSalary', header: 'Gaji Terakhir', width: 130 },
      { dataField: 'description', header: 'Keterangan', width: 220 }
    ]);
    tabExpControls.push(dtExperiences);
    detailTabs.addTab({ label: 'Pengalaman Kerja', icon: '🏢', controls: tabExpControls });

    // ── TAB 6: RIWAYAT PENDIDIKAN ───────────────────────────────
    const tabEduControls = [];
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
    tabEduControls.push(dtEducation);
    detailTabs.addTab({ label: 'Riwayat Pendidikan', icon: '🎓', controls: tabEduControls });

    // ── TAB 7: RIWAYAT KARIR INTERNAL ───────────────────────────
    const tabCareerControls = [];
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
    tabCareerControls.push(dtCareer);
    detailTabs.addTab({ label: 'Riwayat Karir', icon: '📈', controls: tabCareerControls });

    // ── TAB 8: DATA KELUARGA ────────────────────────────────────
    const tabFamilyControls = [];
    const dtFamily = new WiseDataTable({ id: 'dtFamily', pageSize: 6 });
    dtFamily.setColumns([
      { dataField: 'name', header: 'Nama Anggota Keluarga', width: 240 },
      { dataField: 'gender', header: 'Gender', width: 140 },
      { dataField: 'relationship', header: 'Hubungan', width: 180 },
      { dataField: 'phone', header: 'Nomor Kontak', width: 200 }
    ]);
    tabFamilyControls.push(dtFamily);
    detailTabs.addTab({ label: 'Data Keluarga', icon: '👨‍👩‍👧‍👦', controls: tabFamilyControls });

    this.addControl(detailTabs);
    return this;
  }

  infoField(label, valueId, defaultText = '—') {
    const frame = new WiseFrame('', {
      style: {
        padding: '10px 14px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginBottom: '6px'
      }
    });
    frame.addControl(new WiseLabel(label, {
      style: {
        fontWeight: 600,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: '4px',
        display: 'block'
      }
    }));
    frame.addControl(new WiseLabel(defaultText, {
      id: valueId,
      style: {
        fontWeight: 600,
        color: '#1e293b',
        display: 'block',
        wordBreak: 'break-word'
      }
    }));
    return frame;
  }

  formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
    return `Rp ${Number(amount).toLocaleString('id-ID')}`;
  }

  async onShow(options = {}) {
    this.visible = true;
    const opts = options || {};
    const employeeId = opts.employeeId || this.selectedEmployeeId;
    if (employeeId) {
      await this.loadEmployee(employeeId);
    }
  }

  async loadEmployee(employeeId) {
    if (!employeeId) return;
    this.selectedEmployeeId = employeeId;
    try {
      const emp = await api.getEmployeeById(employeeId);
      this.currentEmployeeData = emp;
      this.title = `Detail Karyawan — ${emp.fullName || emp.nik}`;
      this.populateForm(emp);
    } catch (err) {
      this.showInfo('Gagal Memuat Data', err.message, 'error');
    }
  }

  populateForm(emp) {
    if (!emp) return;

    // Hero Banner
    if (this.lblDetailEmployeeName) {
      this.lblDetailEmployeeName.text(`${emp.fullName || '—'}  (${emp.nik || '—'})`);
    }
    if (this.lblDetailEmployeeInfo) {
      const statusText = emp.isActive ? '🟢 Aktif' : '🔴 Nonaktif';
      this.lblDetailEmployeeInfo.text(`${emp.jobTitle || '—'}  •  ${emp.department || '—'}  •  ${emp.employmentStatus || '—'}  •  ${statusText}`);
    }

    // Tab 1: Personal
    if (this.lblValFullName) this.lblValFullName.text(emp.fullName || '—');
    if (this.lblValNickname) this.lblValNickname.text(emp.nickname || '—');
    if (this.lblValBirthPlace) this.lblValBirthPlace.text(emp.birthPlace || '—');
    if (this.lblValBirthDate) this.lblValBirthDate.text(emp.birthDate || '—');
    if (this.lblValGender) this.lblValGender.text(emp.gender || '—');
    if (this.lblValReligion) this.lblValReligion.text(emp.religion || '—');
    if (this.lblValPhoneNumber) this.lblValPhoneNumber.text(emp.phoneNumber || '—');
    if (this.lblValPersonalEmail) this.lblValPersonalEmail.text(emp.personalEmail || '—');
    if (this.lblValCurrentAddress) this.lblValCurrentAddress.text(emp.currentAddress || '—');
    if (this.lblValIdCardAddress) this.lblValIdCardAddress.text(emp.idCardAddress || '—');
    if (this.lblValEmergencyName) this.lblValEmergencyName.text(emp.emergencyContactName || '—');
    if (this.lblValEmergencyRelation) this.lblValEmergencyRelation.text(emp.emergencyContactRelation || '—');
    if (this.lblValEmergencyPhone) this.lblValEmergencyPhone.text(emp.emergencyContactPhone || '—');

    // Tab 2: Employment
    if (this.lblValNik) this.lblValNik.text(emp.nik || '—');
    if (this.lblValJobTitle) this.lblValJobTitle.text(emp.jobTitle || '—');
    if (this.lblValJobLevel) this.lblValJobLevel.text(emp.jobLevel || '—');
    if (this.lblValDepartment) this.lblValDepartment.text(emp.department || '—');
    if (this.lblValDivision) this.lblValDivision.text(emp.division || '—');
    if (this.lblValEmploymentStatus) this.lblValEmploymentStatus.text(emp.employmentStatus || '—');
    if (this.lblValJoinDate) this.lblValJoinDate.text(emp.joinDate || '—');
    if (this.lblValEndDate) this.lblValEndDate.text(emp.endDate || '—');
    if (this.lblValManagerName) this.lblValManagerName.text(emp.managerName || (emp.manager ? emp.manager.fullName : '—'));
    if (this.lblValWorkLocation) this.lblValWorkLocation.text(emp.workLocation || '—');
    if (this.lblValTenure) this.lblValTenure.text(emp.tenure?.formatted || '—');
    if (this.lblValActiveStatus) this.lblValActiveStatus.text(emp.isActive ? '🟢 Aktif' : '🔴 Nonaktif');

    // Tab 3: Payroll
    if (this.lblValBankName) this.lblValBankName.text(emp.bankName || '—');
    if (this.lblValBankAccountNumber) this.lblValBankAccountNumber.text(emp.bankAccountNumber || '—');
    if (this.lblValBankAccountHolder) this.lblValBankAccountHolder.text(emp.bankAccountHolder || '—');
    if (this.lblValTaxStatus) this.lblValTaxStatus.text(emp.taxStatus || '—');
    if (this.lblValBasicSalary) this.lblValBasicSalary.text(this.formatCurrency(emp.basicSalary));
    if (this.lblValAllowancePosition) this.lblValAllowancePosition.text(this.formatCurrency(emp.allowancePosition));
    if (this.lblValAllowanceTransport) this.lblValAllowanceTransport.text(this.formatCurrency(emp.allowanceTransport));
    if (this.lblValAllowanceMeal) this.lblValAllowanceMeal.text(this.formatCurrency(emp.allowanceMeal));
    if (this.lblValAllowanceOther) this.lblValAllowanceOther.text(this.formatCurrency(emp.allowanceOther));
    if (this.lblValTotalSalary) this.lblValTotalSalary.text(this.formatCurrency(emp.totalSalary));
    if (this.lblValNpwp) this.lblValNpwp.text(emp.npwp || '—');
    if (this.lblValBpjsKesehatan) this.lblValBpjsKesehatan.text(emp.bpjsKesehatan || '—');
    if (this.lblValBpjsKetenagakerjaan) this.lblValBpjsKetenagakerjaan.text(emp.bpjsKetenagakerjaan || '—');

    // Sub-records Data Tables
    if (this.dtDocuments) this.dtDocuments.setData(emp.documents || [], (emp.documents || []).length);
    if (this.dtExperiences) this.dtExperiences.setData(emp.workExperiences || [], (emp.workExperiences || []).length);
    if (this.dtEducation) this.dtEducation.setData(emp.educationHistories || [], (emp.educationHistories || []).length);
    if (this.dtCareer) this.dtCareer.setData(emp.careerHistories || [], (emp.careerHistories || []).length);
    if (this.dtFamily) this.dtFamily.setData(emp.familyMembers || [], (emp.familyMembers || []).length);
  }

  async onOpenEditClick() {
    const WinEmployeeEdit = require('./WinEmployeeEdit');
    await this.openWindow(WinEmployeeEdit, { employeeId: this.selectedEmployeeId });
  }

  onCloseClick() {
    this.close();
  }
}

module.exports = WinEmployeeDetail;
