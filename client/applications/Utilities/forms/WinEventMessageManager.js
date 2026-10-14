import {
  WiseWindow,
  WiseButton,
  WiseComboBox,
  WiseDataTable,
  WiseTabControl,
  WiseTextBox,
  WiseTextArea,
  WiseLabel,
  WiseFrame,
  WiseI18n,
} from '../../../src/runtime/wise.js';

import WinTopicWebhookEdit from './WinTopicWebhookEdit';

import EventMessagingApiRepository from '../services/EventMessagingApiRepository';
const api = new EventMessagingApiRepository();

const GREY_BUTTON = { background: '#e2e8f0', color: '#334155' };
const DANGER_BUTTON = { background: '#dc2626', color: '#ffffff' };
const PAGE_SIZE = 12;
const DELIVERY_LIMIT = 100;

// Event Messaging manager: webhooks (topic -> url), delivery log, send a test message.
class WinEventMessageManager extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = WiseI18n.t('EM_APP_TITLE');
    this.appTitle = options.appTitle || WiseI18n.t('EM_APP_TITLE');
    this.appIcon = options.appIcon || '📨';
    this.width = options.width || '85%';
    this.height = options.height || 700;
    this.positionX = options.positionX !== undefined ? options.positionX : 70;
    this.positionY = options.positionY !== undefined ? options.positionY : 50;

    this.allWebhooks = []; // every webhook, unfiltered (topic filter list + url lookup)
    this.rowsWebhooks = []; // filtered, unpaged
    this.rowsDeliveries = [];
  }

  onWindowInit() {
    this.controls = [];

    const tabs = new WiseTabControl({ id: 'tabsEventMessage', layout: 'horizontal', activeIndex: 0 });

    // ── Webhooks tab ─────────────────────────────────────────────
    this.cmbTopicFilter = new WiseComboBox([{ value: '', label: WiseI18n.t('SEMUA') }], {
      id: 'cmbTopicFilter', label: WiseI18n.t('EM_LBL_TOPIC'), value: '', style: { width: '280px' },
      onChange: () => this.applyWebhookFilter()
    });
    this.dtWebhooks = new WiseDataTable({
      id: 'dtWebhooks', pageSize: PAGE_SIZE, maxHeight: '55vh',
      onDataFilterChanged: (size, page) => this.showPage(this.dtWebhooks, this.rowsWebhooks, size, page)
    });
    this.dtWebhooks.setColumns([
      { dataField: 'topic', header: WiseI18n.t('EM_COL_TOPIC'), width: 240 },
      { dataField: 'url', header: WiseI18n.t('UT_COL_URL'), width: 340 },
      { dataField: 'description', header: WiseI18n.t('KETERANGAN'), width: 240 },
      { dataField: 'activeMark', header: WiseI18n.t('EM_COL_ACTIVE'), width: 90 },
      { dataField: 'secretMark', header: WiseI18n.t('EM_COL_SECRET'), width: 90 }
    ]);
    this.dtWebhooks.addContextMenu([
      { id: 'edit', label: WiseI18n.t('EDIT'), onClick: (row) => this.onEditClick(row) },
      { id: 'test', label: WiseI18n.t('EM_TEST'), onClick: (row) => this.onTestClick(row) },
      { id: 'delete', label: WiseI18n.t('HAPUS'), onClick: (row) => this.onDeleteClick(row) }
    ]);
    const webhookBar = this.toolbar('Webhook', this.cmbTopicFilter);
    webhookBar.addControl(new WiseButton(WiseI18n.t('UT_ADD'), { id: 'btnWebhookAdd', onClick: () => this.onAddClick() }));
    webhookBar.addControl(new WiseButton(WiseI18n.t('EDIT'), { id: 'btnWebhookEdit', onClick: () => this.onEditClick(), style: GREY_BUTTON }));
    webhookBar.addControl(new WiseButton(WiseI18n.t('HAPUS'), { id: 'btnWebhookDelete', onClick: () => this.onDeleteClick(), style: DANGER_BUTTON }));
    webhookBar.addControl(new WiseButton(WiseI18n.t('EM_TEST'), { id: 'btnWebhookTest', onClick: () => this.onTestClick() }));
    webhookBar.addControl(new WiseButton(WiseI18n.t('REFRESH'), { id: 'btnWebhookRefresh', onClick: () => this.loadInitialData(), style: GREY_BUTTON }));
    tabs.addTab({ id: 'tabWebhooks', label: WiseI18n.t('EM_TAB_WEBHOOKS'), controls: [webhookBar, this.dtWebhooks] });

    // ── Delivery log tab ─────────────────────────────────────────
    this.cmbStatusFilter = new WiseComboBox([
      { value: '', label: WiseI18n.t('SEMUA') },
      { value: 'success', label: WiseI18n.t('EM_STATUS_SUCCESS') },
      { value: 'failed', label: WiseI18n.t('EM_STATUS_FAILED') }
    ], {
      id: 'cmbStatusFilter', label: WiseI18n.t('STATUS'), value: '', style: { width: '200px' },
      onChange: () => this.loadDeliveries()
    });
    this.dtDeliveries = new WiseDataTable({
      id: 'dtDeliveries', pageSize: PAGE_SIZE, maxHeight: '55vh',
      onDataFilterChanged: (size, page) => this.showPage(this.dtDeliveries, this.rowsDeliveries, size, page)
    });
    this.dtDeliveries.setColumns([
      { dataField: 'timeText', header: WiseI18n.t('EM_COL_TIME'), width: 160 },
      { dataField: 'topic', header: WiseI18n.t('EM_COL_TOPIC'), width: 200 },
      { dataField: 'webhookUrl', header: WiseI18n.t('EM_COL_WEBHOOK'), width: 280 },
      { dataField: 'statusLabel', header: WiseI18n.t('STATUS'), width: 90 },
      { dataField: 'httpStatus', header: WiseI18n.t('EM_COL_HTTP'), width: 80 },
      { dataField: 'attempts', header: WiseI18n.t('EM_COL_ATTEMPTS'), width: 80 },
      { dataField: 'durationText', header: WiseI18n.t('EM_COL_DURATION'), width: 100 },
      { dataField: 'error', header: WiseI18n.t('EM_COL_ERROR'), width: 280 }
    ]);
    const deliveryBar = this.toolbar('Delivery', this.cmbStatusFilter);
    deliveryBar.addControl(new WiseButton(WiseI18n.t('REFRESH'), { id: 'btnDeliveryRefresh', onClick: () => this.loadDeliveries(), style: GREY_BUTTON }));
    tabs.addTab({ id: 'tabDeliveries', label: WiseI18n.t('EM_TAB_DELIVERIES'), controls: [deliveryBar, this.dtDeliveries] });

    // ── Send message tab ─────────────────────────────────────────
    // WiseComboBox cannot take free text, so the topic textbox is the value that is sent;
    // picking a Kafka topic in the combobox simply fills it in.
    this.lblHealth = new WiseLabel('', { id: 'lblHealth' });
    this.cmbSendTopics = new WiseComboBox([{ value: '', label: WiseI18n.t('EM_PICK_TOPIC') }], {
      id: 'cmbSendTopics', label: WiseI18n.t('EM_LBL_EXISTING_TOPIC'), value: '', style: { width: '100%' },
      onChange: () => { if (this.cmbSendTopics.value) this.txtSendTopic.setValue(this.cmbSendTopics.value); }
    });
    this.txtSendTopic = new WiseTextBox('', {
      id: 'txtSendTopic', label: WiseI18n.t('EM_LBL_TOPIC'), placeholder: 'wiseape.employee.created', style: { width: '100%' }
    });
    this.txtSendKey = new WiseTextBox('', {
      id: 'txtSendKey', label: WiseI18n.t('EM_LBL_KEY'), placeholder: WiseI18n.t('EM_KEY_HINT'), style: { width: '100%' }
    });
    this.txtSendPayload = new WiseTextArea('', {
      id: 'txtSendPayload', label: WiseI18n.t('EM_LBL_PAYLOAD'), placeholder: '{"hello":"world"}', rows: 8, style: { width: '100%' }
    });
    this.lblSendStatus = new WiseLabel('', { id: 'lblSendStatus' });
    const sendActions = new WiseFrame('', {
      id: 'frameSendActions',
      style: { display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '12px' }
    });
    sendActions.addControl(new WiseButton(WiseI18n.t('EM_SEND'), { id: 'btnSendMessage', onClick: () => this.onSendClick() }));
    sendActions.addControl(new WiseButton(WiseI18n.t('REFRESH'), { id: 'btnSendRefresh', onClick: () => this.loadInitialData(), style: GREY_BUTTON }));
    sendActions.addControl(this.lblSendStatus);
    tabs.addTab({
      id: 'tabSend', label: WiseI18n.t('EM_TAB_SEND'),
      controls: [this.lblHealth, this.cmbSendTopics, this.txtSendTopic, this.txtSendKey, this.txtSendPayload, sendActions]
    });

    this.addControl(tabs);
    return this;
  }

  // Row container for a tab's buttons / filters
  toolbar(name, leadingControl) {
    const bar = new WiseFrame('', {
      id: `frameToolbar${name}`,
      style: { display: 'flex', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap', border: 'none', background: 'transparent', padding: '0 0 8px 0' }
    });
    if (leadingControl) bar.addControl(leadingControl);
    return bar;
  }

  // ── Data loading ──────────────────────────────────────────────
  async loadInitialData() {
    this.lblHealth.text(WiseI18n.t('EM_LOADING'));
    await this.refresh();
    try {
      this.allWebhooks = await api.listWebhooks();
      this.updateTopicFilter();
      this.applyWebhookFilter();
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR_KONEKSI_BACKEND'), err.message, 'error');
    }
    await this.loadDeliveries(true);
    await this.loadTopics();
    await this.loadHealth();
  }

  // topics that appear in the webhooks, plus "All"
  updateTopicFilter() {
    const current = this.cmbTopicFilter.value || '';
    const topics = [...new Set(this.allWebhooks.map((w) => w.topic))].sort();
    this.cmbTopicFilter.setItems([{ value: '', label: WiseI18n.t('SEMUA') }, ...topics.map((tp) => ({ value: tp, label: tp }))]);
    this.cmbTopicFilter.setValue(topics.includes(current) ? current : '');
  }

  applyWebhookFilter() {
    const topic = this.cmbTopicFilter.value || '';
    this.rowsWebhooks = this.allWebhooks
      .filter((w) => !topic || w.topic === topic)
      .map((w) => ({ ...w, activeMark: w.isActive ? '✔' : '✖', secretMark: w.hasSecret ? '🔑' : '' }));
    this.showPage(this.dtWebhooks, this.rowsWebhooks, this.dtWebhooks.pageSize, 1);
  }

  async loadDeliveries(silent) {
    try {
      const deliveries = await api.listDeliveries({ status: this.cmbStatusFilter.value || undefined, limit: DELIVERY_LIMIT });
      const urlById = new Map(this.allWebhooks.map((w) => [String(w.id), w.url]));
      this.rowsDeliveries = deliveries.map((d) => ({
        ...d,
        timeText: d.createdAt ? new Date(d.createdAt).toLocaleString() : '',
        webhookUrl: urlById.get(String(d.webhookId)) || `#${d.webhookId}`,
        statusLabel: d.status === 'success' ? WiseI18n.t('EM_STATUS_SUCCESS') : WiseI18n.t('EM_STATUS_FAILED'),
        httpStatus: d.httpStatus || '',
        durationText: d.durationMs !== undefined && d.durationMs !== null ? `${d.durationMs} ms` : '',
        error: d.error || ''
      }));
      this.showPage(this.dtDeliveries, this.rowsDeliveries, this.dtDeliveries.pageSize, 1);
    } catch (err) {
      if (!silent) this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  // Kafka topics for the send form; Kafka may be down (503), so failure is tolerated.
  async loadTopics() {
    try {
      const topics = await api.listTopics();
      this.cmbSendTopics.setItems([{ value: '', label: WiseI18n.t('EM_PICK_TOPIC') }, ...topics.map((tp) => ({ value: tp, label: tp }))]);
      this.cmbSendTopics.setValue('');
    } catch (err) { /* keep free-text topic only */ }
  }

  static stateText(value) {
    const ok = value === true || ['up', 'ok', 'connected', 'true'].includes(String(value).toLowerCase());
    return ok ? WiseI18n.t('EM_STATE_OK') : WiseI18n.t('EM_STATE_DOWN');
  }

  async loadHealth() {
    try {
      const h = await api.health();
      const consumer = h.consumer || {};
      const topics = Array.isArray(consumer.topics) ? consumer.topics.length : (consumer.topics || 0);
      this.lblHealth.text(WiseI18n.t('EM_HEALTH_LINE')
        .replace('{db}', WinEventMessageManager.stateText(h.database))
        .replace('{kafka}', WinEventMessageManager.stateText(h.kafkaProducer))
        .replace('{consumer}', consumer.running ? WiseI18n.t('EM_STATE_RUNNING') : WiseI18n.t('EM_STATE_STOPPED'))
        .replace('{topics}', String(topics)));
    } catch (err) {
      this.lblHealth.text(`${WiseI18n.t('EM_HEALTH_UNKNOWN')}: ${err.message}`);
    }
  }

  showPage(table, allRows, pageSize, page) {
    const size = pageSize || PAGE_SIZE;
    const current = page || 1;
    table.pageSize = size;
    table.currentPage = current;
    table.setData(allRows.slice((current - 1) * size, current * size), allRows.length);
  }

  // row from the context menu, otherwise the table's selected row
  pickRow(row) {
    const target = (row && row.id) ? row : this.dtWebhooks.getSelectedRow();
    if (!target || !target.id) {
      this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('EM_MSG_SELECT_WEBHOOK'), 'warning');
      return null;
    }
    return target;
  }

  // ── Webhook actions ───────────────────────────────────────────
  async onAddClick() {
    await this.openWindow(WinTopicWebhookEdit, { webhookId: null, topic: this.cmbTopicFilter.value || '' });
  }

  async onEditClick(row) {
    const target = this.pickRow(row);
    if (!target) return;
    await this.openWindow(WinTopicWebhookEdit, { webhookId: target.id });
  }

  async onDeleteClick(row) {
    const target = this.pickRow(row);
    if (!target) return;
    const confirmed = await this.confirm(
      WiseI18n.t('KONFIRMASI_HAPUS'),
      `${WiseI18n.t('APAKAH_ANDA_YAKIN_INGIN_MENGHAPUS')} "${target.topic} → ${target.url}"?`,
      { type: 'danger', confirmText: WiseI18n.t('YA_HAPUS') }
    );
    if (!confirmed) return;
    try {
      await api.deleteWebhook(target.id);
      this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('EM_MSG_DELETED'), 'success');
      await this.loadInitialData();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENGHAPUS'), err.message, 'error');
    }
  }

  async onTestClick(row) {
    const target = this.pickRow(row);
    if (!target) return;
    this.lblHealth.text(WiseI18n.t('EM_TESTING'));
    await this.refresh();
    try {
      const res = await api.testWebhook(target.id);
      if (res && res.success) {
        this.showInfo(WiseI18n.t('BERHASIL'),
          WiseI18n.t('EM_MSG_TEST_OK').replace('{status}', String(res.httpStatus)).replace('{ms}', String(res.durationMs)), 'success');
      } else {
        const reason = (res && (res.error || (res.httpStatus ? `HTTP ${res.httpStatus}` : ''))) || '';
        this.showInfo(WiseI18n.t('ERROR'), `${WiseI18n.t('EM_MSG_TEST_FAILED')} ${reason}`.trim(), 'error');
      }
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
    await this.loadHealth();
  }

  // ── Send message ──────────────────────────────────────────────
  async onSendClick() {
    const topic = (this.txtSendTopic.value || '').trim();
    const key = (this.txtSendKey.value || '').trim();
    const raw = (this.txtSendPayload.value || '').trim();
    if (!topic) return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('EM_MSG_TOPIC_REQUIRED'), 'warning');
    if (!raw) return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('EM_MSG_PAYLOAD_REQUIRED'), 'warning');

    // JSON when it parses, otherwise sent as plain text
    let payload = raw;
    try { payload = JSON.parse(raw); } catch (e) { /* plain text */ }

    this.lblSendStatus.text(WiseI18n.t('EM_SENDING'));
    await this.refresh();
    try {
      const res = await api.publishMessage({ topic, key: key || undefined, payload });
      this.lblSendStatus.text('');
      this.showInfo(WiseI18n.t('BERHASIL'),
        WiseI18n.t('EM_MSG_SENT').replace('{topic}', String(res.topic)).replace('{partition}', String(res.partition)).replace('{offset}', String(res.offset)), 'success');
    } catch (err) {
      this.lblSendStatus.text('');
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }
}

export default WinEventMessageManager;
