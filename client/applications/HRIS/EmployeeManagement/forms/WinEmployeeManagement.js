import displayAllSvg from '../assets/icons/display-all.svg?raw';
import selectAllSvg from '../assets/icons/select-all.svg?raw';
import detailSvg from '../assets/icons/detail.svg?raw';
import addemployeeSvg from '../assets/icons/addemployee.svg?raw';
import editSvg from '../assets/icons/edit.svg?raw';
import duplicateSvg from '../assets/icons/duplicate.svg?raw';
import deactivateSvg from '../assets/icons/deactivate.svg?raw';
import findSvg from '../assets/icons/find.svg?raw';
import reportSvg from '../assets/icons/report.svg?raw';

import {
  WiseWindow,
  WiseLabel,
  WiseDataTable,
  WiseIconMenu,
  WiseIconMenuGroup,
  WiseVerticalSeparator,
  WiseI18n,
} from '../../../../src/runtime/wise.js';

import WinEmployeeDetail from './WinEmployeeDetail';
import WinEmployeeEdit from './WinEmployeeEdit';

import HrisApiRepository from '../services/HrisApiRepository';
const api = new HrisApiRepository();

// Toolbar icons live as their own .svg files (assets/icons/) so a designer
// can restyle them without touching this file -- imported via Vite's `?raw`
// and inlined as markup, since WiseIconMenu renders an `icon` starting with
// "<svg" directly rather than fetching it as an <img> src.
const loadIcon = (raw) => raw
  .replace(/<\?xml[^?]*\?>/gi, '')   // strip <?xml ... ?>
  .replace(/<!--[\s\S]*?-->/g, '')    // strip <!-- ... --> comments
  .trim();

const MENU_ICONS = {
  displayAll: loadIcon(displayAllSvg),
  selectAll: loadIcon(selectAllSvg),
  detail: loadIcon(detailSvg),
  add: loadIcon(addemployeeSvg),
  edit: loadIcon(editSvg),
  duplicate: loadIcon(duplicateSvg),
  deactivate: loadIcon(deactivateSvg),
  find: loadIcon(findSvg),
  report: loadIcon(reportSvg)
};

// Small monochrome (currentColor) glyphs for the row context menu -- kept
// inline rather than as their own asset files since, unlike the colorful
// toolbar tiles above, a compact text-row menu calls for the plain
// single-color line-icon convention every OS/app context menu already uses.
const CONTEXT_MENU_ICONS = {
  detail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  paste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/></svg>'
};

const DEPARTMENTS = ['Semua', 'Technology', 'Human Resources', 'Finance', 'Operations', 'Marketing'];

