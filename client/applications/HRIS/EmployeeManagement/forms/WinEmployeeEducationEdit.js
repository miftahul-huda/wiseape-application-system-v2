import {
  WiseWindow,
  WiseButton,
  WiseTextBox,
  WiseComboBox,
  WiseDate,
  WiseTableLayout,
  WiseFrame,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

import HrisApiRepository from '../services/HrisApiRepository';
const api = new HrisApiRepository();

const EDU_DEGREES = ['SMA/SMK', 'D3', 'D4', 'S1', 'S2', 'S3', 'Sertifikasi Profesi'];

class WinEmployeeEducationEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.record = options.data || null;
    this.employeeId = options.employeeId || (this.record && this.record.employeeId) || (options.parentWindow && (options.parentWindow.selectedEmployeeId || options.parentWindow.employeeId)) || null;
    this.recordId = (this.record && this.record.id) || null;
    this.title = this.recordId ? (WiseI18n ? WiseI18n.t('EDIT_PENDIDIKAN_MENU') : 'Edit Riwayat Pendidikan') : (WiseI18n ? WiseI18n.t('TAMBAH_PENDIDIKAN') : 'Tambah Riwayat Pendidikan');
    this.width = 620;
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    // ── Form Content ────────────────────────────────────
    const tblEdu = new WiseTableLayout({ rows: 4, columns: 2, id: 'tblEduEdit', style: { marginBottom: '16px' } });

    this.txtEduInst = new WiseTextBox('e.g. Institut Teknologi Bandung', { id: 'txtEduInst', datafield: 'institutionName', placeholder: 'e.g. Institut Teknologi Bandung' });
    this.cmbEduDegree = new WiseComboBox(EDU_DEGREES.map(d => ({ value: d, label: d })), { id: 'cmbEduDegree', datafield: 'degree', value: 'S1' });
    this.txtEduMajor = new WiseTextBox('e.g. Teknik Informatika', { id: 'txtEduMajor', datafield: 'major', placeholder: 'e.g. Teknik Informatika' });
    this.txtEduGpa = new WiseTextBox('e.g. 3.85', { id: 'txtEduGpa', datafield: 'gpa', placeholder: 'e.g. 3.85' });
    this.dtEduStart = new WiseDate('', { id: 'dtEduStart', datafield: 'startDate' });
    this.dtEduGrad = new WiseDate('', { id: 'dtEduGrad', datafield: 'graduationDate' });
    this.txtEduDesc = new WiseTextBox(WiseI18n.t('CATATAN_PRESTASI_ATAU_PREDIKAT'), { id: 'txtEduDesc', datafield: 'description', placeholder: WiseI18n.t('CATATAN_PRESTASI_ATAU_PREDIKAT') });

    tblEdu.setCell(0, 0, this.formGroup(WiseI18n.t('NAMA_INSTITUSI_UNIVERSITAS_2'), this.txtEduInst));
    tblEdu.setCell(0, 1, this.formGroup(WiseI18n.t('JENJANG_PENDIDIKAN'), this.cmbEduDegree));
    tblEdu.setCell(1, 0, this.formGroup(WiseI18n.t('JURUSAN_PROGRAM_STUDI'), this.txtEduMajor));
    tblEdu.setCell(1, 1, this.formGroup(WiseI18n.t('IPK_NILAI_KELULUSAN'), this.txtEduGpa));
    tblEdu.setCell(2, 0, this.formGroup(WiseI18n.t('TANGGAL_MULAI'), this.dtEduStart));
    tblEdu.setCell(2, 1, this.formGroup(WiseI18n.t('TANGGAL_LULUS'), this.dtEduGrad));
    tblEdu.setCell(3, 0, this.formGroup(WiseI18n.t('KETERANGAN_PRESTASI'), this.txtEduDesc), { colSpan: 2 });
    this.addControl(tblEdu);

    if (this.record) {
      this.populate(this.record);
    }

    // ── Action Buttons ──────────────────────────────────────────
    const actionFrame = new WiseFrame('', {
      id: 'frameEduActions',
      style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' }
    });
    actionFrame.addControl(new WiseButton(WiseI18n.t('SIMPAN'), {
      id: 'btnSaveEdu',
      onClick: this.onSaveClick.bind(this),
      style: { marginRight: '8px' }
    }));
    actionFrame.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnCancelEdu',
      onClick: this.onCancelClick.bind(this),
      style: {
        background: '#e2e8f0',
        color: '#475569'
      }
    }));
    this.addControl(actionFrame);

    return this;
  }

  formGroup(label, control) {
    const frame = new WiseFrame('', { style: { padding: '2px 4px', border: 'none', background: 'transparent' } });
    const resolvedLabel = typeof WiseI18n !== 'undefined' ? WiseI18n.t(label) : label;
    if (control && typeof control.setLabel === 'function') control.setLabel(resolvedLabel);
    frame.addControl(control);
    return frame;
  }

  async onSaveClick() {
    const empId = this.employeeId || (this.record && this.record.employeeId) || (this.parentWindow && (this.parentWindow.selectedEmployeeId || this.parentWindow.employeeId));
    if (!empId) {
      return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('DATA_KARYAWAN_BELUM_DITENTUKAN'), 'warning');
    }
    this.employeeId = empId;

    const values = this.getValues();
    const inst = (values.institutionName || '').trim();
    if (!inst) {
      return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('NAMA_INSTITUSI_PENDIDIKAN_WAJIB_DIISI'), 'warning');
    }

    const payload = {
      institutionName: inst,
      degree: values.degree || 'S1',
      major: (values.major || '').trim(),
      startDate: values.startDate || null,
      graduationDate: values.graduationDate || null,
      gpa: (values.gpa || '').trim(),
      description: (values.description || '').trim()
    };

    try {
      if (this.recordId) {
        await api.updateEducationHistory(this.recordId, payload);
        this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('DATA_RIWAYAT_PENDIDIKAN_BERHASIL_DIPERBARUI'), 'success');
      } else {
        await api.addEducationHistory(this.employeeId, payload);
        this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('RIWAYAT_PENDIDIKAN_BERHASIL_DITAMBAHKAN'), 'success');
      }

      if (this.parentWindow && typeof this.parentWindow.loadEmployee === 'function') {
        await this.parentWindow.loadEmployee(this.employeeId);
      }
      this.close();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENYIMPAN'), err.message, 'error');
    }
  }

  onCancelClick() {
    this.close();
  }
}

export default WinEmployeeEducationEdit;
