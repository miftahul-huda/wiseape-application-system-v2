import {
  WiseWindow,
  WiseButton,
  WiseTextBox,
  WiseTextArea,
  WiseNumericBox,
  WiseComboBox,
  WiseDataTable,
  WiseChart,
  WiseTableLayout,
  WiseFrame,
  WiseI18n,
} from '../../../src/runtime/wise.js';

import WinReportFieldEdit, { AGGREGATE_KEYS } from './WinReportFieldEdit';
import ReportDesignerApiRepository from '../services/ReportDesignerApiRepository';
const api = new ReportDesignerApiRepository();

// Light-grey header for the dimension/measure tables (instead of the theme-accent default).
const GREY_TABLE_HEADER = { background: '#e2e8f0', color: '#334155' };
const GREY_BUTTON = { background: '#e2e8f0', color: '#334155' };

const CHART_TYPES = [
  ['bar', 'RD_CHART_BAR'], ['horizontalBar', 'RD_CHART_HORIZONTAL_BAR'], ['line', 'RD_CHART_LINE'],
  ['area', 'RD_CHART_AREA'], ['pie', 'RD_CHART_PIE'], ['doughnut', 'RD_CHART_DOUGHNUT'],
  ['radar', 'RD_CHART_RADAR'], ['polarArea', 'RD_CHART_POLAR_AREA'], ['table', 'RD_CHART_TABLE']
];

