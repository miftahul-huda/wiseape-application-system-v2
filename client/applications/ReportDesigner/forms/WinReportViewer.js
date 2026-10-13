import {
  WiseWindow,
  WiseButton,
  WiseLabel,
  WiseComboBox,
  WiseDataTable,
  WiseChart,
  WiseFrame,
  WiseI18n,
} from '../../../src/runtime/wise.js';

import ReportDesignerApiRepository from '../services/ReportDesignerApiRepository';
const api = new ReportDesignerApiRepository();

// Light-grey header for the raw-data table.
const GREY_TABLE_HEADER = { background: '#e2e8f0', color: '#334155' };
const GREY_BUTTON = { background: '#e2e8f0', color: '#334155' };
const PAGE_SIZE = 10;

class WinReportViewer extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.presetGroupId = options.reportGroupId ? String(options.reportGroupId) : '';
    this.title = `${WiseI18n.t('RD_VIEWER_TITLE')} — Wise Report`;
    this.appTitle = options.appTitle || WiseI18n.t('RD_VIEWER_TITLE');
    this.appIcon = options.appIcon || '📈';
    this.width = options.width || '90%';
    this.height = options.height || 720;
    this.positionX = options.positionX !== undefined ? options.positionX : 80;
    this.positionY = options.positionY !== undefined ? options.positionY : 40;
    this.rawRows = [];
  }

  onWindowInit() {
    this.controls = [];

    const bar = new WiseFrame('', {
      id: 'frameViewerBar',
      style: { display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap', border: 'none', background: 'transparent', padding: '0 0 10px 0' }
    });
    this.cmbViewerGroup = new WiseComboBox([], {
      id: 'cmbViewerGroup', label: WiseI18n.t('RD_LBL_REPORT_GROUP'), value: '', style: { width: '560px', maxWidth: '100%' },
      onChange: this.onGroupChanged.bind(this)
    });
    // a group handed over by the caller is fixed: the chooser is disabled
    if (this.presetGroupId) this.cmbViewerGroup.setDisabled(true);
    this.cmbViewerReport = new WiseComboBox([], {
      id: 'cmbViewerReport', label: WiseI18n.t('RD_LBL_REPORT'), value: '', style: { width: '300px' },
      onChange: this.onReportChanged.bind(this)
    });
    this.btnViewerRefresh = new WiseButton(WiseI18n.t('REFRESH'), {
      id: 'btnViewerRefresh', onClick: this.onRefreshClick.bind(this), style: GREY_BUTTON
    });
    bar.addControl(this.cmbViewerGroup);
    bar.addControl(this.cmbViewerReport);
    bar.addControl(this.btnViewerRefresh);
    this.addControl(bar);

    this.lblViewerStatus = new WiseLabel('', { id: 'lblViewerStatus', style: { color: '#475569', fontWeight: 600, marginBottom: '8px' } });
    this.addControl(this.lblViewerStatus);

    this.chartViewer = new WiseChart({ id: 'chartViewer', height: 360 });
    this.addControl(this.chartViewer);

    this.dtViewerData = new WiseDataTable({
      id: 'dtViewerData', pageSize: PAGE_SIZE, maxHeight: '30vh', headerStyle: GREY_TABLE_HEADER,
      onDataFilterChanged: (size, page) => this.showRawPage(size, page)
    });
    this.addControl(this.dtViewerData);
    return this;
  }

  async loadInitialData() {
    try {
      const groups = await api.listReportGroups();
      const items = groups.map((g) => ({ value: String(g.id), label: `[${g.code}] ${g.name}` }));
      this.cmbViewerGroup.setItems(this.presetGroupId ? items : [{ value: '', label: WiseI18n.t('RD_SELECT_PLACEHOLDER') }, ...items]);

      // The caller may pass a group id (12) or a group code (EMPLOYEE_INFORMATION_REPORT).
      let groupId = this.presetGroupId;
      if (groupId) {
        const wanted = groupId.toLowerCase();
        const match = groups.find((g) => String(g.id) === groupId || String(g.code).toLowerCase() === wanted);
        groupId = match ? String(match.id) : '';
        if (!match) {
          this.lblViewerStatus.text(WiseI18n.t('RD_MSG_GROUP_NOT_FOUND'));
          return;
        }
      }
      if (!groupId && items.length === 1) groupId = items[0].value;
      this.cmbViewerGroup.setValue(groupId || '');
      if (groupId) await this.loadGroupReports(groupId);
      else this.lblViewerStatus.text(WiseI18n.t('RD_MSG_CHOOSE_GROUP'));
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR_KONEKSI_BACKEND'), err.message, 'error');
    }
  }

  async onGroupChanged() {
    await this.loadGroupReports(this.cmbViewerGroup.value);
  }

  async loadGroupReports(groupId) {
    this.clearOutput();
    if (!groupId) {
      this.cmbViewerReport.setItems([]);
      this.cmbViewerReport.setValue('');
      this.lblViewerStatus.text(WiseI18n.t('RD_MSG_CHOOSE_GROUP'));
      return;
    }
    try {
      const reports = await api.listGroupReports(groupId);
      this.cmbViewerReport.setItems(reports.map((r) => ({ value: String(r.id), label: r.name })));
      if (reports.length === 0) {
        this.cmbViewerReport.setValue('');
        this.lblViewerStatus.text(WiseI18n.t('RD_MSG_NO_REPORTS'));
        this.showInfo(WiseI18n.t('RD_VIEWER_TITLE'), WiseI18n.t('RD_MSG_NO_REPORTS'), 'information');
        return;
      }
      this.cmbViewerReport.setValue(String(reports[0].id));
      await this.loadReportData(reports[0].id);
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  async onReportChanged() {
    if (this.cmbViewerReport.value) await this.loadReportData(this.cmbViewerReport.value);
  }

  async onRefreshClick() {
    if (this.cmbViewerReport.value) await this.loadReportData(this.cmbViewerReport.value);
    else if (this.cmbViewerGroup.value) await this.loadGroupReports(this.cmbViewerGroup.value);
    else await this.loadInitialData();
  }

  async loadReportData(reportId) {
    // Show the spinner right away: the query can take a while, and the screen is
    // otherwise only updated once this whole handler has finished.
    this.clearOutput();
    this.chartViewer.setLoading(true);
    this.lblViewerStatus.text(WiseI18n.t('RD_MSG_LOADING'));
    await this.refresh();
    try {
      const res = await api.getReportData(reportId);
      this.chartViewer.setLoading(false);
      this.chartViewer.setData(res.chart || {});

      const columns = (res.columns || []).map((c) => {
        const name = typeof c === 'string' ? c : (c.name || c.key);
        return { dataField: name, header: name, width: 140 };
      });
      this.dtViewerData.setColumns(columns);
      const names = columns.map((c) => c.dataField);
      this.rawRows = (res.rows || []).map((r) => (Array.isArray(r)
        ? Object.fromEntries(names.map((n, i) => [n, r[i]]))
        : r));
      this.showRawPage(PAGE_SIZE, 1);
      this.lblViewerStatus.text(WiseI18n.t('RD_MSG_PREVIEW_ROWS').replace('{n}', this.rawRows.length));
    } catch (err) {
      this.chartViewer.setLoading(false);
      this.clearOutput();
      this.lblViewerStatus.text('');
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  showRawPage(pageSize, page) {
    const size = pageSize || PAGE_SIZE;
    const current = page || 1;
    this.dtViewerData.pageSize = size;
    this.dtViewerData.currentPage = current;
    this.dtViewerData.setData(this.rawRows.slice((current - 1) * size, current * size), this.rawRows.length);
  }

  clearOutput() {
    this.chartViewer.clear();
    this.rawRows = [];
    this.dtViewerData.setData([], 0);
  }
}

export default WinReportViewer;
