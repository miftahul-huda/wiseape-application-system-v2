import {
  WiseWindow,
  WiseButton,
  WiseTextBox,
  WiseNumericBox,
  WiseDate,
  WiseTableLayout,
  WiseFrame,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

import HrisApiRepository from '../services/HrisApiRepository';
const api = new HrisApiRepository();

class WinEmployeeExperienceEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.record = options.data || null;
    this.employeeId = options.employeeId || (this.record && this.record.employeeId) || (options.parentWindow && (options.parentWindow.selectedEmployeeId || options.parentWindow.employeeId)) || null;
    this.recordId = (this.record && this.record.id) || null;
    this.title = this.recordId ? WiseI18n.t('EDIT_PENGALAMAN_KERJA') : WiseI18n.t('TAMBAH_PENGALAMAN_KERJA');
    this.width = 620;
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    // ── Form Content ────────────────────────────────────────────
    const tblExp = new WiseTableLayout({ rows: 4, columns: 2, id: 'tblExpEdit', style: { marginBottom: '16px' } });

    const currPrefix = typeof WiseI18n !== 'undefined' && WiseI18n ? WiseI18n.getCurrencyPrefix() : 'Rp ';

    this.txtExpCompany = new WiseTextBox('', { id: 'txtExpCompany', datafield: 'companyName', placeholder: WiseI18n.t('E_G_PT_TELEKOMUNIKASI_INDONESIA') });
    this.txtExpPosition = new WiseTextBox('', { id: 'txtExpPosition', datafield: 'position', placeholder: WiseI18n.t('E_G_SENIOR_SOFTWARE_ENGINEER') });
    this.dtExpStart = new WiseDate('', { id: 'dtExpStart', datafield: 'startDate' });
    this.dtExpEnd = new WiseDate('', { id: 'dtExpEnd', datafield: 'endDate' });
    this.numExpLastSalary = new WiseNumericBox('0', { id: 'numExpLastSalary', datafield: 'lastSalary', value: 0, prefix: currPrefix });
    this.txtExpDesc = new WiseTextBox('', { id: 'txtExpDesc', datafield: 'description', placeholder: WiseI18n.t('TANGGUNG_JAWAB_UTAMA') });

    tblExp.setCell(0, 0, this.formGroup(WiseI18n.t('NAMA_PERUSAHAAN'), this.txtExpCompany));
    tblExp.setCell(0, 1, this.formGroup(WiseI18n.t('POSISI_JABATAN'), this.txtExpPosition));
    tblExp.setCell(1, 0, this.formGroup(WiseI18n.t('TANGGAL_MULAI'), this.dtExpStart));
    tblExp.setCell(1, 1, this.formGroup(WiseI18n.t('TANGGAL_SELESAI'), this.dtExpEnd));
    tblExp.setCell(2, 0, this.formGroup(WiseI18n.t('GAJI_TERAKHIR_RP'), this.numExpLastSalary));
    tblExp.setCell(2, 1, this.formGroup(WiseI18n.t('KETERANGAN_TANGGUNG_JAWAB'), this.txtExpDesc));
    this.addControl(tblExp);

    if (this.record) {
      this.populate(this.record);
    }

    // ── Action Buttons ──────────────────────────────────────────
    const actionFrame = new WiseFrame('', {
      id: 'frameExpActions',
      style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' }
    });
    actionFrame.addControl(new WiseButton(WiseI18n.t('SIMPAN_PENGALAMAN_2'), {
      id: 'btnSaveExp',
      onClick: this.onSaveClick.bind(this),
      style: { marginRight: '8px' }
    }));
    actionFrame.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnCancelExp',
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
    const company = (values.companyName || '').trim();
    const position = (values.position || '').trim();
    if (!company || !position) {
      return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('NAMA_PERUSAHAAN_DAN_POSISI_JABATAN_WAJIB_DIISI'), 'warning');
    }

    const payload = {
      companyName: company,
      position,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      lastSalary: Number(values.lastSalary) || 0,
      description: (values.description || '').trim()
    };

    try {
      if (this.recordId) {
        await api.updateWorkExperience(this.recordId, payload);
        this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('DATA_PENGALAMAN_KERJA_BERHASIL_DIPERBARUI'), 'success');
      } else {
        await api.addWorkExperience(this.employeeId, payload);
        this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('RIWAYAT_PENGALAMAN_KERJA_BERHASIL_DITAMBAHKAN'), 'success');
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

export default WinEmployeeExperienceEdit;
