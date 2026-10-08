const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseComboBox = require('../../../../system/controls/WiseComboBox');
const WiseDate = require('../../../../system/controls/WiseDate');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseFrame = require('../../../../system/controls/WiseFrame');
const WiseI18n = typeof window !== 'undefined' && window.WiseI18n ? window.WiseI18n : require('../../../../system/WiseI18n');

const HrisApiRepository = require('../services/HrisApiRepository');
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
    
    this.cmbDocType = new WiseComboBox(DOC_TYPES.map(d => ({ value: d, label: WiseI18n.t(d) })), { id: 'cmbDocType', value: this.record?.documentType || 'KTP' });
    this.txtDocNumber = new WiseTextBox(WiseI18n.t('NOMOR_KTP_NPWP_NO_KONTRAK'), { id: 'txtDocNumber', value: this.record?.documentNumber || '', placeholder: WiseI18n.t('NOMOR_KTP_NPWP_NO_KONTRAK') });
    this.txtDocTitle = new WiseTextBox(WiseI18n.t('E_G_SCAN_KTP_ASLI'), { id: 'txtDocTitle', value: this.record?.title || '', placeholder: WiseI18n.t('E_G_SCAN_KTP_ASLI') });
    this.dtDocIssueDate = new WiseDate(this.record?.issueDate || '', { id: 'dtDocIssueDate', value: this.record?.issueDate || '' });
    this.dtDocExpiryDate = new WiseDate(this.record?.expiryDate || '', { id: 'dtDocExpiryDate', value: this.record?.expiryDate || '' });
    this.txtDocDesc = new WiseTextBox(WiseI18n.t('KETERANGAN_DOKUMEN_2'), { id: 'txtDocDesc', value: this.record?.description || '', placeholder: WiseI18n.t('KETERANGAN_DOKUMEN_2') });

    tblDoc.setCell(0, 0, this.formGroup(WiseI18n.t('JENIS_DOKUMEN_2'), this.cmbDocType));
    tblDoc.setCell(0, 1, this.formGroup(WiseI18n.t('NOMOR_DOKUMEN'), this.txtDocNumber));
    tblDoc.setCell(1, 0, this.formGroup(WiseI18n.t('JUDUL_DOKUMEN'), this.txtDocTitle), { colSpan: 2 });
    tblDoc.setCell(2, 0, this.formGroup(WiseI18n.t('TANGGAL_TERBIT'), this.dtDocIssueDate));
    tblDoc.setCell(2, 1, this.formGroup(WiseI18n.t('TANGGAL_BERAKHIR'), this.dtDocExpiryDate));
    tblDoc.setCell(3, 0, this.formGroup(WiseI18n.t('KETERANGAN_CATATAN'), this.txtDocDesc), { colSpan: 2 });
    this.addControl(tblDoc);

    // ── Action Buttons ──────────────────────────────────────────
    const actionFrame = new WiseFrame('', {
      id: 'frameDocActions',
      style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' }
    });
    actionFrame.addControl(new WiseButton(WiseI18n.t('SIMPAN_DOKUMEN_2'), {
      id: 'btnSaveDoc',
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
      id: 'btnCancelDoc',
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
    const title = this.txtDocTitle ? this.txtDocTitle.value : '';
    if (!title) {
      return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('JUDUL_DOKUMEN_WAJIB_DIISI'), 'warning');
    }

    const payload = {
      documentType: this.cmbDocType ? this.cmbDocType.value : 'KTP',
      title,
      documentNumber: this.txtDocNumber ? this.txtDocNumber.value : '',
      issueDate: (this.dtDocIssueDate ? this.dtDocIssueDate.value : null) || null,
      expiryDate: (this.dtDocExpiryDate ? this.dtDocExpiryDate.value : null) || null,
      description: this.txtDocDesc ? this.txtDocDesc.value : ''
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

module.exports = WinEmployeeDocumentEdit;
