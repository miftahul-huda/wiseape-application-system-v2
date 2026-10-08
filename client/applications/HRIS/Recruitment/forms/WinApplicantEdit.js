const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseNumericBox = require('../../../../system/controls/WiseNumericBox');
const WiseTextArea = require('../../../../system/controls/WiseTextArea');
const WiseComboBox = require('../../../../system/controls/WiseComboBox');
const WiseDate = require('../../../../system/controls/WiseDate');
const WiseFrame = require('../../../../system/controls/WiseFrame');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

const RecruitmentApiRepository = require('../services/RecruitmentApiRepository');
const api = new RecruitmentApiRepository();

class WinApplicantEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = options.applicantId ? WiseI18n.t('EDIT_DATA_PELAMAR_WISE_RECRUITMENT') : WiseI18n.t('TAMBAH_PELAMAR_BARU_WISE_RECRUITMENT');
    this.appIcon = options.appIcon || '👤';
    this.width = options.width || '84%';
    this.height = options.height || '86%';
    this.centered = true;

    this.selectedApplicantId = options.applicantId || null;
    this.defaultVacancyId = options.defaultVacancyId || null;
    this.onSavedCallback = options.onSaved || null;

    this.vacanciesList = [];
    this.currentApplicant = null;
  }

  onWindowInit() {
    this.controls = [];

    const inputBorderStyle = { border: '1px solid #94a3b8', borderRadius: '6px' };
    const labelStyle = { fontWeight: 600, color: '#334155', display: 'block', marginBottom: '2px', lineHeight: '1.2' };

    // Form layout: 6 rows, 2 columns
    const formGrid = new WiseTableLayout({
      rows: 6,
      columns: 2,
      id: 'tblApplicantFormGrid',
      style: { tableLayout: 'fixed', width: '100%', borderSpacing: '10px', marginBottom: '14px' }
    });

    // Row 0: Lowongan Pekerjaan Target & Status Pelamar
    const cellVac = new WiseFrame('', { id: 'frmAppVac' });
    cellVac.addControl(new WiseLabel(WiseI18n.t('LOWONGAN_PEKERJAAN_TARGET'), { id: 'lblAppVac', style: labelStyle }));
    this.cmbVacancy = new WiseComboBox(this.defaultVacancyId ? String(this.defaultVacancyId) : '', {
      id: 'cmbAppVacancy',
      items: [{ value: '', label: WiseI18n.t('PILIH_LOWONGAN_PEKERJAAN') }],
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellVac.addControl(this.cmbVacancy);
    formGrid.setCell(0, 0, cellVac);

    const cellStatus = new WiseFrame('', { id: 'frmAppStatus' });
    cellStatus.addControl(new WiseLabel(WiseI18n.t('STATUS_PELAMAR_2'), { id: 'lblAppStatus', style: labelStyle }));
    this.cmbStatus = new WiseComboBox('APPLIED', {
      id: 'cmbAppStatus',
      items: [
        { value: 'APPLIED', label: WiseI18n.t('APPLIED_BARU_MELAMAR') },
        { value: 'IN_PROCESS', label: WiseI18n.t('IN_PROCESS_SEDANG_PROSES') },
        { value: 'OFFERED', label: WiseI18n.t('OFFERED_DITAWARKAN') },
        { value: 'HIRED', label: WiseI18n.t('HIRED_DITERIMA') },
        { value: 'REJECTED', label: WiseI18n.t('REJECTED_DITOLAK') },
        { value: 'WITHDRAWN', label: WiseI18n.t('WITHDRAWN_MENGUNDURKAN_DIRI') }
      ],
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellStatus.addControl(this.cmbStatus);
    formGrid.setCell(0, 1, cellStatus);

    // Row 1: Nama Lengkap & Email
    const cellName = new WiseFrame('', { id: 'frmAppName' });
    cellName.addControl(new WiseLabel(WiseI18n.t('NAMA_LENGKAP_PELAMAR'), { id: 'lblAppName', style: labelStyle }));
    this.txtName = new WiseTextBox('', {
      id: 'txtAppFullName',
      placeholder: WiseI18n.t('NAMA_LENGKAP_BESERTA_GELAR_JIKA_ADA'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellName.addControl(this.txtName);
    formGrid.setCell(1, 0, cellName);

    const cellEmail = new WiseFrame('', { id: 'frmAppEmail' });
    cellEmail.addControl(new WiseLabel(WiseI18n.t('ALAMAT_EMAIL'), { id: 'lblAppEmail', style: labelStyle }));
    this.txtEmail = new WiseTextBox('', {
      id: 'txtAppEmail',
      placeholder: WiseI18n.t('NAMA_EMAIL_COM'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellEmail.addControl(this.txtEmail);
    formGrid.setCell(1, 1, cellEmail);

    // Row 2: Nomor Telepon & Jenis Kelamin
    const cellPhone = new WiseFrame('', { id: 'frmAppPhone' });
    cellPhone.addControl(new WiseLabel(WiseI18n.t('NOMOR_TELEPON_WHATSAPP_2'), { id: 'lblAppPhone', style: labelStyle }));
    this.txtPhone = new WiseTextBox('', {
      id: 'txtAppPhone',
      placeholder: WiseI18n.t('0812XXXXXXXX'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellPhone.addControl(this.txtPhone);
    formGrid.setCell(2, 0, cellPhone);

    const cellGender = new WiseFrame('', { id: 'frmAppGender' });
    cellGender.addControl(new WiseLabel(WiseI18n.t('JENIS_KELAMIN'), { id: 'lblAppGender', style: labelStyle }));
    this.cmbGender = new WiseComboBox('Laki-laki', {
      id: 'cmbAppGender',
      items: [
        { value: 'Laki-laki', label: WiseI18n.t('LAKI_LAKI') },
        { value: 'Perempuan', label: WiseI18n.t('PEREMPUAN') }
      ],
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellGender.addControl(this.cmbGender);
    formGrid.setCell(2, 1, cellGender);

    // Row 3: Pendidikan Terakhir & Jurusan
    const cellEdu = new WiseFrame('', { id: 'frmAppEdu' });
    cellEdu.addControl(new WiseLabel(WiseI18n.t('PENDIDIKAN_TERAKHIR'), { id: 'lblAppEdu', style: labelStyle }));
    this.cmbEducation = new WiseComboBox('S1', {
      id: 'cmbAppEducation',
      items: [
        { value: 'S1', label: WiseI18n.t('S1_SARJANA') },
        { value: 'S2', label: WiseI18n.t('S2_MAGISTER') },
        { value: 'S3', label: WiseI18n.t('S3_DOKTORAL') },
        { value: 'D3', label: WiseI18n.t('D3_DIPLOMA_TIGA') },
        { value: 'D4', label: WiseI18n.t('D4_DIPLOMA_EMPAT') },
        { value: 'SMA/SMK', label: WiseI18n.t('SMA_SMK_SEDERAJAT') },
        { value: 'Lainnya', label: WiseI18n.t('LAINNYA') }
      ],
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellEdu.addControl(this.cmbEducation);
    formGrid.setCell(3, 0, cellEdu);

    const cellMajor = new WiseFrame('', { id: 'frmAppMajor' });
    cellMajor.addControl(new WiseLabel(WiseI18n.t('JURUSAN_BIDANG_STUDI'), { id: 'lblAppMajor', style: labelStyle }));
    this.txtMajor = new WiseTextBox('', {
      id: 'txtAppMajor',
      placeholder: WiseI18n.t('CONTOH_TEKNIK_INFORMATIKA_MANAJEMEN_PSIKOLOGI'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellMajor.addControl(this.txtMajor);
    formGrid.setCell(3, 1, cellMajor);

    // Row 4: Perusahaan Saat Ini & Posisi Saat Ini
    const cellComp = new WiseFrame('', { id: 'frmAppCompany' });
    cellComp.addControl(new WiseLabel(WiseI18n.t('PERUSAHAAN_TERAKHIR_SAAT_INI'), { id: 'lblAppCompany', style: labelStyle }));
    this.txtCompany = new WiseTextBox('', {
      id: 'txtAppCompany',
      placeholder: WiseI18n.t('NAMA_PERUSAHAAN_TEMPAT_BEKERJA_SEBELUMNYA'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellComp.addControl(this.txtCompany);
    formGrid.setCell(4, 0, cellComp);

    const cellPos = new WiseFrame('', { id: 'frmAppPosition' });
    cellPos.addControl(new WiseLabel(WiseI18n.t('POSISI_JABATAN_TERAKHIR'), { id: 'lblAppPosition', style: labelStyle }));
    this.txtPosition = new WiseTextBox('', {
      id: 'txtAppPosition',
      placeholder: WiseI18n.t('CONTOH_FRONTEND_DEVELOPER_HR_OFFICER'),
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellPos.addControl(this.txtPosition);
    formGrid.setCell(4, 1, cellPos);

    // Row 5: Ekspektasi Gaji & Tanggal Lamar
    const cellSalary = new WiseFrame('', { id: 'frmAppSalary' });
    cellSalary.addControl(new WiseLabel(WiseI18n.t('EKSPEKTASI_GAJI_IDR'), { id: 'lblAppSalary', style: labelStyle }));
    this.numSalary = new WiseNumericBox(10000000, {
      id: 'numAppExpectedSalary',
      min: 0,
      max: 1000000000,
      style: { ...inputBorderStyle, width: '100%', padding: '7px 10px' }
    });
    cellSalary.addControl(this.numSalary);
    formGrid.setCell(5, 0, cellSalary);

    const cellDate = new WiseFrame('', { id: 'frmAppDate' });
    cellDate.addControl(new WiseLabel(WiseI18n.t('TANGGAL_MELAMAR'), { id: 'lblAppDate', style: labelStyle }));
    this.dtAppliedDate = new WiseDate(new Date().toISOString().slice(0, 10), {
      id: 'dtAppAppliedDate',
      style: { ...inputBorderStyle, width: '100%' }
    });
    cellDate.addControl(this.dtAppliedDate);
    formGrid.setCell(5, 1, cellDate);

    this.addControl(formGrid);

    // Notes field
    const cellNotes = new WiseFrame('', { id: 'frmAppNotes', style: { marginBottom: '14px' } });
    cellNotes.addControl(new WiseLabel(WiseI18n.t('CATATAN_TAMBAHAN_PELAMAR'), { id: 'lblAppNotes', style: labelStyle }));
    this.txtNotes = new WiseTextArea('', {
      id: 'txtAppNotes',
      rows: 3,
      placeholder: WiseI18n.t('KETERANGAN_SUMBER_PELAMAR_LINKEDIN_JOB_PORTAL_REFERRAL_ATAU'),
      style: { ...inputBorderStyle, width: '100%', padding: '8px 10px' }
    });
    cellNotes.addControl(this.txtNotes);
    this.addControl(cellNotes);

    // Action Buttons
    const btnContainer = new WiseFrame('', {
      id: 'frmAppActionButtons',
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #e2e8f0'
      }
    });

    btnContainer.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnAppCancel',
      onClick: () => this.close(),
      style: {
        background: '#e2e8f0',
        color: '#334155',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 18px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    btnContainer.addControl(new WiseButton(WiseI18n.t('SIMPAN_PELAMAR'), {
      id: 'btnAppSave',
      onClick: this.onSaveClick.bind(this),
      style: {
        background: 'var(--accent)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '6px',
        padding: '8px 20px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));

    this.addControl(btnContainer);

    return this;
  }

  async loadInitialData() {
    try {
      const vacRes = await api.listVacancies({ limit: 100, status: 'ALL' });
      this.vacanciesList = vacRes.rows || [];

      if (this.cmbVacancy) {
        this.cmbVacancy.setItems([
          { value: '', label: WiseI18n.t('PILIH_LOWONGAN_PEKERJAAN') },
          ...this.vacanciesList.map((v) => ({
            value: String(v.id),
            label: `${v.title} [${v.department}] (${v.status})`
          }))
        ]);
        if (this.defaultVacancyId) {
          this.cmbVacancy.setValue(String(this.defaultVacancyId));
        }
      }

      if (this.selectedApplicantId) {
        const app = await api.getApplicant(this.selectedApplicantId);
        this.currentApplicant = app;

        if (this.cmbVacancy) this.cmbVacancy.setValue(String(app.jobVacancyId));
        if (this.cmbStatus) this.cmbStatus.setValue(app.status || 'APPLIED');
        if (this.txtName) this.txtName.setValue(app.fullName || '');
        if (this.txtEmail) this.txtEmail.setValue(app.email || '');
        if (this.txtPhone) this.txtPhone.setValue(app.phone || '');
        if (this.cmbGender) this.cmbGender.setValue(app.gender || 'Laki-laki');
        if (this.cmbEducation) this.cmbEducation.setValue(app.lastEducation || 'S1');
        if (this.txtMajor) this.txtMajor.setValue(app.major || '');
        if (this.txtCompany) this.txtCompany.setValue(app.currentCompany || '');
        if (this.txtPosition) this.txtPosition.setValue(app.currentPosition || '');
        if (this.numSalary) this.numSalary.setValue(app.expectedSalary || 0);
        if (this.dtAppliedDate) this.dtAppliedDate.setValue(app.appliedDate || '');
        if (this.txtNotes) this.txtNotes.setValue(app.notes || '');
      }
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  async onSaveClick() {
    const vacancyId = this.cmbVacancy ? this.cmbVacancy.value : '';
    if (!vacancyId) {
      this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('LOWONGAN_PEKERJAAN_TARGET_WAJIB_DIPILIH'), 'warning');
      return;
    }

    const fullName = this.txtName ? this.txtName.value.trim() : '';
    if (!fullName) {
      this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('NAMA_LENGKAP_PELAMAR_WAJIB_DIISI'), 'warning');
      return;
    }

    const email = this.txtEmail ? this.txtEmail.value.trim() : '';
    if (!email) {
      this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('ALAMAT_EMAIL_PELAMAR_WAJIB_DIISI'), 'warning');
      return;
    }

    const payload = {
      jobVacancyId: parseInt(vacancyId, 10),
      status: this.cmbStatus ? this.cmbStatus.value : 'APPLIED',
      fullName,
      email,
      phone: this.txtPhone ? this.txtPhone.value.trim() : '',
      gender: this.cmbGender ? this.cmbGender.value : 'Laki-laki',
      lastEducation: this.cmbEducation ? this.cmbEducation.value : 'S1',
      major: this.txtMajor ? this.txtMajor.value.trim() : '',
      currentCompany: this.txtCompany ? this.txtCompany.value.trim() : '',
      currentPosition: this.txtPosition ? this.txtPosition.value.trim() : '',
      expectedSalary: this.numSalary ? parseFloat(this.numSalary.value) || 0 : 0,
      appliedDate: this.dtAppliedDate ? this.dtAppliedDate.value : null,
      notes: this.txtNotes ? this.txtNotes.value.trim() : ''
    };

    try {
      if (this.selectedApplicantId) {
        await api.updateApplicant(this.selectedApplicantId, payload);
        this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('DATA_PELAMAR_BERHASIL_DIPERBARUI'), 'success');
      } else {
        await api.createApplicant(payload);
        this.showInfo(WiseI18n.t('SUKSES'), WiseI18n.t('DATA_PELAMAR_DAN_ALUR_TAHAPAN_SELEKSI_BERHASIL_DIBUAT'), 'success');
      }

      if (typeof this.onSavedCallback === 'function') {
        this.onSavedCallback();
      }

      this.close();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENYIMPAN'), err.message, 'error');
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinApplicantEdit;
