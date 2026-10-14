import {
  WiseWindow,
  WiseButton,
  WiseTextBox,
  WiseComboBox,
  WiseCheckboxGroup,
  WiseFrame,
  WiseI18n,
} from '../../../src/runtime/wise.js';

import EventMessagingApiRepository from '../services/EventMessagingApiRepository';
const api = new EventMessagingApiRepository();

const GREY_BUTTON = { background: '#e2e8f0', color: '#334155' };

// Add / edit dialog for one topic -> webhook mapping.
class WinTopicWebhookEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.webhookId = options.webhookId || null;
    this.presetTopic = options.topic || '';
    this.title = this.webhookId ? WiseI18n.t('EM_WEBHOOK_EDIT_TITLE') : WiseI18n.t('EM_WEBHOOK_ADD_TITLE');
    this.width = options.width || 600;
    this.height = options.height || 'auto';
    this.centered = true;
  }

  onWindowInit() {
    this.controls = [];

    this.txtTopic = new WiseTextBox('', {
      id: 'txtWebhookTopic', label: WiseI18n.t('EM_LBL_TOPIC'), datafield: 'topic',
      placeholder: 'wiseape.employee.created', style: { width: '100%' }
    });
    // Optional helper: pick one of the existing Kafka topics to fill the textbox above.
    this.cmbTopics = new WiseComboBox([{ value: '', label: WiseI18n.t('EM_PICK_TOPIC') }], {
      id: 'cmbWebhookTopics', label: WiseI18n.t('EM_LBL_EXISTING_TOPIC'), value: '', style: { width: '100%' },
      onChange: () => this.onTopicPicked()
    });
    this.txtUrl = new WiseTextBox('', {
      id: 'txtWebhookUrl', label: WiseI18n.t('EM_LBL_URL'), datafield: 'url',
      placeholder: 'https://example.com/hooks/events', style: { width: '100%' }
    });
    this.txtDescription = new WiseTextBox('', { id: 'txtWebhookDescription', label: WiseI18n.t('KETERANGAN'), datafield: 'description', style: { width: '100%' } });
    this.txtSecret = new WiseTextBox('', {
      id: 'txtWebhookSecret', label: WiseI18n.t('EM_LBL_SECRET'), datafield: 'secret',
      placeholder: this.webhookId ? WiseI18n.t('EM_SECRET_KEEP_HINT') : WiseI18n.t('EM_SECRET_OPTIONAL_HINT'),
      password: true, style: { width: '100%' }
    });
    this.chkActive = new WiseCheckboxGroup([{ value: '1', label: WiseI18n.t('EM_ACTIVE_OPTION') }], {
      id: 'chkWebhookActive', label: WiseI18n.t('EM_LBL_ACTIVE'), datafield: 'isActive', value: ['1']
    });

    this.addControl(this.txtTopic);
    this.addControl(this.cmbTopics);
    this.addControl(this.txtUrl);
    this.addControl(this.txtDescription);
    this.addControl(this.txtSecret);
    if (this.webhookId) {
      this.chkClearSecret = new WiseCheckboxGroup([{ value: '1', label: WiseI18n.t('EM_CLEAR_SECRET_OPTION') }], {
        id: 'chkWebhookClearSecret', label: WiseI18n.t('EM_LBL_CLEAR_SECRET'), datafield: 'clearSecret', value: []
      });
      this.addControl(this.chkClearSecret);
    }
    this.addControl(this.chkActive);

    const actions = new WiseFrame('', {
      id: 'frameWebhookActions',
      style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', marginTop: '12px', borderTop: '1px solid #e2e8f0' }
    });
    actions.addControl(new WiseButton(WiseI18n.t('SIMPAN'), { id: 'btnWebhookSave', onClick: this.onSaveClick.bind(this) }));
    actions.addControl(new WiseButton(WiseI18n.t('BATAL'), { id: 'btnWebhookCancel', onClick: () => this.close(), style: GREY_BUTTON }));
    this.addControl(actions);
    return this;
  }

  async onShow() {
    this.visible = true;
    if (this.presetTopic && !this.webhookId) this.txtTopic.setValue(this.presetTopic);

    // existing Kafka topics are only a convenience: tolerate the call failing
    try {
      const topics = await api.listTopics();
      this.cmbTopics.setItems([{ value: '', label: WiseI18n.t('EM_PICK_TOPIC') }, ...topics.map((tp) => ({ value: tp, label: tp }))]);
      this.cmbTopics.setValue('');
    } catch (err) { /* Kafka down / API unreachable: keep free-text only */ }

    if (!this.webhookId) return;
    try {
      const hook = await api.getWebhook(this.webhookId);
      this.populate({
        topic: hook.topic,
        url: hook.url,
        description: hook.description || '',
        secret: '',
        clearSecret: [],
        isActive: hook.isActive ? ['1'] : []
      });
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  onTopicPicked() {
    const picked = this.cmbTopics.value;
    if (picked) this.txtTopic.setValue(picked);
  }

  static isChecked(flag) {
    return Array.isArray(flag) ? flag.includes('1') : !!flag;
  }

  buildPayload() {
    const v = this.getValues();
    const payload = {
      topic: (v.topic || '').trim(),
      url: (v.url || '').trim(),
      description: (v.description || '').trim(),
      secret: v.secret || '',
      isActive: WinTopicWebhookEdit.isChecked(v.isActive)
    };
    if (this.webhookId) payload.clearSecret = WinTopicWebhookEdit.isChecked(v.clearSecret);
    return payload;
  }

  validate(payload) {
    if (!payload.topic) return 'EM_MSG_TOPIC_REQUIRED';
    if (!payload.url) return 'EM_MSG_URL_REQUIRED';
    if (!/^https?:\/\/\S+$/i.test(payload.url)) return 'EM_MSG_URL_INVALID';
    return null;
  }

  async onSaveClick() {
    const payload = this.buildPayload();
    const problem = this.validate(payload);
    if (problem) return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t(problem), 'warning');
    try {
      if (this.webhookId) {
        await api.updateWebhook(this.webhookId, payload);
      } else {
        await api.createWebhook(payload);
      }
      this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('EM_MSG_SAVED'), 'success');
      if (this.parentWindow && typeof this.parentWindow.loadInitialData === 'function') await this.parentWindow.loadInitialData();
      this.close();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENYIMPAN'), err.message, 'error');
    }
  }
}

export default WinTopicWebhookEdit;
