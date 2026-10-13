import {
  WiseWindow,
  WiseButton,
  WiseTextBox,
  WiseNumericBox,
  WiseComboBox,
  WiseTableLayout,
  WiseFrame,
  WiseI18n,
} from '../../../src/runtime/wise.js';

import ReportDesignerApiRepository from '../services/ReportDesignerApiRepository';
const api = new ReportDesignerApiRepository();

class WinConnectionEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.connectionId = options.connectionId || null;
    this.onSavedCallback = options.onSaved || null;
    this.title = this.connectionId ? WiseI18n.t('RD_CONNECTION_EDIT_TITLE') : WiseI18n.t('RD_CONNECTION_ADD_TITLE');
    this.width = options.width || 620;
    this.height = options.height || 'auto';
    this.centered = true;
    this.databaseTypes = [];
    this.hasStoredPassword = false;
  }

  onWindowInit() {
    this.controls = [];

    const form = new WiseTableLayout({ rows: 5, columns: 2, id: 'tblConnectionForm', style: { width: '100%', marginBottom: '16px' } });

    this.txtName = new WiseTextBox('', { id: 'txtConnName', label: WiseI18n.t('RD_LBL_NAME'), datafield: 'name', style: { width: '100%' } });
    this.cmbDbType = new WiseComboBox([], {
      id: 'cmbConnDbType', label: WiseI18n.t('RD_LBL_DB_TYPE'), datafield: 'databaseTypeId', style: { width: '100%' },
      onChange: this.onDatabaseTypeChanged.bind(this)
    });
    this.txtHost = new WiseTextBox('', { id: 'txtConnHost', value: 'localhost', label: WiseI18n.t('RD_LBL_HOST'), datafield: 'host', style: { width: '100%' } });
    this.numPort = new WiseNumericBox('', { id: 'numConnPort', label: WiseI18n.t('RD_LBL_PORT'), datafield: 'port', value: 0, style: { width: '100%' } });
    this.txtDatabase = new WiseTextBox('', { id: 'txtConnDatabase', label: WiseI18n.t('RD_LBL_DATABASE'), datafield: 'databaseName', style: { width: '100%' } });
    this.txtUser = new WiseTextBox('', { id: 'txtConnUser', label: WiseI18n.t('RD_LBL_USERNAME'), datafield: 'username', style: { width: '100%' } });
    this.txtPassword = new WiseTextBox('', {
      id: 'txtConnPassword', label: WiseI18n.t('RD_LBL_PASSWORD'), datafield: 'password',
      placeholder: this.connectionId ? WiseI18n.t('RD_PASSWORD_KEEP_HINT') : '',
      password: true,
      style: { width: '100%' }
    });

    form.setCell(0, 0, this.txtName, { colSpan: 2 });
    form.setCell(1, 0, this.cmbDbType);
    form.setCell(1, 1, this.numPort);
    form.setCell(2, 0, this.txtHost);
    form.setCell(2, 1, this.txtDatabase);
    form.setCell(3, 0, this.txtUser);
    form.setCell(3, 1, this.txtPassword);
    this.addControl(form);

    const actions = new WiseFrame('', {
      id: 'frameConnActions',
      style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }
    });
    const btnSave = new WiseButton(WiseI18n.t('SIMPAN'), { id: 'btnConnSave', onClick: this.onSaveClick.bind(this) });
    const btnTest = new WiseButton(WiseI18n.t('RD_TEST_CONNECTION'), {
      id: 'btnConnTest', onClick: this.onTestClick.bind(this),
      style: { background: '#e2e8f0', color: '#334155' }
    });
    const btnCancel = new WiseButton(WiseI18n.t('BATAL'), {
      id: 'btnConnCancel', onClick: () => this.close(),
      style: { background: '#e2e8f0', color: '#334155' }
    });
    actions.addControl(btnSave);
    actions.addControl(btnTest);
    actions.addControl(btnCancel);
    this.addControl(actions);
    return this;
  }

  async onShow() {
    this.visible = true;
    try {
      this.databaseTypes = (await api.listDatabaseTypes()).filter((d) => d.isActive !== false);
      this.cmbDbType.setItems(this.databaseTypes.map((d) => ({ value: String(d.id), label: d.name })));
      if (this.connectionId) {
        const conn = await api.getConnection(this.connectionId);
        this.hasStoredPassword = !!conn.hasPassword;
        this.populate({
          name: conn.name,
          databaseTypeId: String(conn.databaseTypeId),
          host: conn.host,
          port: conn.port,
          databaseName: conn.databaseName,
          username: conn.username,
          password: ''
        });
      } else if (this.databaseTypes.length > 0) {
        this.cmbDbType.setValue(String(this.databaseTypes[0].id));
        this.numPort.setValue(this.databaseTypes[0].defaultPort || 0);
      }
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  // Picking a database type fills in that type's default port.
  onDatabaseTypeChanged() {
    const type = this.databaseTypes.find((d) => String(d.id) === String(this.cmbDbType.value));
    if (type && type.defaultPort) {
      this.numPort.setValue(type.defaultPort);
    }
  }

  buildPayload() {
    const v = this.getValues();
    return {
      name: (v.name || '').trim(),
      databaseTypeId: Number(v.databaseTypeId) || null,
      host: (v.host || '').trim(),
      port: Number(v.port) || null,
      databaseName: (v.databaseName || '').trim(),
      username: (v.username || '').trim(),
      password: v.password || '',
      options: {}
    };
  }

  validate(payload) {
    if (!payload.name) return 'RD_MSG_NAME_REQUIRED';
    if (!payload.databaseTypeId) return 'RD_MSG_DB_TYPE_REQUIRED';
    if (!payload.host || !payload.databaseName) return 'RD_MSG_HOST_DB_REQUIRED';
    return null;
  }

  async onTestClick() {
    const payload = this.buildPayload();
    const problem = this.validate(payload);
    if (problem) return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t(problem), 'warning');
    try {
      const body = this.connectionId ? { ...payload, id: this.connectionId } : payload;
      const res = await api.testConnection(body);
      if (res && res.ok) {
        this.showInfo(WiseI18n.t('BERHASIL'), res.message || WiseI18n.t('RD_MSG_TEST_OK'), 'success');
      } else {
        this.showInfo(WiseI18n.t('ERROR'), (res && res.message) || WiseI18n.t('RD_MSG_TEST_FAILED'), 'error');
      }
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  async onSaveClick() {
    const payload = this.buildPayload();
    const problem = this.validate(payload);
    if (problem) return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t(problem), 'warning');
    try {
      if (this.connectionId) {
        await api.updateConnection(this.connectionId, payload);
      } else {
        await api.createConnection(payload);
      }
      this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('RD_MSG_SAVED'), 'success');
      if (this.onSavedCallback) await this.onSavedCallback();
      else if (this.parentWindow && typeof this.parentWindow.loadInitialData === 'function') await this.parentWindow.loadInitialData();
      this.close();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENYIMPAN'), err.message, 'error');
    }
  }
}

export default WinConnectionEdit;
