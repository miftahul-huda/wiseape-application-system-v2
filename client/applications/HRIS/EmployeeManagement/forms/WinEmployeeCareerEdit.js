const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseComboBox = require('../../../../system/controls/WiseComboBox');
const WiseNumericBox = require('../../../../system/controls/WiseNumericBox');
const WiseDate = require('../../../../system/controls/WiseDate');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseFrame = require('../../../../system/controls/WiseFrame');

const HrisApiRepository = require('../services/HrisApiRepository');
const api = new HrisApiRepository();

const CAREER_TYPES = ['Promosi', 'Demosi', 'Rotasi', 'Penyesuaian Gaji', 'Penghargaan', 'Surat Peringatan'];

class WinEmployeeCareerEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.record = options.data || null;
    this.employeeId = options.employeeId || (this.record && this.record.employeeId) || (options.parentWindow && (options.parentWindow.selectedEmployeeId || options.parentWindow.employeeId)) || null;
    this.recordId = (this.record && this.record.id) || null;
    this.title = this.recordId ? 'Edit Riwayat Karir' : 'Catat Riwayat Karir / Promosi';
    this.width = 620;
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    // ── Form Content ────────────────────────────────────────────
    const tblCar = new WiseTableLayout({ rows: 4, columns: 2, id: 'tblCareerEdit', style: { marginBottom: '16px' } });

    this.cmbCareerType = new WiseComboBox(CAREER_TYPES.map(c => ({ value: c, label: c })), { id: 'cmbCareerType', value: this.record?.changeType || 'Promosi' });
    this.dtCareerDate = new WiseDate(this.record?.effectiveDate || new Date().toISOString().slice(0, 10), { id: 'dtCareerDate', value: this.record?.effectiveDate || new Date().toISOString().slice(0, 10) });
    this.txtCareerTitle = new WiseTextBox('Posisi jabatan yang baru', { id: 'txtCareerTitle', value: this.record?.newJobTitle || '', placeholder: 'Posisi jabatan yang baru' });
    this.txtCareerDept = new WiseTextBox('Departemen baru', { id: 'txtCareerDept', value: this.record?.newDepartment || '', placeholder: 'Departemen baru' });
    this.numCareerSalary = new WiseNumericBox(String(this.record?.newSalary || 0), { id: 'numCareerSalary', value: Number(this.record?.newSalary || 0), prefix: 'Rp ' });
    this.txtCareerRef = new WiseTextBox('SK/DIR/2024/001', { id: 'txtCareerRef', value: this.record?.referenceNumber || '', placeholder: 'SK/DIR/2024/001' });
    this.txtCareerNotes = new WiseTextBox('Keterangan prestasi / alasan promosi...', { id: 'txtCareerNotes', value: this.record?.notes || '', placeholder: 'Keterangan prestasi / alasan promosi...' });

    tblCar.setCell(0, 0, this.formGroup('Jenis Perubahan *', this.cmbCareerType));
    tblCar.setCell(0, 1, this.formGroup('Tanggal Efektif *', this.dtCareerDate));
    tblCar.setCell(1, 0, this.formGroup('Jabatan Baru', this.txtCareerTitle));
    tblCar.setCell(1, 1, this.formGroup('Departemen Baru', this.txtCareerDept));
    tblCar.setCell(2, 0, this.formGroup('Gaji Baru (Rp)', this.numCareerSalary));
    tblCar.setCell(2, 1, this.formGroup('Nomor SK / Surat Keputusan', this.txtCareerRef));
    tblCar.setCell(3, 0, this.formGroup('Catatan / Alasan Perubahan', this.txtCareerNotes), { colSpan: 2 });
    this.addControl(tblCar);

    // ── Action Buttons ──────────────────────────────────────────
    const actionFrame = new WiseFrame('', {
      id: 'frameCareerActions',
      style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' }
    });
    actionFrame.addControl(new WiseButton('💾 Simpan Riwayat Karir', {
      id: 'btnSaveCareer',
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
      id: 'btnCancelCareer',
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
    const frame = new WiseFrame('', { style: { padding: '2px 4px', border: 'none', background: 'transparent' } });
    frame.addControl(new WiseLabel(label, { style: { fontWeight: 600, color: '#475569', marginBottom: '0px', lineHeight: '1.2', display: 'block' } }));
    frame.addControl(control);
    return frame;
  }

  async onSaveClick() {
    const empId = this.employeeId || (this.record && this.record.employeeId) || (this.parentWindow && (this.parentWindow.selectedEmployeeId || this.parentWindow.employeeId));
    if (!empId) {
      return this.showInfo('Peringatan', 'Data karyawan belum ditentukan.', 'warning');
    }
    this.employeeId = empId;
    const effectiveDate = (this.dtCareerDate ? this.dtCareerDate.value : null) || '';
    if (!effectiveDate) {
      return this.showInfo('Validasi', 'Tanggal efektif perubahan wajib diisi.', 'warning');
    }

    const payload = {
      changeType: this.cmbCareerType ? this.cmbCareerType.value : 'Promosi',
      effectiveDate,
      newJobTitle: this.txtCareerTitle?.value || undefined,
      newDepartment: this.txtCareerDept?.value || undefined,
      newSalary: this.numCareerSalary?.value ? Number(this.numCareerSalary.value) : undefined,
      referenceNumber: this.txtCareerRef ? this.txtCareerRef.value : '',
      notes: this.txtCareerNotes ? this.txtCareerNotes.value : '',
      applyToEmployee: true
    };

    try {
      if (this.recordId) {
        await api.updateCareerHistory(this.recordId, payload);
        this.showInfo('Berhasil', 'Data riwayat karir berhasil diperbarui.', 'success');
      } else {
        await api.addCareerHistory(this.employeeId, payload);
        this.showInfo('Berhasil', 'Riwayat karir berhasil dicatat.', 'success');
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

module.exports = WinEmployeeCareerEdit;
