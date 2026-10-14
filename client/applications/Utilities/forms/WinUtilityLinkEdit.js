import {
  WiseWindow,
  WiseButton,
  WiseTextBox,
  WiseCheckboxGroup,
  WiseFrame,
  WiseI18n,
} from '../../../src/runtime/wise.js';

import UtilitiesApiRepository from '../services/UtilitiesApiRepository';
const api = new UtilitiesApiRepository();

const GREY_BUTTON = { background: '#e2e8f0', color: '#334155' };

// Add / edit dialog for one link.
class WinUtilityLinkEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.linkId = options.linkId || null;
    this.linkType = options.linkType;
    this.title = this.linkId ? WiseI18n.t('UT_LINK_EDIT_TITLE') : WiseI18n.t('UT_LINK_ADD_TITLE');
    this.width = options.width || 560;
    this.height = options.height || 'auto';
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    this.txtName = new WiseTextBox('', { id: 'txtLinkName', label: WiseI18n.t('UT_LBL_NAME'), datafield: 'name', style: { width: '100%' } });
    this.txtUrl = new WiseTextBox('', {
      id: 'txtLinkUrl', label: WiseI18n.t('UT_LBL_URL'), datafield: 'url',
      placeholder: 'http://localhost:8002', style: { width: '100%' }
    });
    this.txtDescription = new WiseTextBox('', { id: 'txtLinkDescription', label: WiseI18n.t('KETERANGAN'), datafield: 'description', style: { width: '100%' } });
    this.chkDefault = new WiseCheckboxGroup([{ value: '1', label: WiseI18n.t('UT_DEFAULT_OPTION') }], {
      id: 'chkLinkDefault', label: WiseI18n.t('UT_LBL_DEFAULT'), datafield: 'isDefault', value: []
    });
    this.addControl(this.txtName);
    this.addControl(this.txtUrl);
    this.addControl(this.txtDescription);
    this.addControl(this.chkDefault);

    const actions = new WiseFrame('', {
      id: 'frameLinkActions',
      style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', marginTop: '12px', borderTop: '1px solid #e2e8f0' }
    });
    actions.addControl(new WiseButton(WiseI18n.t('SIMPAN'), { id: 'btnLinkSave', onClick: this.onSaveClick.bind(this) }));
    actions.addControl(new WiseButton(WiseI18n.t('BATAL'), { id: 'btnLinkCancel', onClick: () => this.close(), style: GREY_BUTTON }));
    this.addControl(actions);
    return this;
  }

  async onShow() {
    this.visible = true;
    if (!this.linkId) return;
    try {
      const link = await api.getLink(this.linkId);
      this.linkType = link.type || this.linkType;
      this.populate({
        name: link.name,
        url: link.url,
        description: link.description || '',
        isDefault: link.isDefault ? ['1'] : []
      });
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  buildPayload() {
    const v = this.getValues();
    const flag = v.isDefault;
    return {
      name: (v.name || '').trim(),
      url: (v.url || '').trim(),
      description: (v.description || '').trim(),
      isDefault: Array.isArray(flag) ? flag.includes('1') : !!flag
    };
  }

  validate(payload) {
    if (!payload.name) return 'UT_MSG_NAME_REQUIRED';
    if (!payload.url) return 'UT_MSG_URL_REQUIRED';
    if (!/^https?:\/\/\S+$/i.test(payload.url)) return 'UT_MSG_URL_INVALID';
    return null;
  }

  async onSaveClick() {
    const payload = this.buildPayload();
    const problem = this.validate(payload);
    if (problem) return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t(problem), 'warning');
    try {
      if (this.linkId) {
        await api.updateLink(this.linkId, payload);
      } else {
        await api.createLink({ ...payload, type: this.linkType });
      }
      this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('UT_MSG_SAVED'), 'success');
      if (this.parentWindow && typeof this.parentWindow.loadInitialData === 'function') await this.parentWindow.loadInitialData();
      this.close();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENYIMPAN'), err.message, 'error');
    }
  }
}

export default WinUtilityLinkEdit;
