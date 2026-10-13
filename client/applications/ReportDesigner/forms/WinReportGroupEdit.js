import {
  WiseWindow,
  WiseButton,
  WiseTextBox,
  WiseTextArea,
  WiseTableLayout,
  WiseFrame,
  WiseI18n,
} from '../../../src/runtime/wise.js';

import ReportDesignerApiRepository from '../services/ReportDesignerApiRepository';
const api = new ReportDesignerApiRepository();

class WinReportGroupEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.groupId = options.groupId || null;
    this.onSavedCallback = options.onSaved || null;
    this.title = this.groupId ? WiseI18n.t('RD_GROUP_EDIT_TITLE') : WiseI18n.t('RD_GROUP_ADD_TITLE');
    this.width = options.width || 520;
    this.height = options.height || 'auto';
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    const form = new WiseTableLayout({ rows: 2, columns: 1, id: 'tblGroupForm', style: { width: '100%', marginBottom: '16px' } });
    form.setCell(0, 0, new WiseTextBox('', { id: 'txtGroupName', label: WiseI18n.t('RD_LBL_NAME'), datafield: 'name', style: { width: '100%' } }));
    form.setCell(1, 0, new WiseTextArea('', { id: 'txtGroupDescription', label: WiseI18n.t('KETERANGAN'), datafield: 'description', rows: 3, style: { width: '100%' } }));
    this.addControl(form);

    const actions = new WiseFrame('', {
      id: 'frameGroupActions',
      style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }
    });
    actions.addControl(new WiseButton(WiseI18n.t('SIMPAN'), { id: 'btnGroupSave', onClick: this.onSaveClick.bind(this) }));
    actions.addControl(new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnGroupCancel', onClick: () => this.close(),
      style: { background: '#e2e8f0', color: '#334155' }
    }));
    this.addControl(actions);
    return this;
  }

  async onShow() {
    this.visible = true;
    if (!this.groupId) return;
    try {
      const group = await api.getReportGroup(this.groupId);
      this.populate({ name: group.name, description: group.description });
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  async onSaveClick() {
    const v = this.getValues();
    const payload = { name: (v.name || '').trim(), description: (v.description || '').trim() };
    if (!payload.name) {
      return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('RD_MSG_NAME_REQUIRED'), 'warning');
    }
    try {
      if (this.groupId) await api.updateReportGroup(this.groupId, payload);
      else await api.createReportGroup(payload);
      this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('RD_MSG_SAVED'), 'success');
      if (this.onSavedCallback) await this.onSavedCallback();
      else if (this.parentWindow && typeof this.parentWindow.loadInitialData === 'function') await this.parentWindow.loadInitialData();
      this.close();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENYIMPAN'), err.message, 'error');
    }
  }
}

export default WinReportGroupEdit;
