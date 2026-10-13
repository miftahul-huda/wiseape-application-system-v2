import {
  WiseWindow,
  WiseButton,
  WiseTextBox,
  WiseComboBox,
  WiseNumericBox,
  WiseDate,
  WiseTableLayout,
  WiseFrame,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

import HrisApiRepository from '../services/HrisApiRepository';
const api = new HrisApiRepository();

const CAREER_TYPES = ['Promosi', 'Demosi', 'Rotasi', 'Penyesuaian Gaji', 'Penghargaan', 'Surat Peringatan'];

class WinEmployeeCareerEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.record = options.data || null;
    this.employeeId = options.employeeId || (this.record && this.record.employeeId) || (options.parentWindow && (options.parentWindow.selectedEmployeeId || options.parentWindow.employeeId)) || null;
    this.recordId = (this.record && this.record.id) || null;
    this.title = this.recordId ? WiseI18n.t('EDIT_RIWAYAT_KARIR') : WiseI18n.t('CATAT_RIWAYAT_KARIR');
    this.width = 620;
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    // ── Form Content ────────────────────────────────────────────
    const tblCar = new WiseTableLayout({ rows: 4, columns: 2, id: 'tblCareerEdit', style: { marginBottom: '16px' } });

    const currPrefix = typeof WiseI18n !== 'undefined' && WiseI18n ? WiseI18n.getCurrencyPrefix() : 'Rp ';

    this.cmbCareerType = new WiseComboBox(CAREER_TYPES.map(c => ({ value: c, label: WiseI18n.t(c) })), { id: 'cmbCareerType', datafield: 'changeType', value: 'Promosi' });
    this.dtCareerDate = new WiseDate(new Date().toISOString().slice(0, 10), { id: 'dtCareerDate', datafield: 'effectiveDate' });
    this.txtCareerTitle = new WiseTextBox('', { id: 'txtCareerTitle', datafield: 'newJobTitle', placeholder: WiseI18n.t('POSISI_JABATAN_YANG_BARU') || 'Posisi jabatan yang baru' });
    this.txtCareerDept = new WiseTextBox('', { id: 'txtCareerDept', datafield: 'newDepartment', placeholder: WiseI18n.t('DEPARTEMEN_BARU') });
    this.numCareerSalary = new WiseNumericBox('0', { id: 'numCareerSalary', datafield: 'newSalary', value: 0, prefix: currPrefix });
    this.txtCareerRef = new WiseTextBox('', { id: 'txtCareerRef', datafield: 'referenceNumber', placeholder: 'SK/DIR/2024/001' });
    this.txtCareerNotes = new WiseTextBox('', { id: 'txtCareerNotes', datafield: 'notes', placeholder: WiseI18n.t('KETERANGAN_PRESTASI_ALASAN_PROMOSI') || 'Keterangan prestasi / alasan promosi...' });

    tblCar.setCell(0, 0, this.formGroup(WiseI18n.t('JENIS_PERUBAHAN_2'), this.cmbCareerType));
    tblCar.setCell(0, 1, this.formGroup(WiseI18n.t('TANGGAL_EFEKTIF'), this.dtCareerDate));
    tblCar.setCell(1, 0, this.formGroup(WiseI18n.t('JABATAN_BARU'), this.txtCareerTitle));
    tblCar.setCell(1, 1, this.formGroup(WiseI18n.t('DEPARTEMEN_BARU'), this.txtCareerDept));
    tblCar.setCell(2, 0, this.formGroup(WiseI18n.t('GAJI_BARU_RP'), this.numCareerSalary));
    tblCar.setCell(2, 1, this.formGroup(WiseI18n.t('NOMOR_SK_SURAT_KEPUTUSAN'), this.txtCareerRef));
    tblCar.setCell(3, 0, this.formGroup(WiseI18n.t('CATATAN_ALASAN_PERUBAHAN'), this.txtCareerNotes), { colSpan: 2 });
    this.addControl(tblCar);

    if (this.record) {
      this.populate(this.record);
    }

    // ── Action Buttons ──────────────────────────────────────────
    const actionFrame = new WiseFrame('', {
      id: 'frameCareerActions',
      style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' }
    });
    actionFrame.addControl(new WiseButton(WiseI18n.t('SIMPAN_3'), {
      id: 'btnSaveCareer',
      onClick: this.onSaveClick.bind(this),
      style: { marginRight: '8px' }
    }));
    actionFrame.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnCancelCareer',
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
    const effectiveDate = values.effectiveDate || '';
    if (!effectiveDate) {
      return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('TANGGAL_EFEKTIF_PERUBAHAN_WAJIB_DIISI'), 'warning');
    }

    const payload = {
      changeType: values.changeType || 'Promosi',
      effectiveDate,
      newJobTitle: values.newJobTitle || undefined,
      newDepartment: values.newDepartment || undefined,
      newSalary: values.newSalary ? Number(values.newSalary) : undefined,
      referenceNumber: (values.referenceNumber || '').trim(),
      notes: (values.notes || '').trim(),
      applyToEmployee: true
    };

    try {
      if (this.recordId) {
        await api.updateCareerHistory(this.recordId, payload);
        this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('DATA_RIWAYAT_KARIR_BERHASIL_DIPERBARUI'), 'success');
      } else {
        await api.addCareerHistory(this.employeeId, payload);
        this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('RIWAYAT_KARIR_BERHASIL_DICATAT'), 'success');
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

export default WinEmployeeCareerEdit;
