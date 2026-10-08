const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseComboBox = require('../../../../system/controls/WiseComboBox');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseFrame = require('../../../../system/controls/WiseFrame');

const HrisApiRepository = require('../services/HrisApiRepository');
const api = new HrisApiRepository();

const RELATIONSHIPS = [
  { value: 'Suami', label: 'Suami' },
  { value: 'Istri', label: 'Istri' },
  { value: 'Anak', label: 'Anak' },
  { value: 'Ayah', label: 'Ayah' },
  { value: 'Ibu', label: 'Ibu' },
  { value: 'Saudara Kandung', label: 'Saudara Kandung' },
  { value: 'Lainnya', label: 'Lainnya' }
];

const GENDERS = [
  { value: 'Laki-laki', label: 'Laki-laki' },
  { value: 'Perempuan', label: 'Perempuan' }
];

class WinEmployeeFamilyEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.record = options.data || null;
    this.employeeId = options.employeeId || (this.record && this.record.employeeId) || (options.parentWindow && (options.parentWindow.selectedEmployeeId || options.parentWindow.employeeId)) || null;
    this.recordId = (this.record && this.record.id) || null;
    this.title = this.recordId ? 'Edit Anggota Keluarga' : 'Tambah Anggota Keluarga';
    this.width = 540;
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    // ── Form Content (4 Fields Only) ────────────────────────────
    const tblFam = new WiseTableLayout({ rows: 2, columns: 2, id: 'tblFamilyEdit', style: { marginBottom: '16px' } });

    this.txtFamName = new WiseTextBox('e.g. Siti Rahmawati', { id: 'txtFamName', value: this.record?.name || '', placeholder: 'e.g. Siti Rahmawati' });
    this.cmbFamGender = new WiseComboBox(GENDERS, { id: 'cmbFamGender', value: this.record?.gender || 'Laki-laki' });
    this.cmbFamRelation = new WiseComboBox(RELATIONSHIPS, { id: 'cmbFamRelation', value: this.record?.relationship || 'Anak' });
    this.txtFamPhone = new WiseTextBox('0812xxxxxxxx', { id: 'txtFamPhone', value: this.record?.phone || '', placeholder: '0812xxxxxxxx' });

    // Row 0: Nama & Gender
    tblFam.setCell(0, 0, this.formGroup('Nama Anggota Keluarga *', this.txtFamName));
    tblFam.setCell(0, 1, this.formGroup('Gender', this.cmbFamGender));

    // Row 1: Hubungan & Nomor Kontak
    tblFam.setCell(1, 0, this.formGroup('Hubungan Keluarga *', this.cmbFamRelation));
    tblFam.setCell(1, 1, this.formGroup('Nomor Kontak', this.txtFamPhone));

    this.addControl(tblFam);

    // ── Action Buttons ──────────────────────────────────────────
    const actionFrame = new WiseFrame('', {
      id: 'frameFamActions',
      style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' }
    });
    actionFrame.addControl(new WiseButton('💾 Simpan', {
      id: 'btnSaveFamily',
      onClick: this.onSaveClick.bind(this),
      style: {
        background: 'var(--accent)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 18px',
        fontWeight: '500',
        cursor: 'pointer',
        boxShadow: 'none',
        marginRight: '8px'
      }
    }));
    actionFrame.addControl(new WiseButton('Batal', {
      id: 'btnCancelFamily',
      onClick: this.onCancelClick.bind(this),
      style: {
        background: '#e2e8f0',
        color: '#334155',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        fontWeight: '500',
        boxShadow: 'none',
        cursor: 'pointer'
      }
    }));
    this.addControl(actionFrame);
  }

  formGroup(labelText, control) {
    const frame = new WiseFrame('', { style: { background: 'transparent', border: 'none', padding: '0 6px 8px 6px' } });
    frame.addControl(new WiseLabel(labelText, { style: { display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--dark-text)' } }));
    frame.addControl(control);
    return frame;
  }

  async onSaveClick() {
    const empId = this.employeeId || (this.record && this.record.employeeId) || (this.parentWindow && (this.parentWindow.selectedEmployeeId || this.parentWindow.employeeId));
    if (!empId) {
      return this.showInfo('Peringatan', 'Data karyawan belum ditentukan.', 'warning');
    }
    this.employeeId = empId;

    const name = this.txtFamName?.value?.trim();
    const gender = this.cmbFamGender?.value || 'Laki-laki';
    const relationship = this.cmbFamRelation?.value || 'Anak';
    const phone = this.txtFamPhone?.value?.trim() || null;

    if (!name) {
      this.showInfo('Validasi', 'Nama anggota keluarga wajib diisi.', 'warning');
      return;
    }

    try {
      const payload = {
        name,
        gender,
        relationship,
        phone
      };

      if (this.recordId) {
        await api.updateFamilyMember(this.recordId, payload);
        this.showInfo('Berhasil', 'Data anggota keluarga berhasil diperbarui.', 'success');
      } else {
        await api.addFamilyMember(this.employeeId, payload);
        this.showInfo('Berhasil', 'Data anggota keluarga berhasil ditambahkan.', 'success');
      }

      if (this.parentWindow) {
        if (typeof this.parentWindow.loadEmployee === 'function') {
          await this.parentWindow.loadEmployee(this.employeeId);
        } else if (typeof this.parentWindow.loadEmployeeData === 'function') {
          await this.parentWindow.loadEmployeeData(this.employeeId);
        }
      }

      this.close();
    } catch (err) {
      console.error('[WinEmployeeFamilyEdit] Save failed:', err);
      this.showInfo('Error', `Gagal menyimpan data keluarga: ${err.message}`, 'error');
    }
  }

  onCancelClick() {
    this.close();
  }
}

module.exports = WinEmployeeFamilyEdit;
