import {
  WiseWindow,
  WiseButton,
  WiseComboBox,
  WiseDataTable,
  WiseTabControl,
  WiseFrame,
  WiseI18n,
} from '../../../src/runtime/wise.js';

import WinReportEdit from './WinReportEdit';
import WinConnectionEdit from './WinConnectionEdit';
import WinReportGroupEdit from './WinReportGroupEdit';

import ReportDesignerApiRepository from '../services/ReportDesignerApiRepository';
const api = new ReportDesignerApiRepository();

const GREY_BUTTON = { background: '#e2e8f0', color: '#334155' };
const DANGER_BUTTON = { background: '#dc2626', color: '#ffffff' };

const CHART_TYPE_KEYS = {
  bar: 'RD_CHART_BAR', horizontalBar: 'RD_CHART_HORIZONTAL_BAR', line: 'RD_CHART_LINE', area: 'RD_CHART_AREA',
  pie: 'RD_CHART_PIE', doughnut: 'RD_CHART_DOUGHNUT', radar: 'RD_CHART_RADAR', polarArea: 'RD_CHART_POLAR_AREA',
  table: 'RD_CHART_TABLE'
};

const PAGE_SIZE = 12;

class WinReportDesigner extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = `${WiseI18n.t('RD_APP_TITLE')} — Wise Report`;
    this.appTitle = options.appTitle || WiseI18n.t('RD_APP_TITLE');
    this.appIcon = options.appIcon || '📊';
    this.width = options.width || '88%';
    this.height = options.height || 700;
    this.positionX = options.positionX !== undefined ? options.positionX : 70;
    this.positionY = options.positionY !== undefined ? options.positionY : 50;

    // full (unpaged) row sets; the tables only ever show the current page
    this.rowsReports = [];
    this.rowsConnections = [];
    this.rowsGroups = [];
  }

  onWindowInit() {
    this.controls = [];

    const tabs = new WiseTabControl({ id: 'tabsDesigner', layout: 'horizontal', activeIndex: 0 });

    // ── Reports tab ──────────────────────────────────────────────
    this.cmbGroupFilter = new WiseComboBox([{ value: '', label: WiseI18n.t('SEMUA') }], {
      id: 'cmbGroupFilter', label: WiseI18n.t('RD_LBL_GROUP'), value: '', style: { width: '260px' },
      onChange: this.onGroupFilterChanged.bind(this)
    });
    this.dtReports = new WiseDataTable({
      id: 'dtReports', pageSize: PAGE_SIZE, maxHeight: '55vh',
      onDataFilterChanged: (size, page) => this.showPage(this.dtReports, this.rowsReports, size, page)
    });
    this.dtReports.setColumns([
      { dataField: 'name', header: WiseI18n.t('RD_COL_NAME'), width: 220 },
      { dataField: 'groupCode', header: WiseI18n.t('KODE'), width: 150 },
      { dataField: 'groupName', header: WiseI18n.t('RD_COL_GROUP'), width: 180 },
      { dataField: 'connectionName', header: WiseI18n.t('RD_COL_CONNECTION'), width: 180 },
      { dataField: 'chartTypeLabel', header: WiseI18n.t('RD_COL_CHART_TYPE'), width: 140 }
    ]);
    this.dtReports.addContextMenu([
      { id: 'edit', label: WiseI18n.t('EDIT'), onClick: (row) => this.onEditReportClick(row) },
      { id: 'delete', label: WiseI18n.t('HAPUS'), onClick: (row) => this.onDeleteReportClick(row) }
    ]);
    tabs.addTab({
      id: 'tabReports', label: WiseI18n.t('RD_TAB_REPORTS'),
      controls: [
        this.toolbar('Report', this.cmbGroupFilter, {
          add: () => this.onAddReportClick(), edit: () => this.onEditReportClick(),
          del: () => this.onDeleteReportClick(), refresh: () => this.loadInitialData()
        }),
        this.dtReports
      ]
    });

    // ── Connections tab ──────────────────────────────────────────
    this.dtConnections = new WiseDataTable({
      id: 'dtConnections', pageSize: PAGE_SIZE, maxHeight: '55vh',
      onDataFilterChanged: (size, page) => this.showPage(this.dtConnections, this.rowsConnections, size, page)
    });
    this.dtConnections.setColumns([
      { dataField: 'name', header: WiseI18n.t('RD_COL_NAME'), width: 200 },
      { dataField: 'databaseTypeName', header: WiseI18n.t('RD_COL_TYPE'), width: 140 },
      { dataField: 'host', header: WiseI18n.t('RD_COL_HOST'), width: 160 },
      { dataField: 'port', header: WiseI18n.t('RD_COL_PORT'), width: 80 },
      { dataField: 'databaseName', header: WiseI18n.t('RD_COL_DATABASE'), width: 160 },
      { dataField: 'username', header: WiseI18n.t('RD_COL_USER'), width: 140 }
    ]);
    this.dtConnections.addContextMenu([
      { id: 'edit', label: WiseI18n.t('EDIT'), onClick: (row) => this.onEditConnectionClick(row) },
      { id: 'delete', label: WiseI18n.t('HAPUS'), onClick: (row) => this.onDeleteConnectionClick(row) }
    ]);
    tabs.addTab({
      id: 'tabConnections', label: WiseI18n.t('RD_TAB_CONNECTIONS'),
      controls: [
        this.toolbar('Connection', null, {
          add: () => this.onAddConnectionClick(), edit: () => this.onEditConnectionClick(),
          del: () => this.onDeleteConnectionClick(), refresh: () => this.loadInitialData()
        }),
        this.dtConnections
      ]
    });

    // ── Report Groups tab ────────────────────────────────────────
    this.dtGroups = new WiseDataTable({
      id: 'dtGroups', pageSize: PAGE_SIZE, maxHeight: '55vh',
      onDataFilterChanged: (size, page) => this.showPage(this.dtGroups, this.rowsGroups, size, page)
    });
    this.dtGroups.setColumns([
      { dataField: 'code', header: WiseI18n.t('KODE'), width: 200 },
      { dataField: 'name', header: WiseI18n.t('RD_COL_NAME'), width: 220 },
      { dataField: 'description', header: WiseI18n.t('KETERANGAN'), width: 320 },
      { dataField: 'reportCount', header: WiseI18n.t('RD_COL_REPORT_COUNT'), width: 120 }
    ]);
    this.dtGroups.addContextMenu([
      { id: 'edit', label: WiseI18n.t('EDIT'), onClick: (row) => this.onEditGroupClick(row) },
      { id: 'delete', label: WiseI18n.t('HAPUS'), onClick: (row) => this.onDeleteGroupClick(row) }
    ]);
    tabs.addTab({
      id: 'tabGroups', label: WiseI18n.t('RD_TAB_GROUPS'),
      controls: [
        this.toolbar('Group', null, {
          add: () => this.onAddGroupClick(), edit: () => this.onEditGroupClick(),
          del: () => this.onDeleteGroupClick(), refresh: () => this.loadInitialData()
        }),
        this.dtGroups
      ]
    });

    this.addControl(tabs);
    return this;
  }

  // Add / Edit / Delete / Refresh button row (+ optional leading filter control)
  toolbar(name, leadingControl, handlers) {
    const bar = new WiseFrame('', {
      id: `frameToolbar${name}`,
      style: { display: 'flex', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap', border: 'none', background: 'transparent', padding: '0 0 8px 0' }
    });
    if (leadingControl) bar.addControl(leadingControl);
    bar.addControl(new WiseButton(WiseI18n.t('RD_ADD'), { id: `btnAdd${name}`, onClick: handlers.add }));
    bar.addControl(new WiseButton(WiseI18n.t('EDIT'), { id: `btnEdit${name}`, onClick: handlers.edit, style: GREY_BUTTON }));
    bar.addControl(new WiseButton(WiseI18n.t('HAPUS'), { id: `btnDelete${name}`, onClick: handlers.del, style: DANGER_BUTTON }));
    bar.addControl(new WiseButton(WiseI18n.t('REFRESH'), { id: `btnRefresh${name}`, onClick: handlers.refresh, style: GREY_BUTTON }));
    return bar;
  }

  // ── Data loading ──────────────────────────────────────────────
  async loadInitialData() {
    try {
      const [groups, connections, reports] = await Promise.all([
        api.listReportGroups(), api.listConnections(), api.listReports(this.cmbGroupFilter.value || undefined)
      ]);
      const current = this.cmbGroupFilter.value || '';
      this.cmbGroupFilter.setItems([{ value: '', label: WiseI18n.t('SEMUA') }, ...groups.map((g) => ({ value: String(g.id), label: `[${g.code}] ${g.name}` }))]);
      this.cmbGroupFilter.setValue(groups.some((g) => String(g.id) === current) ? current : '');

      this.rowsGroups = groups;
      this.rowsConnections = connections;
      this.rowsReports = reports.map((r) => ({ ...r, chartTypeLabel: WiseI18n.t(CHART_TYPE_KEYS[r.chartType] || 'RD_CHART_BAR') }));
      this.showPage(this.dtGroups, this.rowsGroups, this.dtGroups.pageSize, 1);
      this.showPage(this.dtConnections, this.rowsConnections, this.dtConnections.pageSize, 1);
      this.showPage(this.dtReports, this.rowsReports, this.dtReports.pageSize, 1);
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR_KONEKSI_BACKEND'), err.message, 'error');
    }
  }

  showPage(table, allRows, pageSize, page) {
    const size = pageSize || PAGE_SIZE;
    const current = page || 1;
    table.pageSize = size;
    table.currentPage = current;
    table.setData(allRows.slice((current - 1) * size, current * size), allRows.length);
  }

  async onGroupFilterChanged() {
    try {
      const reports = await api.listReports(this.cmbGroupFilter.value || undefined);
      this.rowsReports = reports.map((r) => ({ ...r, chartTypeLabel: WiseI18n.t(CHART_TYPE_KEYS[r.chartType] || 'RD_CHART_BAR') }));
      this.showPage(this.dtReports, this.rowsReports, this.dtReports.pageSize, 1);
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    }
  }

  // row from the context menu, otherwise the table's selected row
  pickRow(table, row, warningKey) {
    const target = (row && row.id) ? row : table.getSelectedRow();
    if (!target || !target.id) {
      this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t(warningKey), 'warning');
      return null;
    }
    return target;
  }

  async confirmDelete(name) {
    return this.confirm(
      WiseI18n.t('KONFIRMASI_HAPUS'),
      `${WiseI18n.t('APAKAH_ANDA_YAKIN_INGIN_MENGHAPUS')} "${name}"?`,
      { type: 'danger', confirmText: WiseI18n.t('YA_HAPUS') }
    );
  }

  // ── Reports ───────────────────────────────────────────────────
  async onAddReportClick() {
    await this.openWindow(WinReportEdit, { reportId: null, groupId: this.cmbGroupFilter.value || null });
  }

  async onEditReportClick(row) {
    const target = this.pickRow(this.dtReports, row, 'RD_MSG_SELECT_REPORT');
    if (!target) return;
    await this.openWindow(WinReportEdit, { reportId: target.id });
  }

  async onDeleteReportClick(row) {
    const target = this.pickRow(this.dtReports, row, 'RD_MSG_SELECT_REPORT');
    if (!target) return;
    if (!(await this.confirmDelete(target.name))) return;
    try {
      await api.deleteReport(target.id);
      this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('RD_MSG_DELETED'), 'success');
      await this.loadInitialData();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENGHAPUS'), err.message, 'error');
    }
  }

  // ── Connections ───────────────────────────────────────────────
  async onAddConnectionClick() {
    await this.openWindow(WinConnectionEdit, { connectionId: null });
  }

  async onEditConnectionClick(row) {
    const target = this.pickRow(this.dtConnections, row, 'RD_MSG_SELECT_CONNECTION');
    if (!target) return;
    await this.openWindow(WinConnectionEdit, { connectionId: target.id });
  }

  async onDeleteConnectionClick(row) {
    const target = this.pickRow(this.dtConnections, row, 'RD_MSG_SELECT_CONNECTION');
    if (!target) return;
    if (!(await this.confirmDelete(target.name))) return;
    try {
      await api.deleteConnection(target.id);
      this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('RD_MSG_DELETED'), 'success');
      await this.loadInitialData();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENGHAPUS'), err.message, 'error');
    }
  }

  // ── Report groups ─────────────────────────────────────────────
  async onAddGroupClick() {
    await this.openWindow(WinReportGroupEdit, { groupId: null });
  }

  async onEditGroupClick(row) {
    const target = this.pickRow(this.dtGroups, row, 'RD_MSG_SELECT_GROUP');
    if (!target) return;
    await this.openWindow(WinReportGroupEdit, { groupId: target.id });
  }

  async onDeleteGroupClick(row) {
    const target = this.pickRow(this.dtGroups, row, 'RD_MSG_SELECT_GROUP');
    if (!target) return;
    if (!(await this.confirmDelete(target.name))) return;
    try {
      try {
        await api.deleteReportGroup(target.id);
      } catch (err) {
        if (err.status !== 409) throw err;
        // group still has reports: offer to delete it together with them
        const force = await this.confirm(
          WiseI18n.t('KONFIRMASI_HAPUS'),
          WiseI18n.t('RD_CONFIRM_DELETE_GROUP_FORCE').replace('{n}', target.reportCount || 0),
          { type: 'danger', confirmText: WiseI18n.t('YA_HAPUS') }
        );
        if (!force) return;
        await api.deleteReportGroup(target.id, true);
      }
      this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('RD_MSG_DELETED'), 'success');
      await this.loadInitialData();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENGHAPUS'), err.message, 'error');
    }
  }
}

export default WinReportDesigner;
