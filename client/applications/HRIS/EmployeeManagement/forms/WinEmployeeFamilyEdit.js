import {
  WiseWindow,
  WiseLabel,
  WiseButton,
  WiseTextBox,
  WiseComboBox,
  WiseTableLayout,
  WiseFrame,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

import HrisApiRepository from '../services/HrisApiRepository';
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
    this.title = this.recordId ? WiseI18n.t('EDIT_ANGGOTA_KELUARGA_2') : WiseI18n.t('TAMBAH_ANGGOTA_KELUARGA_2');
    this.width = 540;
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    // ── Form Content (4 Fields Only) ────────────────────────────
    const tblFam = new WiseTableLayout({ rows: 2, columns: 2, id: 'tblFamilyEdit', style: { marginBottom: '16px' } });

    this.txtFamName = new WiseTextBox('e.g. Siti Rahmawati', { id: 'txtFamName', datafield: 'name', placeholder: 'e.g. Siti Rahmawati' });
    this.cmbFamGender = new WiseComboBox(GENDERS.map(g => ({ value: g.value, label: WiseI18n.t(g.label) })), { id: 'cmbFamGender', datafield: 'gender', value: 'Laki-laki' });
    this.cmbFamRelation = new WiseComboBox(RELATIONSHIPS.map(r => ({ value: r.value, label: WiseI18n.t(r.label) })), { id: 'cmbFamRelation', datafield: 'relationship', value: 'Anak' });
    this.txtFamPhone = new WiseTextBox('0812xxxxxxxx', { id: 'txtFamPhone', datafield: 'phone', placeholder: '0812xxxxxxxx' });

    // Row 0: Nama & Gender
    tblFam.setCell(0, 0, this.formGroup(WiseI18n.t('NAMA_ANGGOTA_KELUARGA_2'), this.txtFamName));
    tblFam.setCell(0, 1, this.formGroup(WiseI18n.t('JENIS_KELAMIN'), this.cmbFamGender));

    // Row 1: Hubungan & Nomor Kontak
    tblFam.setCell(1, 0, this.formGroup(WiseI18n.t('HUBUNGAN_KELUARGA'), this.cmbFamRelation));
    tblFam.setCell(1, 1, this.formGroup(WiseI18n.t('NOMOR_KONTAK'), this.txtFamPhone));

    this.addControl(tblFam);

    if (this.record) {
      this.populate(this.record);
    }

    // ── Action Buttons ──────────────────────────────────────────
    const actionFrame = new WiseFrame('', {
      id: 'frameFamActions',
      style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' }
    });
    actionFrame.addControl(new WiseButton(WiseI18n.t('SIMPAN_4'), {
      id: 'btnSaveFamily',
      onClick: this.onSaveClick.bind(this),
      style: { marginRight: '8px' }
    }));
    actionFrame.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnCancelFamily',
      onClick: this.onCancelClick.bind(this),
      style: {
        background: '#e2e8f0',
        color: '#334155'
      }
    }));
    this.addControl(actionFrame);
  }

  formGroup(labelText, control) {
    const frame = new WiseFrame('', { style: { background: 'transparent', border: 'none', padding: '0 6px 8px 6px' } });
    const resolvedLabel = typeof WiseI18n !== 'undefined' ? WiseI18n.t(labelText) : labelText;
    frame.addControl(new WiseLabel(resolvedLabel, { style: { display: 'block', marginBottom: '2px', lineHeight: '1.2', fontWeight: '500', color: 'var(--dark-text)' } }));
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
    const name = (values.name || '').trim();
    if (!name) {
      this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('NAMA_ANGGOTA_KELUARGA_WAJIB_DIISI'), 'warning');
      return;
    }

    try {
      const payload = {
        name,
        gender: values.gender || 'Laki-laki',
        relationship: values.relationship || 'Anak',
        phone: (values.phone || '').trim() || null
      };

      if (this.recordId) {
        await api.updateFamilyMember(this.recordId, payload);
        this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('DATA_ANGGOTA_KELUARGA_BERHASIL_DIPERBARUI'), 'success');
      } else {
        await api.addFamilyMember(this.employeeId, payload);
        this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('DATA_ANGGOTA_KELUARGA_BERHASIL_DITAMBAHKAN'), 'success');
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
      this.showInfo(WiseI18n.t('ERROR'), `${WiseI18n.t('GAGAL_MENYIMPAN')}: ${err.message}`, 'error');
    }
  }

  onCancelClick() {
    this.close();
  }
}

export default WinEmployeeFamilyEdit;
