import {
  WiseWindow,
  WiseLabel,
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

const DOC_TYPES = ['KTP', 'KK', 'NPWP', 'Kontrak Kerja', 'Sertifikat', 'Ijazah', 'Lisensi Profesi', 'Lainnya'];

class WinEmployeeDocumentEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.record = options.data || null;
    this.employeeId = options.employeeId || (this.record && this.record.employeeId) || (options.parentWindow && (options.parentWindow.selectedEmployeeId || options.parentWindow.employeeId)) || null;
    this.recordId = (this.record && this.record.id) || null;
    this.title = this.recordId ? WiseI18n.t('EDIT_DOKUMEN_KARYAWAN') : WiseI18n.t('TAMBAH_DOKUMEN_BARU');
    this.width = 620;
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    // ── Form Content ────────────────────────────────────────────
    const tblDoc = new WiseTableLayout({ rows: 4, columns: 2, id: 'tblDocEdit', style: { marginBottom: '16px' } });

    this.cmbDocType = new WiseComboBox(DOC_TYPES.map(d => ({ value: d, label: WiseI18n.t(d) })), { id: 'cmbDocType', datafield: 'documentType', value: 'KTP' });
    this.txtDocNumber = new WiseTextBox(WiseI18n.t('NOMOR_KTP_NPWP_NO_KONTRAK'), { id: 'txtDocNumber', datafield: 'documentNumber', placeholder: WiseI18n.t('NOMOR_KTP_NPWP_NO_KONTRAK') });
    this.txtDocTitle = new WiseTextBox(WiseI18n.t('E_G_SCAN_KTP_ASLI'), { id: 'txtDocTitle', datafield: 'title', placeholder: WiseI18n.t('E_G_SCAN_KTP_ASLI') });
    this.dtDocIssueDate = new WiseDate('', { id: 'dtDocIssueDate', datafield: 'issueDate' });
    this.dtDocExpiryDate = new WiseDate('', { id: 'dtDocExpiryDate', datafield: 'expiryDate' });
    this.txtDocDesc = new WiseTextBox(WiseI18n.t('KETERANGAN_DOKUMEN_2'), { id: 'txtDocDesc', datafield: 'description', placeholder: WiseI18n.t('KETERANGAN_DOKUMEN_2') });

    tblDoc.setCell(0, 0, this.formGroup(WiseI18n.t('JENIS_DOKUMEN_2'), this.cmbDocType));
    tblDoc.setCell(0, 1, this.formGroup(WiseI18n.t('NOMOR_DOKUMEN'), this.txtDocNumber));
    tblDoc.setCell(1, 0, this.formGroup(WiseI18n.t('JUDUL_DOKUMEN'), this.txtDocTitle), { colSpan: 2 });
    tblDoc.setCell(2, 0, this.formGroup(WiseI18n.t('TANGGAL_TERBIT'), this.dtDocIssueDate));
    tblDoc.setCell(2, 1, this.formGroup(WiseI18n.t('TANGGAL_BERAKHIR'), this.dtDocExpiryDate));
    tblDoc.setCell(3, 0, this.formGroup(WiseI18n.t('KETERANGAN_CATATAN'), this.txtDocDesc), { colSpan: 2 });
    this.addControl(tblDoc);

    if (this.record) {
      this.populate(this.record);
    }

    // ── Action Buttons ──────────────────────────────────────────
    const actionFrame = new WiseFrame('', {
      id: 'frameDocActions',
      style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' }
    });
    actionFrame.addControl(new WiseButton(WiseI18n.t('SIMPAN_DOKUMEN_2'), {
      id: 'btnSaveDoc',
      onClick: this.onSaveClick.bind(this),
      style: { marginRight: '8px' }
    }));
    actionFrame.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnCancelDoc',
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
    frame.addControl(new WiseLabel(resolvedLabel, { style: { fontWeight: 600, color: '#475569', marginBottom: '0px', lineHeight: '1.2', display: 'block' } }));
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
    const title = (values.title || '').trim();
    if (!title) {
      return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('JUDUL_DOKUMEN_WAJIB_DIISI'), 'warning');
    }

    const payload = {
      documentType: values.documentType || 'KTP',
      title,
      documentNumber: (values.documentNumber || '').trim(),
      issueDate: values.issueDate || null,
      expiryDate: values.expiryDate || null,
      description: (values.description || '').trim()
    };

    try {
      if (this.recordId) {
        await api.updateDocument(this.recordId, payload);
        this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('DATA_DOKUMEN_BERHASIL_DIPERBARUI'), 'success');
      } else {
        await api.addDocument(this.employeeId, payload);
        this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('DOKUMEN_BARU_BERHASIL_DITAMBAHKAN'), 'success');
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

export default WinEmployeeDocumentEdit;