class WinReportEdit extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.reportId = options.reportId || null;
    this.defaultGroupId = options.groupId || null;
    this.onSavedCallback = options.onSaved || null;
    this.title = this.reportId ? WiseI18n.t('RD_REPORT_EDIT_TITLE') : WiseI18n.t('RD_REPORT_ADD_TITLE');
    this.width = options.width || '82%';
    this.height = options.height || '90%';
    this.positionX = options.positionX !== undefined ? options.positionX : 120;
    this.positionY = options.positionY !== undefined ? options.positionY : 30;

    this.dimensions = [];
    this.measures = [];
    this.availableColumns = [];
    this.reportOptions = {};
  }

  onWindowInit() {
    this.controls = [];

    // ── General + source settings ───────────────────────────────
    const form = new WiseTableLayout({
      rows: 6, columns: 2, columnWidths: ['50%', '50%'], tableLayout: 'fixed',
      id: 'tblReportForm', style: { width: '100%', tableLayout: 'fixed', marginBottom: '8px' }
    });

    this.cmbGroup = new WiseComboBox([], { id: 'cmbReportGroup', label: WiseI18n.t('RD_LBL_GROUP'), datafield: 'groupId', style: { width: '100%' } });
    this.txtName = new WiseTextBox('', { id: 'txtReportName', label: WiseI18n.t('RD_LBL_NAME'), datafield: 'name', style: { width: '100%' } });
    this.txtDescription = new WiseTextBox('', { id: 'txtReportDescription', label: WiseI18n.t('KETERANGAN'), datafield: 'description', style: { width: '100%' } });
    this.cmbConnection = new WiseComboBox([], {
      id: 'cmbReportConnection', label: WiseI18n.t('RD_LBL_CONNECTION'), datafield: 'connectionId', style: { width: '100%' },
      onChange: this.onConnectionChanged.bind(this)
    });
    this.cmbSourceType = new WiseComboBox([
      { value: 'table', label: WiseI18n.t('RD_SOURCE_TABLE') },
      { value: 'query', label: WiseI18n.t('RD_SOURCE_QUERY') }
    ], {
      id: 'cmbReportSourceType', label: WiseI18n.t('RD_LBL_SOURCE_TYPE'), datafield: 'sourceType', value: 'table', style: { width: '100%' },
      onChange: this.onSourceTypeChanged.bind(this)
    });
    this.cmbTable = new WiseComboBox([], {
      id: 'cmbReportTable', label: WiseI18n.t('RD_LBL_TABLE'), datafield: 'sourceTable', style: { width: '100%' },
      onChange: this.onTableChanged.bind(this)
    });
    this.txtQuery = new WiseTextArea('', {
      id: 'txtReportQuery', label: WiseI18n.t('RD_LBL_QUERY'), datafield: 'sourceQuery', rows: 5,
      placeholder: 'SELECT ...', style: { width: '100%', fontFamily: 'monospace' }
    });
    this.btnLoadColumns = new WiseButton(WiseI18n.t('RD_LOAD_COLUMNS'), {
      id: 'btnLoadColumns', onClick: this.onLoadQueryColumnsClick.bind(this), style: GREY_BUTTON
    });
    this.cmbChartType = new WiseComboBox(
      CHART_TYPES.map(([value, key]) => ({ value, label: WiseI18n.t(key) })),
      { id: 'cmbReportChartType', label: WiseI18n.t('RD_LBL_CHART_TYPE'), datafield: 'chartType', value: 'bar', style: { width: '100%' } }
    );
    this.numRowLimit = new WiseNumericBox('', { id: 'numReportRowLimit', label: WiseI18n.t('RD_ROW_LIMIT'), datafield: 'rowLimit', value: 100, style: { width: '100%' } });

    form.setCell(0, 0, this.cmbGroup);
    form.setCell(0, 1, this.txtName);
    form.setCell(1, 0, this.txtDescription, { colSpan: 2 });
    form.setCell(2, 0, this.cmbConnection);
    form.setCell(2, 1, this.cmbSourceType);
    form.setCell(3, 0, this.cmbTable);
    form.setCell(3, 1, this.cmbChartType);
    form.setCell(4, 0, this.txtQuery, { colSpan: 2 });
    form.setCell(5, 0, this.numRowLimit);
    form.setCell(5, 1, this.btnLoadColumns);
    this.addControl(form);

    // ── Dimensions + Measures (sub-records edited in tiny dialogs) ─
    const lists = new WiseTableLayout({
      rows: 1, columns: 2, columnWidths: ['50%', '50%'], tableLayout: 'fixed',
      id: 'tblReportFields', style: { width: '100%', tableLayout: 'fixed', marginBottom: '8px' }
    });
    lists.setCell(0, 0, this.buildDimensionPanel());
    lists.setCell(0, 1, this.buildMeasurePanel());
    this.addControl(lists);

    // ── Preview ─────────────────────────────────────────────────
    this.chartPreview = new WiseChart({ id: 'chartPreview', height: 300 });
    this.addControl(this.chartPreview);

    // ── Action buttons: Save left, Cancel right ─────────────────
    const actions = new WiseFrame('', {
      id: 'frameReportActions',
      style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }
    });
    actions.addControl(new WiseButton(WiseI18n.t('SIMPAN'), { id: 'btnReportSave', onClick: this.onSaveClick.bind(this) }));
    actions.addControl(new WiseButton(WiseI18n.t('RD_PREVIEW'), { id: 'btnReportPreview', onClick: this.onPreviewClick.bind(this), style: GREY_BUTTON }));
    actions.addControl(new WiseButton(WiseI18n.t('BATAL'), { id: 'btnReportCancel', onClick: () => this.close(), style: GREY_BUTTON }));
    this.addControl(actions);

    this.updateSourceVisibility('table');
    return this;
  }

  buildDimensionPanel() {
    const panel = new WiseFrame('', { id: 'frameDimensions', style: { padding: '4px 6px', border: 'none', background: 'transparent', width: '100%', boxSizing: 'border-box' } });
    this.dtDimensions = new WiseDataTable({ id: 'dtDimensions', pageSize: 6, headerStyle: GREY_TABLE_HEADER });
    this.dtDimensions.setColumns([
      { dataField: 'column', header: WiseI18n.t('RD_COL_COLUMN'), width: 160 },
      { dataField: 'alias', header: WiseI18n.t('RD_COL_ALIAS'), width: 140 }
    ]);
    this.dtDimensions.addContextMenu([
      { id: 'edit', label: WiseI18n.t('EDIT'), onClick: (row) => this.onEditFieldClick('dimension', row) },
      { id: 'delete', label: WiseI18n.t('HAPUS'), onClick: (row) => this.onRemoveFieldClick('dimension', row) }
    ]);
    panel.addControl(new WiseFrame(WiseI18n.t('RD_LBL_DIMENSIONS'), { id: 'frameDimensionsTitle', style: { border: 'none', background: 'transparent', padding: '0 0 4px 0', fontWeight: 600 } }));
    panel.addControl(this.fieldButtons('dimension'));
    panel.addControl(this.dtDimensions);
    return panel;
  }

  buildMeasurePanel() {
    const panel = new WiseFrame('', { id: 'frameMeasures', style: { padding: '4px 6px', border: 'none', background: 'transparent', width: '100%', boxSizing: 'border-box' } });
    this.dtMeasures = new WiseDataTable({ id: 'dtMeasures', pageSize: 6, headerStyle: GREY_TABLE_HEADER });
    this.dtMeasures.setColumns([
      { dataField: 'column', header: WiseI18n.t('RD_COL_COLUMN'), width: 140 },
      { dataField: 'aggregateLabel', header: WiseI18n.t('RD_COL_AGGREGATE'), width: 110 },
      { dataField: 'alias', header: WiseI18n.t('RD_COL_ALIAS'), width: 120 }
    ]);
    this.dtMeasures.addContextMenu([
      { id: 'edit', label: WiseI18n.t('EDIT'), onClick: (row) => this.onEditFieldClick('measure', row) },
      { id: 'delete', label: WiseI18n.t('HAPUS'), onClick: (row) => this.onRemoveFieldClick('measure', row) }
    ]);
    panel.addControl(new WiseFrame(WiseI18n.t('RD_LBL_MEASURES'), { id: 'frameMeasuresTitle', style: { border: 'none', background: 'transparent', padding: '0 0 4px 0', fontWeight: 600 } }));
    panel.addControl(this.fieldButtons('measure'));
    panel.addControl(this.dtMeasures);
    return panel;
  }

  fieldButtons(kind) {
    const bar = new WiseFrame('', { id: `frameBtns_${kind}`, style: { display: 'flex', gap: '8px', border: 'none', background: 'transparent', padding: '0 0 6px 0' } });
    bar.addControl(new WiseButton(WiseI18n.t('RD_ADD'), { id: `btnAdd_${kind}`, onClick: () => this.onAddFieldClick(kind) }));
    bar.addControl(new WiseButton(WiseI18n.t('EDIT'), { id: `btnEdit_${kind}`, onClick: () => this.onEditFieldClick(kind), style: GREY_BUTTON }));
    bar.addControl(new WiseButton(WiseI18n.t('HAPUS'), { id: `btnRemove_${kind}`, onClick: () => this.onRemoveFieldClick(kind), style: GREY_BUTTON }));
    return bar;
  }

  // ── Loading ───────────────────────────────────────────────────
  async onShow() {
    this.visible = true;
    try {
      const [groups, connections] = await Promise.all([api.listReportGroups(), api.listConnections()]);
      this.cmbGroup.setItems([{ value: '', label: WiseI18n.t('RD_SELECT_PLACEHOLDER') }, ...groups.map((g) => ({ value: String(g.id), label: `[${g.code}] ${g.name}` }))]);
      this.cmbConnection.setItems([{ value: '', label: WiseI18n.t('RD_SELECT_PLACEHOLDER') }, ...connections.map((c) => ({ value: String(c.id), label: c.name }))]);
      this.cmbGroup.setValue(this.defaultGroupId ? String(this.defaultGroupId) : '');
      this.cmbConnection.setValue('');
      this.cmbTable.setItems([{ value: '', label: WiseI18n.t('RD_SELECT_PLACEHOLDER') }]);
      this.cmbTable.setValue('');

      if (this.reportId) {
        await this.loadReport(this.reportId);
      } else {
        this.refreshFieldTables();
      }
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  async loadReport(id) {
    const report = await api.getReport(id);
    this.reportOptions = report.options || {};
    this.dimensions = (report.dimensions || []).map((d) => ({ column: d.column, alias: d.alias || '' }));
    this.measures = (report.measures || []).map((m) => ({ column: m.column, aggregate: m.aggregate || 'sum', alias: m.alias || '' }));

    this.populate({
      groupId: report.groupId ? String(report.groupId) : '',
      name: report.name,
      description: report.description || '',
      connectionId: report.connectionId ? String(report.connectionId) : '',
      sourceType: report.sourceType || 'table',
      sourceQuery: report.sourceQuery || '',
      chartType: report.chartType || 'bar',
      rowLimit: report.rowLimit || 100
    });
    this.updateSourceVisibility(report.sourceType || 'table');

    if (report.connectionId) {
      await this.loadTables(report.connectionId, report.sourceType === 'table' ? report.sourceTable : '');
      if (report.sourceType === 'table' && report.sourceTable) {
        await this.loadTableColumns(report.connectionId, report.sourceTable);
      } else if (report.sourceType === 'query' && report.sourceQuery) {
        try {
          this.availableColumns = await api.queryColumns(report.connectionId, report.sourceQuery);
        } catch (err) {
          this.availableColumns = [];
        }
      }
    }
    this.refreshFieldTables();
  }

  async loadTables(connectionId, selected = '') {
    let tables = [];
    try {
      tables = connectionId ? await api.listTables(connectionId) : [];
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
    const items = tables.map((t) => ({ value: t.fullName, label: t.fullName }));
    if (selected && !items.some((i) => i.value === selected)) items.unshift({ value: selected, label: selected });
    this.cmbTable.setItems([{ value: '', label: WiseI18n.t('RD_SELECT_PLACEHOLDER') }, ...items]);
    this.cmbTable.setValue(selected || '');
  }

  async loadTableColumns(connectionId, table) {
    try {
      this.availableColumns = (connectionId && table) ? await api.listColumns(connectionId, table) : [];
    } catch (err) {
      this.availableColumns = [];
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  // connection -> tables -> columns: changing the connection reloads the tables
  // and clears the columns that depended on it.
  async onConnectionChanged() {
    this.availableColumns = [];
    await this.loadTables(this.cmbConnection.value, '');
  }

  async onTableChanged() {
    await this.loadTableColumns(this.cmbConnection.value, this.cmbTable.value);
  }

  onSourceTypeChanged() {
    this.updateSourceVisibility(this.cmbSourceType.value);
    this.availableColumns = [];
  }

  updateSourceVisibility(sourceType) {
    const isTable = sourceType !== 'query';
    this.cmbTable.setVisibility(isTable);
    this.txtQuery.setVisibility(!isTable);
    this.btnLoadColumns.setVisibility(!isTable);
  }

  async onLoadQueryColumnsClick() {
    const connectionId = this.cmbConnection.value;
    const query = (this.txtQuery.value || '').trim();
    if (!connectionId) return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('RD_MSG_CONNECTION_REQUIRED'), 'warning');
    if (!query) return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t('RD_MSG_QUERY_REQUIRED'), 'warning');
    try {
      this.availableColumns = await api.queryColumns(connectionId, query);
      this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('RD_MSG_COLUMNS_LOADED').replace('{n}', this.availableColumns.length), 'success');
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  // ── Dimensions / measures ─────────────────────────────────────
  refreshFieldTables() {
    this.dtDimensions.setData(this.dimensions.map((d, i) => ({ ...d, _idx: i })), this.dimensions.length);
    this.dtMeasures.setData(this.measures.map((m, i) => ({
      ...m, _idx: i, aggregateLabel: WiseI18n.t(AGGREGATE_KEYS[m.aggregate] || 'RD_AGG_SUM')
    })), this.measures.length);
  }

  listFor(kind) {
    return kind === 'measure' ? this.measures : this.dimensions;
  }

  tableFor(kind) {
    return kind === 'measure' ? this.dtMeasures : this.dtDimensions;
  }

  async onAddFieldClick(kind) {
    if (!this.availableColumns || this.availableColumns.length === 0) {
      return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('RD_MSG_LOAD_COLUMNS_FIRST'), 'warning');
    }
    await this.openWindow(WinReportFieldEdit, {
      kind,
      columns: this.availableColumns,
      data: null,
      onSaved: (field) => {
        this.listFor(kind).push(field);
        this.refreshFieldTables();
      }
    });
  }

  async onEditFieldClick(kind, row) {
    const target = row || this.tableFor(kind).getSelectedRow();
    if (!target || target._idx === undefined) {
      return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('RD_MSG_SELECT_ROW'), 'warning');
    }
    const idx = target._idx;
    await this.openWindow(WinReportFieldEdit, {
      kind,
      columns: this.availableColumns,
      data: this.listFor(kind)[idx],
      onSaved: (field) => {
        this.listFor(kind)[idx] = field;
        this.refreshFieldTables();
      }
    });
  }

  onRemoveFieldClick(kind, row) {
    const target = row || this.tableFor(kind).getSelectedRow();
    if (!target || target._idx === undefined) {
      return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('RD_MSG_SELECT_ROW'), 'warning');
    }
    this.listFor(kind).splice(target._idx, 1);
    this.refreshFieldTables();
  }

  // ── Definition / validation / save / preview ──────────────────
  buildDefinition() {
    const v = this.getValues();
    const sourceType = v.sourceType === 'query' ? 'query' : 'table';
    const clean = (f) => {
      const out = { column: f.column };
      if (f.aggregate) out.aggregate = f.aggregate;
      if (f.alias) out.alias = f.alias;
      return out;
    };
    return {
      groupId: Number(v.groupId) || null,
      name: (v.name || '').trim(),
      description: (v.description || '').trim(),
      connectionId: Number(v.connectionId) || null,
      sourceType,
      sourceTable: sourceType === 'table' ? (v.sourceTable || '') : null,
      sourceQuery: sourceType === 'query' ? (v.sourceQuery || '').trim() : null,
      chartType: v.chartType || 'bar',
      dimensions: this.dimensions.map(clean),
      measures: this.measures.map(clean),
      rowLimit: Number(v.rowLimit) || 100,
      options: this.reportOptions || {}
    };
  }

  // returns an i18n key for the first problem, or null when OK
  validateDefinition(def, requireNameAndGroup = true) {
    if (requireNameAndGroup && !def.name) return 'RD_MSG_NAME_REQUIRED';
    if (requireNameAndGroup && !def.groupId) return 'RD_MSG_GROUP_REQUIRED';
    if (!def.connectionId) return 'RD_MSG_CONNECTION_REQUIRED';
    if (def.sourceType === 'table' && !def.sourceTable) return 'RD_MSG_TABLE_REQUIRED';
    if (def.sourceType === 'query' && !def.sourceQuery) return 'RD_MSG_QUERY_REQUIRED';
    if (def.dimensions.length === 0 && def.measures.length === 0) return 'RD_MSG_FIELDS_REQUIRED';
    return null;
  }

  async onSaveClick() {
    const def = this.buildDefinition();
    const problem = this.validateDefinition(def);
    if (problem) return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t(problem), 'warning');
    try {
      if (this.reportId) await api.updateReport(this.reportId, def);
      else await api.createReport(def);
      this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('RD_MSG_SAVED'), 'success');
      if (this.onSavedCallback) await this.onSavedCallback();
      else if (this.parentWindow && typeof this.parentWindow.loadInitialData === 'function') await this.parentWindow.loadInitialData();
      this.close();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENYIMPAN'), err.message, 'error');
    }
  }

  async onPreviewClick() {
    const def = this.buildDefinition();
    const problem = this.validateDefinition(def, false);
    if (problem) return this.showInfo(WiseI18n.t('VALIDASI'), WiseI18n.t(problem), 'warning');
    try {
      const res = await api.previewReport(def);
      this.chartPreview.setData(res.chart || {});
      const count = (res.rows || []).length;
      this.showInfo(WiseI18n.t('RD_PREVIEW'), WiseI18n.t('RD_MSG_PREVIEW_ROWS').replace('{n}', count), 'information');
    } catch (err) {
      this.chartPreview.clear();
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }
}

export default WinReportEdit;
