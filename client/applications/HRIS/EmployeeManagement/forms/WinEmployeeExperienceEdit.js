const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseNumericBox = require('../../../../system/controls/WiseNumericBox');
const WiseDate = require('../../../../system/controls/WiseDate');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseFrame = require('../../../../system/controls/WiseFrame');

const HrisApiRepository = require('../services/HrisApiRepository');
const api = new HrisApiRepository();

class WinEmployeeExperienceEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.employeeId = options.employeeId || null;
    this.record = options.data || null;
    this.recordId = (this.record && this.record.id) || null;
    this.title = this.recordId ? 'Edit Pengalaman Kerja' : 'Tambah Pengalaman Kerja';
    this.width = 620;
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    // ── Form Content ────────────────────────────────────────────
    const tblExp = new WiseTableLayout({ rows: 4, columns: 2, id: 'tblExpEdit', style: { marginBottom: '16px' } });
    
    this.txtExpCompany = new WiseTextBox('e.g. PT Telekomunikasi Indonesia', { id: 'txtExpCompany', value: this.record?.companyName || '', placeholder: 'e.g. PT Telekomunikasi Indonesia' });
    this.txtExpPosition = new WiseTextBox('e.g. Senior Software Engineer', { id: 'txtExpPosition', value: this.record?.position || '', placeholder: 'e.g. Senior Software Engineer' });
    this.dtExpStart = new WiseDate(this.record?.startDate || '', { id: 'dtExpStart', value: this.record?.startDate || '' });
    this.dtExpEnd = new WiseDate(this.record?.endDate || '', { id: 'dtExpEnd', value: this.record?.endDate || '' });
    this.numExpLastSalary = new WiseNumericBox(String(this.record?.lastSalary || 0), { id: 'numExpLastSalary', value: Number(this.record?.lastSalary || 0), prefix: 'Rp ' });
    this.txtExpDesc = new WiseTextBox('Tanggung jawab utama...', { id: 'txtExpDesc', value: this.record?.description || '', placeholder: 'Tanggung jawab utama...' });

    tblExp.setCell(0, 0, this.formGroup('Nama Perusahaan *', this.txtExpCompany));
    tblExp.setCell(0, 1, this.formGroup('Posisi / Jabatan *', this.txtExpPosition));
    tblExp.setCell(1, 0, this.formGroup('Tanggal Mulai', this.dtExpStart));
    tblExp.setCell(1, 1, this.formGroup('Tanggal Selesai', this.dtExpEnd));
    tblExp.setCell(2, 0, this.formGroup('Gaji Terakhir (Rp)', this.numExpLastSalary));
    tblExp.setCell(2, 1, this.formGroup('Keterangan / Tanggung Jawab', this.txtExpDesc));
    this.addControl(tblExp);

    // ── Action Buttons ──────────────────────────────────────────
    const actionFrame = new WiseFrame('', { style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' } });
    actionFrame.addControl(new WiseButton('💾 Simpan Pengalaman', {
      id: 'btnSaveExp',
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
      id: 'btnCancelExp',
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
    const company = this.txtExpCompany ? this.txtExpCompany.value : '';
    const position = this.txtExpPosition ? this.txtExpPosition.value : '';
    if (!company || !position) {
      return this.showInfo('Validasi', 'Nama perusahaan dan posisi jabatan wajib diisi.', 'warning');
    }

    const payload = {
      companyName: company,
      position,
      startDate: (this.dtExpStart ? this.dtExpStart.value : null) || null,
      endDate: (this.dtExpEnd ? this.dtExpEnd.value : null) || null,
      lastSalary: Number(this.numExpLastSalary ? this.numExpLastSalary.value : 0) || 0,
      description: this.txtExpDesc ? this.txtExpDesc.value : ''
    };

    try {
      if (this.recordId) {
        await api.updateWorkExperience(this.recordId, payload);
        this.showInfo('Berhasil', 'Data pengalaman kerja berhasil diperbarui.', 'success');
      } else {
        await api.addWorkExperience(this.employeeId, payload);
        this.showInfo('Berhasil', 'Riwayat pengalaman kerja berhasil ditambahkan.', 'success');
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

module.exports = WinEmployeeExperienceEdit;
