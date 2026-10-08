const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseComboBox = require('../../../../system/controls/WiseComboBox');
const WiseDate = require('../../../../system/controls/WiseDate');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseFrame = require('../../../../system/controls/WiseFrame');

const HrisApiRepository = require('../services/HrisApiRepository');
const api = new HrisApiRepository();

const EDU_DEGREES = ['SMA/SMK', 'D3', 'D4', 'S1', 'S2', 'S3', 'Sertifikasi Profesi'];

class WinEmployeeEducationEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.employeeId = options.employeeId || null;
    this.record = options.data || null;
    this.recordId = (this.record && this.record.id) || null;
    this.title = this.recordId ? 'Edit Riwayat Pendidikan' : 'Tambah Riwayat Pendidikan';
    this.width = 620;
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    // ── Form Content ────────────────────────────────────
    const tblEdu = new WiseTableLayout({ rows: 4, columns: 2, id: 'tblEduEdit', style: { marginBottom: '16px' } });

    this.txtEduInst = new WiseTextBox('e.g. Institut Teknologi Bandung', { id: 'txtEduInst', value: this.record?.institutionName || '', placeholder: 'e.g. Institut Teknologi Bandung' });
    this.cmbEduDegree = new WiseComboBox(EDU_DEGREES.map(d => ({ value: d, label: d })), { id: 'cmbEduDegree', value: this.record?.degree || 'S1' });
    this.txtEduMajor = new WiseTextBox('e.g. Teknik Informatika', { id: 'txtEduMajor', value: this.record?.major || '', placeholder: 'e.g. Teknik Informatika' });
    this.txtEduGpa = new WiseTextBox('e.g. 3.85', { id: 'txtEduGpa', value: this.record?.gpa || '', placeholder: 'e.g. 3.85' });
    this.dtEduStart = new WiseDate(this.record?.startDate || '', { id: 'dtEduStart', value: this.record?.startDate || '' });
    this.dtEduGrad = new WiseDate(this.record?.graduationDate || '', { id: 'dtEduGrad', value: this.record?.graduationDate || '' });
    this.txtEduDesc = new WiseTextBox('Catatan prestasi atau predikat...', { id: 'txtEduDesc', value: this.record?.description || '', placeholder: 'Catatan prestasi atau predikat...' });

    tblEdu.setCell(0, 0, this.formGroup('Nama Institusi / Universitas *', this.txtEduInst));
    tblEdu.setCell(0, 1, this.formGroup('Jenjang Pendidikan', this.cmbEduDegree));
    tblEdu.setCell(1, 0, this.formGroup('Jurusan / Program Studi', this.txtEduMajor));
    tblEdu.setCell(1, 1, this.formGroup('IPK / Nilai Kelulusan', this.txtEduGpa));
    tblEdu.setCell(2, 0, this.formGroup('Tanggal Mulai', this.dtEduStart));
    tblEdu.setCell(2, 1, this.formGroup('Tanggal Lulus', this.dtEduGrad));
    tblEdu.setCell(3, 0, this.formGroup('Keterangan / Prestasi', this.txtEduDesc), { colSpan: 2 });
    this.addControl(tblEdu);

    // ── Action Buttons ──────────────────────────────────────────
    const actionFrame = new WiseFrame('', { style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' } });
    actionFrame.addControl(new WiseButton('💾 Simpan Pendidikan', {
      id: 'btnSaveEdu',
      onClick: this.onSaveClick.bind(this),
      style: {
        background: 'var(--accent)',
        color: '#ffffff',
        fontWeight: 700,
        borderRadius: '8px',
        padding: '10px 20px',
        border: 'none',
        boxShadow: 'none',
        marginRight: '8px',
        cursor: 'pointer'
      }
    }));
    actionFrame.addControl(new WiseButton('✕ Batal', {
      id: 'btnCancelEdu',
      onClick: this.onCancelClick.bind(this),
      style: {
        background: '#e2e8f0',
        color: '#475569',
        fontWeight: 600,
        borderRadius: '8px',
        padding: '10px 16px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));
    this.addControl(actionFrame);

    return this;
  }

  formGroup(label, control) {
    const frame = new WiseFrame('', { style: { padding: '4px 6px', border: 'none', background: 'transparent' } });
    frame.addControl(new WiseLabel(label, { style: { fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' } }));
    frame.addControl(control);
    return frame;
  }

  async onSaveClick() {
    if (!this.employeeId) {
      return this.showInfo('Peringatan', 'Data karyawan belum ditentukan.', 'warning');
    }
    const inst = this.txtEduInst ? this.txtEduInst.value : '';
    if (!inst) {
      return this.showInfo('Validasi', 'Nama institusi pendidikan wajib diisi.', 'warning');
    }

    const payload = {
      institutionName: inst,
      degree: this.cmbEduDegree ? this.cmbEduDegree.value : 'S1',
      major: this.txtEduMajor ? this.txtEduMajor.value : '',
      startDate: (this.dtEduStart ? this.dtEduStart.value : null) || null,
      graduationDate: (this.dtEduGrad ? this.dtEduGrad.value : null) || null,
      gpa: this.txtEduGpa ? this.txtEduGpa.value : '',
      description: this.txtEduDesc ? this.txtEduDesc.value : ''
    };

    try {
      if (this.recordId) {
        await api.updateEducationHistory(this.recordId, payload);
        this.showInfo('Berhasil', 'Data riwayat pendidikan berhasil diperbarui.', 'success');
      } else {
        await api.addEducationHistory(this.employeeId, payload);
        this.showInfo('Berhasil', 'Riwayat pendidikan berhasil ditambahkan.', 'success');
      }

      if (this.parentWindow && typeof this.parentWindow.loadEmployee === 'function') {
        await this.parentWindow.loadEmployee(this.employeeId);
      }
      this.close();
    } catch (err) {
      this.showInfo('Gagal Menyimpan', err.message, 'error');
    }
  }

  onCancelClick() {
    this.close();
  }
}

module.exports = WinEmployeeEducationEdit;
