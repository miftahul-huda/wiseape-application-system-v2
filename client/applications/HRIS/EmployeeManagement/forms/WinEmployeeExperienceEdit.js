const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseNumericBox = require('../../../../system/controls/WiseNumericBox');
const WiseDate = require('../../../../system/controls/WiseDate');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseFrame = require('../../../../system/controls/WiseFrame');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

const HrisApiRepository = require('../services/HrisApiRepository');
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

    this.txtExpCompany = new WiseTextBox(WiseI18n.t('E_G_PT_TELEKOMUNIKASI_INDONESIA'), { id: 'txtExpCompany', value: this.record?.companyName || '', placeholder: WiseI18n.t('E_G_PT_TELEKOMUNIKASI_INDONESIA') });
    this.txtExpPosition = new WiseTextBox(WiseI18n.t('E_G_SENIOR_SOFTWARE_ENGINEER'), { id: 'txtExpPosition', value: this.record?.position || '', placeholder: WiseI18n.t('E_G_SENIOR_SOFTWARE_ENGINEER') });
    this.dtExpStart = new WiseDate(this.record?.startDate || '', { id: 'dtExpStart', value: this.record?.startDate || '' });
    this.dtExpEnd = new WiseDate(this.record?.endDate || '', { id: 'dtExpEnd', value: this.record?.endDate || '' });
    this.numExpLastSalary = new WiseNumericBox(String(this.record?.lastSalary || 0), { id: 'numExpLastSalary', value: Number(this.record?.lastSalary || 0), prefix: currPrefix });
    this.txtExpDesc = new WiseTextBox(WiseI18n.t('TANGGUNG_JAWAB_UTAMA'), { id: 'txtExpDesc', value: this.record?.description || '', placeholder: WiseI18n.t('TANGGUNG_JAWAB_UTAMA') });

    tblExp.setCell(0, 0, this.formGroup(WiseI18n.t('NAMA_PERUSAHAAN'), this.txtExpCompany));
    tblExp.setCell(0, 1, this.formGroup(WiseI18n.t('POSISI_JABATAN'), this.txtExpPosition));
    tblExp.setCell(1, 0, this.formGroup(WiseI18n.t('TANGGAL_MULAI'), this.dtExpStart));
    tblExp.setCell(1, 1, this.formGroup(WiseI18n.t('TANGGAL_SELESAI'), this.dtExpEnd));
    tblExp.setCell(2, 0, this.formGroup(WiseI18n.t('GAJI_TERAKHIR_RP'), this.numExpLastSalary));
    tblExp.setCell(2, 1, this.formGroup(WiseI18n.t('KETERANGAN_TANGGUNG_JAWAB'), this.txtExpDesc));
    this.addControl(tblExp);

    // ── Action Buttons ──────────────────────────────────────────
    const actionFrame = new WiseFrame('', {
      id: 'frameExpActions',
      style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' }
    });
    actionFrame.addControl(new WiseButton(WiseI18n.t('SIMPAN_PENGALAMAN_2'), {
      id: 'btnSaveExp',
      onClick: this.onSaveClick.bind(this),
      style: {
        background: 'var(--accent)',
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: '8px',
        padding: '10px 20px',
        border: 'none',
        boxShadow: 'none',
        marginRight: '8px',
        cursor: 'pointer'
      }
    }));
    actionFrame.addControl(new WiseButton(WiseI18n.t('BATAL_3'), {
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
    const frame = new WiseFrame('', { style: { padding: '2px 4px', border: 'none', background: 'transparent' } });
    frame.addControl(new WiseLabel(label, { style: { fontWeight: 600, color: '#475569', marginBottom: '0px', lineHeight: '1.2', display: 'block' } }));
    frame.addControl(control);
    return frame;
  }

  async onSaveClick() {
    const empId = this.employeeId || (this.record && this.record.employeeId) || (this.parentWindow && (this.parentWindow.selectedEmployeeId || this.parentWindow.employeeId));
    if (!empId) {
      return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('DATA_KARYAWAN_BELUM_DITENTUKAN'), 'warning');
    }
    this.employeeId = empId;
    const company = this.txtExpCompany ? this.txtExpCompany.value : '';
    const position = this.txtExpPosition ? this.txtExpPosition.value : '';
    if (!company || !position) {
      return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('NAMA_PERUSAHAAN_DAN_POSISI_JABATAN_WAJIB_DIISI'), 'warning');
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

module.exports = WinEmployeeExperienceEdit;
