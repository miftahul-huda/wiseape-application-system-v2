import {
  WiseWindow,
  WiseLabel,
  WiseButton,
  WiseTabControl,
  WiseDataTable,
  WiseTableLayout,
  WiseFrame,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

import WinEmployeeEdit from './WinEmployeeEdit';
import HrisApiRepository from '../services/HrisApiRepository';
const api = new HrisApiRepository();

// Light-grey header for the sub-record tables (instead of the theme-accent default).
const GREY_TABLE_HEADER = { background: '#e2e8f0', color: '#334155' };

class WinEmployeeDetail extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('DETAIL_KARYAWAN_WISE_HRIS');
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
    heroLeft.addControl(new WiseLabel('📋 ' + WiseI18n.t('DETAIL_INFORMASI_KARYAWAN'), {
      id: 'lblDetailHeroTitle',
      style: { fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }
    }));
    heroLeft.addControl(new WiseLabel(WiseI18n.t('MEMUAT_DATA_KARYAWAN'), {
      id: 'lblDetailEmployeeName',
      style: { fontSize: 22, color: '#ffffff', display: 'block', fontWeight: 800, marginBottom: '4px' }
    }));
    heroLeft.addControl(new WiseLabel('', {
      id: 'lblDetailEmployeeInfo',
      style: { color: 'rgba(255,255,255,0.9)', display: 'block' }
    }));

    const heroRight = new WiseFrame('', { style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' } });
    heroRight.addControl(new WiseButton('✏️ ' + WiseI18n.t('EDIT_DATA_KARYAWAN_MENU'), {
      id: 'btnDetailOpenEdit',
      onClick: this.onOpenEditClick.bind(this),
      style: {
        background: '#ffffff',
        color: 'var(--accent-dark)'
      }
    }));
    heroRight.addControl(new WiseButton('✕ ' + WiseI18n.t('TUTUP_2'), {
      id: 'btnDetailClose',
      onClick: this.onCloseClick.bind(this),
      style: {
        background: 'rgba(255,255,255,0.2)',
        color: '#ffffff'
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
      onTabChanged: () => { }
    });

    // ── TAB 1: DATA PRIBADI ─────────────────────────────────────
    const tabPersControls = [];
    const tblPersonal = new WiseTableLayout({
      rows: 5,
      columns: 2,
      columnWidths: ['50%', '50%'],
      tableLayout: 'fixed',
      id: 'tblDetailPersonal',
      style: { width: '100%', tableLayout: 'fixed', marginBottom: '8px' }
    });
    tblPersonal.setCell(0, 0, this.infoField(WiseI18n.t('NAMA_LENGKAP'), 'lblValFullName'));
    tblPersonal.setCell(0, 1, this.infoField(WiseI18n.t('NAMA_PANGGILAN'), 'lblValNickname'));
    tblPersonal.setCell(1, 0, this.infoField(WiseI18n.t('TEMPAT_LAHIR'), 'lblValBirthPlace'));
    tblPersonal.setCell(1, 1, this.infoField(WiseI18n.t('TANGGAL_LAHIR'), 'lblValBirthDate'));
    tblPersonal.setCell(2, 0, this.infoField(WiseI18n.t('JENIS_KELAMIN'), 'lblValGender'));
    tblPersonal.setCell(2, 1, this.infoField(WiseI18n.t('AGAMA'), 'lblValReligion'));
    tblPersonal.setCell(3, 0, this.infoField(WiseI18n.t('NOMOR_TELEPON_WHATSAPP'), 'lblValPhoneNumber'));
    tblPersonal.setCell(3, 1, this.infoField(WiseI18n.t('EMAIL_PRIBADI'), 'lblValPersonalEmail'));
    tblPersonal.setCell(4, 0, this.infoField(WiseI18n.t('ALAMAT_TEMPAT_TINGGAL_SAAT_INI'), 'lblValCurrentAddress'));
    tblPersonal.setCell(4, 1, this.infoField(WiseI18n.t('ALAMAT_SESUAI_KTP'), 'lblValIdCardAddress'));
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
    tblEmergency.setCell(0, 0, this.infoField(WiseI18n.t('NAMA_KONTAK_DARURAT'), 'lblValEmergencyName'));
    tblEmergency.setCell(0, 1, this.infoField(WiseI18n.t('HUBUNGAN'), 'lblValEmergencyRelation'));
    tblEmergency.setCell(0, 2, this.infoField(WiseI18n.t('NOMOR_TELEPON_DARURAT'), 'lblValEmergencyPhone'));
    frameEmergency.addControl(tblEmergency);
    tabPersControls.push(frameEmergency);

    detailTabs.addTab({ label: WiseI18n.t('DATA_PRIBADI'), icon: '👤', controls: tabPersControls });

    // ── TAB 2: DATA PEKERJAAN ───────────────────────────────────
    const tabEmplControls = [];
    const tblEmployment = new WiseTableLayout({
      rows: 5,
      columns: 2,
      columnWidths: ['50%', '50%'],
      tableLayout: 'fixed',
      id: 'tblDetailEmployment',
      style: { width: '100%', tableLayout: 'fixed', marginBottom: '8px' }
    });
    tblEmployment.setCell(0, 0, this.infoField(WiseI18n.t('NIK_ID_KARYAWAN'), 'lblValNik'));
    tblEmployment.setCell(0, 1, this.infoField(WiseI18n.t('JABATAN_POSISI'), 'lblValJobTitle'));
    tblEmployment.setCell(1, 0, this.infoField(WiseI18n.t('TINGKAT_JABATAN'), 'lblValJobLevel'));
    tblEmployment.setCell(1, 1, this.infoField(WiseI18n.t('DEPARTEMEN'), 'lblValDepartment'));
    tblEmployment.setCell(2, 0, this.infoField(WiseI18n.t('DIVISI_SUB_DEPARTEMEN'), 'lblValDivision'));
    tblEmployment.setCell(2, 1, this.infoField(WiseI18n.t('STATUS_KEPEGAWAIAN'), 'lblValEmploymentStatus'));
    tblEmployment.setCell(3, 0, this.infoField(WiseI18n.t('TANGGAL_BERGABUNG'), 'lblValJoinDate'));
    tblEmployment.setCell(3, 1, this.infoField(WiseI18n.t('TANGGAL_BERAKHIR_KONTRAK_MAGANG'), 'lblValEndDate'));
    tblEmployment.setCell(4, 0, this.infoField(WiseI18n.t('ATASAN_LANGSUNG'), 'lblValManagerName'));
    tblEmployment.setCell(4, 1, this.infoField(WiseI18n.t('LOKASI_KERJA'), 'lblValWorkLocation'));
    tabEmplControls.push(tblEmployment);

    const frameTenure = new WiseFrame(WiseI18n.t('MASA_KERJA_DAN_STATUS_AKUN'), {
      id: 'frameTenure',
      style: {
        marginTop: '6px',
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        padding: '12px'
      }
    });
    const tblTenure = new WiseTableLayout({
      rows: 1,
      columns: 2,
      columnWidths: ['50%', '50%'],
      tableLayout: 'fixed',
      id: 'tblTenure',
      style: { width: '100%', tableLayout: 'fixed' }
    });
    tblTenure.setCell(0, 0, this.infoField(WiseI18n.t('MASA_KERJA'), 'lblValTenure'));
    tblTenure.setCell(0, 1, this.infoField(WiseI18n.t('STATUS_KEAKTIFAN'), 'lblValActiveStatus'));
    frameTenure.addControl(tblTenure);
    tabEmplControls.push(frameTenure);

    detailTabs.addTab({ label: WiseI18n.t('DATA_PEKERJAAN'), icon: '💼', controls: tabEmplControls });

    // ── TAB 3: KOMPENSASI & PAYROLL ─────────────────────────────
    const tabPayControls = [];
    const tblPayroll = new WiseTableLayout({
      rows: 5,
      columns: 2,
      columnWidths: ['50%', '50%'],
      tableLayout: 'fixed',
      id: 'tblDetailPayroll',
      style: { width: '100%', tableLayout: 'fixed', marginBottom: '8px' }
    });
    tblPayroll.setCell(0, 0, this.infoField(WiseI18n.t('NAMA_BANK'), 'lblValBankName'));
    tblPayroll.setCell(0, 1, this.infoField(WiseI18n.t('NOMOR_REKENING_BANK'), 'lblValBankAccountNumber'));
    tblPayroll.setCell(1, 0, this.infoField(WiseI18n.t('NAMA_PEMILIK_REKENING'), 'lblValBankAccountHolder'));
    tblPayroll.setCell(1, 1, this.infoField(WiseI18n.t('STATUS_PERPAJAKAN_PTKP'), 'lblValTaxStatus'));
    tblPayroll.setCell(2, 0, this.infoField(WiseI18n.t('GAJI_POKOK'), 'lblValBasicSalary'));
    tblPayroll.setCell(2, 1, this.infoField(WiseI18n.t('TUNJANGAN_JABATAN'), 'lblValAllowancePosition'));
    tblPayroll.setCell(3, 0, this.infoField(WiseI18n.t('TUNJANGAN_TRANSPORT'), 'lblValAllowanceTransport'));
    tblPayroll.setCell(3, 1, this.infoField(WiseI18n.t('TUNJANGAN_MAKAN'), 'lblValAllowanceMeal'));
    tblPayroll.setCell(4, 0, this.infoField(WiseI18n.t('TUNJANGAN_LAINNYA'), 'lblValAllowanceOther'));
    tblPayroll.setCell(4, 1, this.infoField(WiseI18n.t('TOTAL_GAJI_BRUTO'), 'lblValTotalSalary'));
    tabPayControls.push(tblPayroll);

    const frameTax = new WiseFrame(WiseI18n.t('LEGALITAS_PAJAK_BPJS'), {
      id: 'frameTax',
      style: {
        marginTop: '6px',
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        padding: '12px'
      }
    });
    const tblTax = new WiseTableLayout({
      rows: 1,
      columns: 3,
      columnWidths: ['33.33%', '33.33%', '33.34%'],
      tableLayout: 'fixed',
      id: 'tblTax',
      style: { width: '100%', tableLayout: 'fixed' }
    });
    tblTax.setCell(0, 0, this.infoField(WiseI18n.t('NOMOR_NPWP'), 'lblValNpwp'));
    tblTax.setCell(0, 1, this.infoField(WiseI18n.t('NOMOR_BPJS_KESEHATAN'), 'lblValBpjsKesehatan'));
    tblTax.setCell(0, 2, this.infoField(WiseI18n.t('NOMOR_BPJS_KETENAGAKERJAAN'), 'lblValBpjsKetenagakerjaan'));
    frameTax.addControl(tblTax);
    tabPayControls.push(frameTax);

    detailTabs.addTab({ label: WiseI18n.t('KOMPENSASI_PAYROLL'), icon: '💰', controls: tabPayControls });

    // ── TAB 4: DOKUMEN & LEGALITAS ──────────────────────────────
    const tabDocControls = [];
    const dtDocuments = new WiseDataTable({ id: 'dtDocuments', pageSize: 6, headerStyle: GREY_TABLE_HEADER });
    dtDocuments.setColumns([
      { dataField: 'documentType', header: WiseI18n.t('JENIS_DOKUMEN'), width: 140 },
      { dataField: 'title', header: WiseI18n.t('NAMA_JUDUL_DOKUMEN'), width: 220 },
      { dataField: 'documentNumber', header: WiseI18n.t('NOMOR_DOKUMEN'), width: 160 },
      { dataField: 'issueDate', header: WiseI18n.t('TGL_TERBIT'), width: 110 },
      { dataField: 'expiryDate', header: WiseI18n.t('TGL_BERAKHIR'), width: 110 },
      { dataField: 'description', header: WiseI18n.t('KETERANGAN'), width: 200 }
    ]);
    tabDocControls.push(dtDocuments);
    detailTabs.addTab({ label: WiseI18n.t('DOKUMEN_LEGALITAS'), icon: '📁', controls: tabDocControls });

    // ── TAB 5: PENGALAMAN KERJA ──────────────────────────────────
    const tabExpControls = [];
    const dtExperiences = new WiseDataTable({ id: 'dtExperiences', pageSize: 6, headerStyle: GREY_TABLE_HEADER });
    dtExperiences.setColumns([
      { dataField: 'companyName', header: WiseI18n.t('PERUSAHAAN'), width: 200 },
      { dataField: 'position', header: WiseI18n.t('POSISI'), width: 180 },
      { dataField: 'startDate', header: WiseI18n.t('TGL_MULAI'), width: 110 },
      { dataField: 'endDate', header: WiseI18n.t('TGL_SELESAI'), width: 110 },
      { dataField: 'lastSalary', header: WiseI18n.t('GAJI_TERAKHIR'), width: 130 },
      { dataField: 'description', header: WiseI18n.t('KETERANGAN'), width: 220 }
    ]);
    tabExpControls.push(dtExperiences);
    detailTabs.addTab({ label: WiseI18n.t('PENGALAMAN_KERJA'), icon: '🏢', controls: tabExpControls });

    // ── TAB 6: RIWAYAT PENDIDIKAN ───────────────────────────────
    const tabEduControls = [];
    const dtEducation = new WiseDataTable({ id: 'dtEducation', pageSize: 6, headerStyle: GREY_TABLE_HEADER });
    dtEducation.setColumns([
      { dataField: 'institutionName', header: WiseI18n.t('INSTITUSI_PENDIDIKAN'), width: 220 },
      { dataField: 'degree', header: WiseI18n.t('JENJANG'), width: 100 },
      { dataField: 'major', header: WiseI18n.t('JURUSAN'), width: 180 },
      { dataField: 'startDate', header: WiseI18n.t('TGL_MULAI'), width: 110 },
      { dataField: 'graduationDate', header: WiseI18n.t('TGL_LULUS'), width: 110 },
      { dataField: 'gpa', header: WiseI18n.t('IPK'), width: 90 },
      { dataField: 'description', header: WiseI18n.t('KETERANGAN'), width: 200 }
    ]);
    tabEduControls.push(dtEducation);
    detailTabs.addTab({ label: WiseI18n.t('RIWAYAT_PENDIDIKAN'), icon: '🎓', controls: tabEduControls });

    // ── TAB 7: RIWAYAT KARIR INTERNAL ───────────────────────────
    const tabCareerControls = [];
    const dtCareer = new WiseDataTable({ id: 'dtCareer', pageSize: 6, headerStyle: GREY_TABLE_HEADER });
    dtCareer.setColumns([
      { dataField: 'changeType', header: WiseI18n.t('JENIS_PERUBAHAN'), width: 140 },
      { dataField: 'effectiveDate', header: WiseI18n.t('TGL_EFEKTIF'), width: 110 },
      { dataField: 'newJobTitle', header: WiseI18n.t('JABATAN_BARU'), width: 160 },
      { dataField: 'newDepartment', header: WiseI18n.t('DEPARTEMEN_BARU'), width: 140 },
      { dataField: 'newSalary', header: WiseI18n.t('GAJI_BARU'), width: 130 },
      { dataField: 'referenceNumber', header: WiseI18n.t('NOMOR_SK'), width: 140 },
      { dataField: 'notes', header: WiseI18n.t('CATATAN'), width: 220 }
    ]);
    tabCareerControls.push(dtCareer);
    detailTabs.addTab({ label: WiseI18n.t('RIWAYAT_KARIR'), icon: '📈', controls: tabCareerControls });

    // ── TAB 8: DATA KELUARGA ────────────────────────────────────
    const tabFamilyControls = [];
    const dtFamily = new WiseDataTable({ id: 'dtFamily', pageSize: 6, headerStyle: GREY_TABLE_HEADER });
    dtFamily.setColumns([
      { dataField: 'name', header: WiseI18n.t('NAMA_ANGGOTA_KELUARGA'), width: 240 },
      { dataField: 'gender', header: WiseI18n.t('JENIS_KELAMIN'), width: 140 },
      { dataField: 'relationship', header: WiseI18n.t('HUBUNGAN'), width: 180 },
      { dataField: 'phone', header: WiseI18n.t('NOMOR_KONTAK'), width: 200 }
    ]);
    tabFamilyControls.push(dtFamily);
    detailTabs.addTab({ label: WiseI18n.t('DATA_KELUARGA'), icon: '👨‍👩‍👧‍👦', controls: tabFamilyControls });

    this.addControl(detailTabs);
    return this;
  }

  infoField(label, valueId, defaultText = '—') {
    const frame = new WiseFrame('', {
      style: {
        padding: '6px 4px',
        background: 'transparent',
        border: 'none',
        marginBottom: '6px'
      }
    });
    const labelText = typeof WiseI18n !== 'undefined' ? WiseI18n.t(label) : label;
    frame.addControl(new WiseLabel(labelText, {
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
    const curr = (this.system && typeof this.system.getCurrency === 'function') ? this.system.getCurrency() : 'IDR';
    if (amount === undefined || amount === null || isNaN(amount)) {
      return WiseI18n.formatCurrency(0, curr);
    }
    return WiseI18n.formatCurrency(Number(amount), curr);
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
      this.title = `${WiseI18n.t('DETAIL_KARYAWAN')} — ${emp.fullName || emp.nik}`;
      this.populateForm(emp);
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), `${WiseI18n.t('GAGAL_MEMUAT_DATA')}: ${err.message}`, 'error');
    }
  }

  populateForm(emp) {
    if (!emp) return;

    // Hero Banner
    if (this.lblDetailEmployeeName) {
      this.lblDetailEmployeeName.text(`${emp.fullName || '—'}  (${emp.nik || '—'})`);
    }
    if (this.lblDetailEmployeeInfo) {
      const statusText = emp.isActive ? ('🟢 ' + WiseI18n.t('AKTIF_2')) : ('🔴 ' + WiseI18n.t('NONAKTIF_2'));
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
    if (this.lblValActiveStatus) this.lblValActiveStatus.text(emp.isActive ? ('🟢 ' + WiseI18n.t('AKTIF_2')) : ('🔴 ' + WiseI18n.t('NONAKTIF_2')));

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
    await this.openWindow(WinEmployeeEdit, { employeeId: this.selectedEmployeeId });
  }

  onCloseClick() {
    this.close();
  }
}

export default WinEmployeeDetail;