class WinEmployeeManagement extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = `${WiseI18n.t('MANAJEMEN_KARYAWAN')} — Wise HRIS`;
    this.appTitle = options.appTitle || WiseI18n.t('MANAJEMEN_KARYAWAN');
    this.appIcon = options.appIcon || '👤';
    this.width = options.width || '88%';
    this.height = options.height || 700;
    this.positionX = options.positionX !== undefined ? options.positionX : 70;
    this.positionY = options.positionY !== undefined ? options.positionY : 50;

    this.selectedEmployeeId = null;
    this.currentEmployeeData = null;
    this.cachedEmployees = [];
  }

  onWindowInit() {
    this.controls = [];

    // ── Icon Menu Group Toolbar ─────────────────────────────────
    const iconMenuGroup = new WiseIconMenuGroup('', [
      new WiseIconMenu(WiseI18n.t('MENU_DISPLAY_ALL'), {
        id: 'btnMenuDisplayAll',
        icon: MENU_ICONS.displayAll,
        description: WiseI18n.t('MENU_DISPLAY_ALL_DESC'),
        onClick: this.onDisplayAllClick.bind(this)
      }),
      new WiseIconMenu(WiseI18n.t('MENU_SELECT_ALL'), {
        id: 'btnMenuSelectAll',
        icon: MENU_ICONS.selectAll,
        description: WiseI18n.t('MENU_SELECT_ALL_DESC'),
        onClick: this.onToggleSelectAllClick.bind(this)
      }),
      new WiseVerticalSeparator({ height: 26 }),
      new WiseIconMenu(WiseI18n.t('MENU_EMPLOYEE_DETAIL'), {
        id: 'btnMenuDetail',
        icon: MENU_ICONS.detail,
        description: WiseI18n.t('MENU_EMPLOYEE_DETAIL_DESC'),
        onClick: this.onDetailEmployeeClick.bind(this)
      }),
      new WiseIconMenu(WiseI18n.t('MENU_EMPLOYEE_ADD'), {
        id: 'btnMenuAdd',
        icon: MENU_ICONS.add,
        description: WiseI18n.t('MENU_EMPLOYEE_ADD_DESC'),
        onClick: this.onNewEmployeeClick.bind(this)
      }),
      new WiseIconMenu(WiseI18n.t('MENU_EMPLOYEE_EDIT'), {
        id: 'btnMenuEdit',
        icon: MENU_ICONS.edit,
        description: WiseI18n.t('MENU_EMPLOYEE_EDIT_DESC'),
        onClick: this.onEditEmployeeClick.bind(this)
      }),
      new WiseIconMenu(WiseI18n.t('MENU_EMPLOYEE_DUPLICATE'), {
        id: 'btnMenuDuplicate',
        icon: MENU_ICONS.duplicate,
        description: WiseI18n.t('MENU_EMPLOYEE_DUPLICATE_DESC'),
        onClick: this.onDuplicateEmployeeClick.bind(this)
      }),
      new WiseIconMenu(WiseI18n.t('MENU_EMPLOYEE_DEACTIVATE'), {
        id: 'btnMenuDeactivate',
        icon: MENU_ICONS.deactivate,
        description: WiseI18n.t('MENU_EMPLOYEE_DEACTIVATE_DESC'),
        onClick: this.onToggleDeactivate.bind(this)
      }),
      new WiseIconMenu(WiseI18n.t('MENU_EMPLOYEE_FIND'), {
        id: 'btnMenuFind',
        icon: MENU_ICONS.find,
        description: WiseI18n.t('MENU_EMPLOYEE_FIND_DESC'),
        onClick: this.onFindEmployeeMenuClick.bind(this)
      }),
      new WiseVerticalSeparator({ height: 26 }),
      new WiseIconMenu(WiseI18n.t('MENU_REPORT'), {
        id: 'btnMenuReport',
        icon: MENU_ICONS.report,
        description: WiseI18n.t('MENU_REPORT_DESC'),
        onClick: this.onReportClick.bind(this)
      })
    ], {
      id: 'groupIconMenu',
      layout: 'horizontal',
      // Overrides WiseIconMenuGroup's default "card" look (bg-white/70,
      // backdrop-blur-md, border, shadow-xs) -- inline style wins over those
      // Tailwind classes without having to touch the shared control (which
      // other apps may still want the card look on). backdropFilter alone
      // can still read as a boxed container even with a transparent
      // background (it blurs whatever's behind it), so it's cleared too.
      style: {
        marginBottom: '10px',
        position: 'relative',
        zIndex: 40,
        backgroundColor: 'transparent',
        backdropFilter: 'none',
        border: 'none',
        boxShadow: 'none'
      }
    });

    this.addControl(iconMenuGroup);

    // ── Employee Data Table ─────────────────────────────────────
    const dtEmployees = new WiseDataTable({
      id: 'dtEmployees',
      pageSize: 12,
      pageSizeOptions: [8, 12, 20, 50],
      maxHeight: '58vh',
      onDataFilterChanged: this.onTableFilterChanged.bind(this),
      onRowSelect: this.onEmployeeRowSelect.bind(this)
    });

    dtEmployees.setColumns([
      { dataField: 'nik', header: 'NIK', width: 120 },
      { dataField: 'fullName', header: 'Nama Lengkap', width: 200 },
      { dataField: 'jobTitle', header: 'Jabatan', width: 160 },
      { dataField: 'department', header: 'Departemen', width: 130 },
      { dataField: 'employmentStatus', header: 'Status Kepegawaian', width: 150 },
      { dataField: 'statusBadge', header: 'Status', width: 90 },
      { dataField: 'tenureText', header: 'Masa Kerja', width: 140 }
    ]);

    // ── Filter Bar ───────────────────────────────────────────────
    dtEmployees.addFilters([
      {
        id: 'search',
        type: 'text',
        label: WiseI18n.t('NAMA_NIK'),
        placeholder: WiseI18n.t('CARI_NAMA_ATAU_NIK'),
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'jobTitle',
        type: 'text',
        label: WiseI18n.t('JABATAN'),
        placeholder: WiseI18n.t('CARI_JABATAN'),
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'department',
        type: 'select',
        label: WiseI18n.t('DEPARTEMEN'),
        items: [
          { value: '', label: WiseI18n.t('SEMUA_DEPARTEMEN') },
          { value: 'Technology', label: 'Technology' },
          { value: 'Human Resources', label: 'Human Resources' },
          { value: 'Finance', label: 'Finance' },
          { value: 'Operations', label: 'Operations' },
          { value: 'Marketing', label: 'Marketing' }
        ],
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'employmentStatus',
        type: 'select',
        label: WiseI18n.t('STATUS_KEPEGAWAIAN'),
        items: [
          { value: '', label: WiseI18n.t('SEMUA_STATUS') },
          { value: 'Tetap (PKWTT)', label: WiseI18n.t('TETAP_PKWTT') },
          { value: 'Kontrak (PKWT)', label: WiseI18n.t('KONTRAK_PKWT') },
          { value: 'Probation / Masa Percobaan', label: WiseI18n.t('PROBATION_MASA_PERCOBAAN') },
          { value: 'Magang (Internship)', label: WiseI18n.t('MAGANG_INTERNSHIP') },
          { value: 'Freelance / Mitra', label: WiseI18n.t('FREELANCE_MITRA') },
          { value: 'Konsultan', label: WiseI18n.t('KONSULTAN') }
        ],
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'isActive',
        type: 'select',
        label: WiseI18n.t('STATUS'),
        items: [
          { value: '', label: WiseI18n.t('SEMUA') },
          { value: 'true', label: WiseI18n.t('AKTIF') },
          { value: 'false', label: WiseI18n.t('NONAKTIF') }
        ],
        onChange: this.onTableFilterInputChanged.bind(this)
      }
    ]);

    dtEmployees.addContextMenu([
      { id: 'detail', label: WiseI18n.t('DETAIL'), icon: CONTEXT_MENU_ICONS.detail, onClick: (row) => this.onDetailEmployeeClick(row) },
      { id: 'edit', label: WiseI18n.t('EDIT'), icon: CONTEXT_MENU_ICONS.edit, onClick: (row) => this.onEditEmployeeClick(row) },
      { id: 'duplicate', label: WiseI18n.t('MENU_EMPLOYEE_DUPLICATE'), icon: CONTEXT_MENU_ICONS.copy, onClick: this.onDuplicateEmployeeClick.bind(this) },
    ]);

    this.addControl(dtEmployees);

    // ── Selection Info ───────────────────────────────────────────
    this.addControl(new WiseLabel('', {
      id: 'lblSelectedInfo',
      style: { marginTop: '8px', color: '#475569', fontWeight: 600 }
    }));

    return this;
  }

  async loadInitialData() {
    try {
      await Promise.all([
        this.loadDepartmentFilterItems(),
        this.loadEmploymentStatusFilterItems()
      ]);
      await this.loadEmployeesTable();
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR_KONEKSI_BACKEND'), err.message, 'error');
    }
  }

  // Department filter = root organizations from master data (same source as
  // the Department combobox in the employee edit form). Failures are
  // non-fatal: the filter just keeps its current items.
  async loadDepartmentFilterItems() {
    try {
      const res = await api.listOrganizations({ isActive: 'true', sortBy: 'sortOrder', sortOrder: 'ASC' });
      const roots = (res.rows || []).filter((o) => !o.parentId);
      const filter = this.dtEmployees && (this.dtEmployees.filterControls || []).find((f) => f.id === 'department');
      if (filter) {
        filter.items = [
          { value: '', label: WiseI18n.t('SEMUA_DEPARTEMEN') },
          ...roots.map((o) => ({ value: o.name, label: o.name }))
        ];
      }
    } catch (err) {
      // keep existing filter items
    }
  }

  // Employment status filter = master data (EMPLOYMENT_STATUS)
  async loadEmploymentStatusFilterItems() {
    try {
      const res = await api.listMasterData({
        dataType: 'EMPLOYMENT_STATUS',
        isActive: 'true',
        sortBy: 'sortOrder',
        sortOrder: 'ASC'
      });
      const rows = res.rows || [];
      const filter = this.dtEmployees && (this.dtEmployees.filterControls || []).find((f) => f.id === 'employmentStatus');
      if (filter && rows.length > 0) {
        filter.items = [
          { value: '', label: WiseI18n.t('SEMUA_STATUS') },
          ...rows.map((item) => ({ value: item.name, label: item.name }))
        ];
      }
    } catch (err) {
      // keep existing filter items
    }
  }

  async loadEmployeesTable(page = 1, limit = 12, filters = {}) {
    try {
      const res = await api.listEmployees({
        page,
        limit,
        search: filters.search || '',
        department: filters.department || 'Semua',
        jobTitle: filters.jobTitle || '',
        employmentStatus: filters.employmentStatus || 'Semua',
        isActive: filters.isActive !== undefined && filters.isActive !== '' ? filters.isActive : 'Semua'
      });

      this.cachedEmployees = res.rows || [];
      const totalCount = res.meta?.total || this.cachedEmployees.length;

      // Client-side jabatan filter (API may not support it -- safe to filter locally
      // when the field isn't passed through as a server param)
      const jobTitleFilter = (filters.jobTitle || '').toLowerCase().trim();
      const filtered = jobTitleFilter
        ? this.cachedEmployees.filter(emp =>
            (emp.jobTitle || '').toLowerCase().includes(jobTitleFilter)
          )
        : this.cachedEmployees;

      const formattedRows = filtered.map(emp => ({
        ...emp,
        statusBadge: emp.isActive ? WiseI18n.t('AKTIF') : WiseI18n.t('NONAKTIF'),
        tenureText: emp.tenure?.formatted || '-'
      }));

      this.dtEmployees.pageSize = limit;
      this.dtEmployees.currentPage = page;
      this.dtEmployees.setData(formattedRows, jobTitleFilter ? formattedRows.length : totalCount);

      // Persist current filters so pager navigation keeps them
      this._currentFilters = filters;
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MEMUAT_KARYAWAN'), err.message, 'error');
    }
  }

  async onTableFilterChanged(pageSize, page) {
    await this.loadEmployeesTable(page, pageSize, this._currentFilters || {});
  }

  // Called by the filter bar whenever any filter input changes.
  // `filterValues` is a map of { [filterId]: value } for every filter.
  async onTableFilterInputChanged(filterValues) {
    // Strip internal metadata added by WiseDataTable
    const { _triggerId, ...filters } = filterValues;
    await this.loadEmployeesTable(1, this.dtEmployees ? this.dtEmployees.pageSize : 12, filters);
  }

  onEmployeeRowSelect(row, selectedRows = []) {
    const rows = selectedRows && selectedRows.length > 0 ? selectedRows : (row ? [row] : []);
    if (rows.length === 0) {
      this.selectedEmployeeId = null;
      this.currentEmployeeData = null;
      if (this.lblSelectedInfo) {
        this.lblSelectedInfo.text(WiseI18n.t('TIDAK_ADA_KARYAWAN_YANG_DIPILIH'));
      }
      return;
    }

    const primaryRow = row || rows[0];
    this.selectedEmployeeId = primaryRow.id;
    this.currentEmployeeData = primaryRow;

    if (this.lblSelectedInfo) {
      if (rows.length === (this.cachedEmployees ? this.cachedEmployees.length : 0) && rows.length > 1) {
        this.lblSelectedInfo.text(`${WiseI18n.t('SEMUA_KARYAWAN_TERPILIH_COUNT_INFO')} (${rows.length})`);
      } else if (rows.length > 1) {
        this.lblSelectedInfo.text(`${rows.length} ${WiseI18n.t('KARYAWAN_TERPILIH_COUNT_INFO')} (${WiseI18n.t('AKTIF_TITIK_DUA')} ${primaryRow.fullName})`);
      } else {
        this.lblSelectedInfo.text(`${WiseI18n.t('KARYAWAN_TERPILIH_TITIK_DUA')} ${primaryRow.fullName} (${primaryRow.nik}) — ${primaryRow.jobTitle}`);
      }
    }
  }

  async onEditEmployeeClick(row) {
    const targetRow = (row && (row.id || row.nik) ? row : null) || (this.dtEmployees ? this.dtEmployees.getSelectedRow() : null) || this.currentEmployeeData || (this.selectedEmployeeId ? { id: this.selectedEmployeeId } : null);
    if (!targetRow || (!targetRow.id && !targetRow.nik)) {
      return this.showInfo(WiseI18n.t('PILIH_KARYAWAN'), WiseI18n.t('PILIH_KARYAWAN_EDIT_MSG'), 'warning');
    }
    const empId = targetRow.id || targetRow.nik;
    this.selectedEmployeeId = empId;
    this.currentEmployeeData = targetRow;
    await this.openWindow(WinEmployeeEdit, { employeeId: empId });
  }

  async openDetailWindow(employeeId) {
    await this.openWindow(WinEmployeeDetail, { employeeId });
  }

  async onDuplicateEmployeeClick(row) {
    const targetRow = row || (this.dtEmployees ? this.dtEmployees.getSelectedRow() : null) || this.currentEmployeeData;
    if (!targetRow) return;
    this.selectedEmployeeId = targetRow.id;
  }



  // Keeps the copied employee's fields in memory only (not the OS
  // clipboard) -- Paste turns it into a brand new employee record, so id/nik
  // and this table's own display-only fields (statusBadge, tenureText,
  // virtual tenure/totalSalary) are stripped since they either must be
  // unique or aren't real columns to send back to the API.
  onCopyEmployeeRow(row) {
    const targetRow = row || (this.dtEmployees ? this.dtEmployees.getSelectedRow() : null) || this.currentEmployeeData;
    if (!targetRow) return;
    const { id, nik, tenure, totalSalary, statusBadge, tenureText, createdAt, updatedAt, ...copyable } = targetRow;
    this.copiedEmployee = copyable;
    this.showInfo(WiseI18n.t('DISALIN_TITLE'), `${WiseI18n.t('DATA_KARYAWAN')} "${targetRow.fullName}" ${WiseI18n.t('DISALIN_PASTE_INFO')}`, 'information');
  }

  async onPasteEmployeeRow() {
    if (!this.copiedEmployee) {
      return this.showInfo(WiseI18n.t('BELUM_ADA_SALINAN'), WiseI18n.t('SALINAN_PASTE_WARNING'), 'warning');
    }
    try {
      const suffix = Date.now().toString().slice(-6);
      const newEmployee = {
        ...this.copiedEmployee,
        fullName: `${this.copiedEmployee.fullName} (Copy)`,
        nik: `COPY-${suffix}`
      };
      await api.createEmployee(newEmployee);
      await this.loadEmployeesTable(this.dtEmployees.currentPage, this.dtEmployees.pageSize, this._currentFilters || {});
      this.showInfo(WiseI18n.t('BERHASIL_DITEMPEL'), `${WiseI18n.t('KARYAWAN_BARU')} "${newEmployee.fullName}" (${newEmployee.nik}) ${WiseI18n.t('BERHASIL_DIBUAT_DARI_SALINAN')}`, 'success');
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_PASTE'), err.message, 'error');
    }
  }

  async onDisplayAllClick() {
    // Clear all active filters and reload the full dataset
    this._currentFilters = {};
    if (this.dtEmployees) {
      this.dtEmployees.clearFilterValues();
    }
    await this.loadEmployeesTable(1, this.dtEmployees ? this.dtEmployees.pageSize : 12, {});
  }

  async onToggleSelectAllClick() {
    if (!this.dtEmployees) return;

    if (this.dtEmployees.isAllSelected()) {
      this.dtEmployees.deselectAll();
      this.selectedEmployeeId = null;
      this.currentEmployeeData = null;
      if (this.lblSelectedInfo) {
        this.lblSelectedInfo.text(WiseI18n.t('PILIHAN_KARYAWAN_DIBATALKAN'));
      }
    } else {
      this.dtEmployees.selectAll();
      const selectedRows = this.dtEmployees.getSelectedRows();
      if (selectedRows.length > 0) {
        this.selectedEmployeeId = selectedRows[0].id;
        this.currentEmployeeData = selectedRows[0];
        if (this.lblSelectedInfo) {
          this.lblSelectedInfo.text(`${WiseI18n.t('SEMUA_KARYAWAN_TERPILIH_COUNT_INFO')} (${selectedRows.length})`);
        }
      }
    }
  }

  async onDetailEmployeeClick(row) {
    const targetRow = row || (this.dtEmployees ? this.dtEmployees.getSelectedRow() : null) || this.currentEmployeeData;
    const selectedRows = this.dtEmployees ? this.dtEmployees.getSelectedRows() : [];
    const emp = targetRow || (selectedRows.length > 0 ? selectedRows[0] : null);
    const empId = (emp ? (emp.id || emp.nik) : null) || this.selectedEmployeeId;

    if (!empId) {
      return this.showInfo(WiseI18n.t('PILIH_KARYAWAN'), WiseI18n.t('PILIH_KARYAWAN_DETAIL_MSG'), 'warning');
    }
    await this.openWindow(WinEmployeeDetail, { employeeId: empId });
  }

  async onNewEmployeeClick() {
    await this.openWindow(WinEmployeeEdit, { employeeId: null });
  }

  async onToggleDeactivate() {
    const selectedRow = this.dtEmployees ? this.dtEmployees.getSelectedRow() : null;
    const empId = this.selectedEmployeeId || (selectedRow ? selectedRow.id : null);

    if (!empId) {
      return this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('PILIH_KARYAWAN_TERLEBIH_DAHULU'), 'warning');
    }
    try {
      const emp = await api.getEmployeeById(empId);
      const isActive = emp?.isActive;
      if (isActive) {
        await api.deactivateEmployee(this.selectedEmployeeId, {
          status: 'Nonaktif',
          reason: 'Status dinonaktifkan oleh administrator melalui Employee Management'
        });
        this.showInfo(WiseI18n.t('KARYAWAN_DINONAKTIFKAN'), `${emp.fullName} ${WiseI18n.t('BERHASIL_DINONAKTIFKAN')}.`, 'warning');
      } else {
        await api.activateEmployee(this.selectedEmployeeId);
        this.showInfo(WiseI18n.t('KARYAWAN_DIAKTIFKAN'), `${emp.fullName} ${WiseI18n.t('BERHASIL_DIAKTIFKAN')}.`, 'success');
      }
      await this.loadEmployeesTable(this.dtEmployees.currentPage, this.dtEmployees.pageSize, this._currentFilters || {});
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENGUBAH_STATUS'), err.message, 'error');
    }
  }

  async onFindEmployeeMenuClick() {
    await this.loadEmployeesTable(1, this.dtEmployees ? this.dtEmployees.pageSize : 12);
    this.showInfo(WiseI18n.t('REFRESH'), WiseI18n.t('DATA_KARYAWAN_TELAH_DISEGARKAN'), 'information');
  }

  async onReportClick() {
    try {
      const stats = await api.getStatistics();
      if (!stats) return this.showInfo(WiseI18n.t('LAPORAN_RINGKASAN'), WiseI18n.t('DATA_STATISTIK_BELUM_TERSEDIA'), 'warning');

      const deptBreakdown = Object.entries(stats.byDepartment || {})
        .map(([dept, count]) => `• ${dept}: ${count} ${WiseI18n.t('ORANG')}`).join('\n');
      const statusBreakdown = Object.entries(stats.byStatus || {})
        .map(([status, count]) => `• ${status}: ${count} ${WiseI18n.t('ORANG')}`).join('\n');

      const message = [
        `📊 ${WiseI18n.t('TOTAL_KARYAWAN_LABEL')}: ${stats.totalEmployees || 0} ${WiseI18n.t('ORANG')}`,
        `🟢 ${WiseI18n.t('STATUS_AKTIF_LABEL')}: ${stats.activeEmployees || 0} ${WiseI18n.t('ORANG')}`,
        `🔴 ${WiseI18n.t('STATUS_NONAKTIF_LABEL')}: ${stats.inactiveEmployees || 0} ${WiseI18n.t('ORANG')}`,
        '',
        `🏢 ${WiseI18n.t('JUMLAH_PER_DEPARTEMEN_LABEL')}:`,
        deptBreakdown || WiseI18n.t('BELUM_ADA_DATA'),
        '',
        `💼 ${WiseI18n.t('STATUS_KEPEGAWAIAN_LABEL')}:`,
        statusBreakdown || WiseI18n.t('BELUM_ADA_DATA')
      ].join('\n');

      this.showInfo(WiseI18n.t('LAPORAN_RINGKASAN_KARYAWAN'), message, 'information');
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MEMUAT_LAPORAN'), err.message, 'error');
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

export default WinEmployeeManagement;
