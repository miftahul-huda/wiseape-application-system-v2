const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseButton = require('../../../../system/controls/WiseButton');
const WiseTextBox = require('../../../../system/controls/WiseTextBox');
const WiseComboBox = require('../../../../system/controls/WiseComboBox');
const WiseDate = require('../../../../system/controls/WiseDate');
const WiseTableLayout = require('../../../../system/controls/WiseTableLayout');
const WiseFrame = require('../../../../system/controls/WiseFrame');

const HrisApiRepository = require('../services/HrisApiRepository');
const api = new HrisApiRepository();

const DOC_TYPES = ['KTP', 'KK', 'NPWP', 'Kontrak Kerja', 'Sertifikat', 'Ijazah', 'Lisensi Profesi', 'Lainnya'];

class WinEmployeeDocumentEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.employeeId = options.employeeId || null;
    this.record = options.data || null;
    this.recordId = (this.record && this.record.id) || null;
    this.title = this.recordId ? 'Edit Dokumen Karyawan' : 'Tambah Dokumen Baru';
    this.width = 620;
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    // ── Form Content ────────────────────────────────────────────
    const tblDoc = new WiseTableLayout({ rows: 4, columns: 2, id: 'tblDocEdit', style: { marginBottom: '16px' } });
    
    this.cmbDocType = new WiseComboBox(DOC_TYPES.map(d => ({ value: d, label: d })), { id: 'cmbDocType', value: this.record?.documentType || 'KTP' });
    this.txtDocNumber = new WiseTextBox('Nomor KTP/NPWP/No Kontrak', { id: 'txtDocNumber', value: this.record?.documentNumber || '', placeholder: 'Nomor KTP/NPWP/No Kontrak' });
    this.txtDocTitle = new WiseTextBox('e.g. Scan KTP Asli', { id: 'txtDocTitle', value: this.record?.title || '', placeholder: 'e.g. Scan KTP Asli' });
    this.dtDocIssueDate = new WiseDate(this.record?.issueDate || '', { id: 'dtDocIssueDate', value: this.record?.issueDate || '' });
    this.dtDocExpiryDate = new WiseDate(this.record?.expiryDate || '', { id: 'dtDocExpiryDate', value: this.record?.expiryDate || '' });
    this.txtDocDesc = new WiseTextBox('Keterangan dokumen...', { id: 'txtDocDesc', value: this.record?.description || '', placeholder: 'Keterangan dokumen...' });

    tblDoc.setCell(0, 0, this.formGroup('Jenis Dokumen *', this.cmbDocType));
    tblDoc.setCell(0, 1, this.formGroup('Nomor Dokumen', this.txtDocNumber));
    tblDoc.setCell(1, 0, this.formGroup('Judul Dokumen *', this.txtDocTitle), { colSpan: 2 });
    tblDoc.setCell(2, 0, this.formGroup('Tanggal Terbit', this.dtDocIssueDate));
    tblDoc.setCell(2, 1, this.formGroup('Tanggal Berakhir', this.dtDocExpiryDate));
    tblDoc.setCell(3, 0, this.formGroup('Keterangan / Catatan', this.txtDocDesc), { colSpan: 2 });
    this.addControl(tblDoc);

    // ── Action Buttons ──────────────────────────────────────────
    const actionFrame = new WiseFrame('', { style: { background: 'transparent', border: 'none', padding: '0', textAlign: 'right' } });
    actionFrame.addControl(new WiseButton('💾 Simpan Dokumen', {
      id: 'btnSaveDoc',
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
    const frame = new WiseFrame('', { style: { padding: '4px 6px', border: 'none', background: 'transparent' } });
    frame.addControl(new WiseLabel(label, { style: { fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' } }));
    frame.addControl(control);
    return frame;
  }

  async onSaveClick() {
    if (!this.employeeId) {
      return this.showInfo('Peringatan', 'Data karyawan belum ditentukan.', 'warning');
    }
    const title = this.txtDocTitle ? this.txtDocTitle.value : '';
    if (!title) {
      return this.showInfo('Validasi', 'Judul dokumen wajib diisi.', 'warning');
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
        this.showInfo('Berhasil', 'Data dokumen berhasil diperbarui.', 'success');
      } else {
        await api.addDocument(this.employeeId, payload);
        this.showInfo('Berhasil', 'Dokumen baru berhasil ditambahkan.', 'success');
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

module.exports = WinEmployeeDocumentEdit;
