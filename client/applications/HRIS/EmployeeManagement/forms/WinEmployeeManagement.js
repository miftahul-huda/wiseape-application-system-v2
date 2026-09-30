const fs = require('fs');
const path = require('path');

const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseIconMenu = require('../../../../system/controls/WiseIconMenu');
const WiseIconMenuGroup = require('../../../../system/controls/WiseIconMenuGroup');
const WiseVerticalSeparator = require('../../../../system/controls/WiseVerticalSeparator');

const WinEmployeeDetail = require('./WinEmployeeDetail');
const WinEmployeeEdit = require('./WinEmployeeEdit');

const HrisApiRepository = require('../services/HrisApiRepository');
const api = new HrisApiRepository();

// Toolbar icons live as their own .svg files (assets/icons/) so a designer
// can restyle them without touching this file -- read once at module load
// and inlined as markup, since WiseIconMenu renders an `icon` starting with
// "<svg" directly rather than fetching it as an <img> src.
//
// Strip any XML declaration (<?xml ... ?>) and XML/HTML comments (<!-- ... -->)
// that tools like VTracer prepend -- WiseIconMenu.renderElement detects SVG
// markup via `iconSrc.startsWith('<svg')`, so the string MUST open with <svg.
const ICONS_DIR = path.join(__dirname, '..', 'assets', 'icons');
const loadIcon = (fileName) => {
  const raw = fs.readFileSync(path.join(ICONS_DIR, fileName), 'utf8');
  return raw
    .replace(/<\?xml[^?]*\?>/gi, '')   // strip <?xml ... ?>
    .replace(/<!--[\s\S]*?-->/g, '')    // strip <!-- ... --> comments
    .trim();
};
const MENU_ICONS = {
  displayAll: loadIcon('display-all.svg'),
  selectAll: loadIcon('select-all.svg'),
  detail: loadIcon('detail.svg'),
  add: loadIcon('addemployee.svg'),
  edit: loadIcon('edit.svg'),
  duplicate: loadIcon('duplicate.svg'),

  deactivate: loadIcon('deactivate.svg'),
  find: loadIcon('find.svg'),
  report: loadIcon('report.svg')
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
    this.title = 'Employee Management — Wise HRIS';
    this.appTitle = options.appTitle || 'Employee Management';
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
      new WiseIconMenu('Display All', {
        id: 'btnMenuDisplayAll',
        icon: MENU_ICONS.displayAll,
        description: 'Tampilkan Semua',
        onClick: this.onDisplayAllClick.bind(this)
      }),
      new WiseIconMenu('Select/Deselect All', {
        id: 'btnMenuSelectAll',
        icon: MENU_ICONS.selectAll,
        description: 'Pilih / Batal',
        onClick: this.onToggleSelectAllClick.bind(this)
      }),
      new WiseVerticalSeparator({ height: 26 }),
      new WiseIconMenu('Detail Employee', {
        id: 'btnMenuDetail',
        icon: MENU_ICONS.detail,
        description: 'Lihat Detail',
        onClick: this.onDetailEmployeeClick.bind(this)
      }),
      new WiseIconMenu('Add Employee', {
        id: 'btnMenuAdd',
        icon: MENU_ICONS.add,
        description: 'Karyawan Baru',
        onClick: this.onNewEmployeeClick.bind(this)
      }),
      new WiseIconMenu('Edit Employee', {
        id: 'btnMenuEdit',
        icon: MENU_ICONS.edit,
        description: 'Edit Employee Information',
        onClick: this.onEditEmployeeClick.bind(this)
      }),
      new WiseIconMenu('Duplicate Employee', {
        id: 'btnMenuDuplicate',
        icon: MENU_ICONS.duplicate,
        description: 'Duplikat Data Karyawan',
        onClick: this.onDuplicateEmployeeClick.bind(this)
      }),
      new WiseIconMenu('Deactivate Employee', {
        id: 'btnMenuDeactivate',
        icon: MENU_ICONS.deactivate,
        description: 'Status Aktif',
        onClick: this.onToggleDeactivate.bind(this)
      }),
      new WiseIconMenu('Find Employee', {
        id: 'btnMenuFind',
        icon: MENU_ICONS.find,
        description: 'Cari Karyawan',
        onClick: this.onFindEmployeeMenuClick.bind(this)
      }),
      new WiseVerticalSeparator({ height: 26 }),
      new WiseIconMenu('Report', {
        id: 'btnMenuReport',
        icon: MENU_ICONS.report,
        description: 'Laporan Ringkasan',
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
        label: 'Nama / NIK',
        placeholder: 'Cari nama atau NIK…',
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'jobTitle',
        type: 'text',
        label: 'Jabatan',
        placeholder: 'Cari jabatan…',
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'department',
        type: 'select',
        label: 'Departemen',
        items: [
          { value: '', label: 'Semua Departemen' },
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
        label: 'Status Kepegawaian',
        items: [
          { value: '', label: 'Semua Status' },
          { value: 'Tetap', label: 'Tetap' },
          { value: 'Kontrak', label: 'Kontrak' },
          { value: 'Magang', label: 'Magang' },
          { value: 'Freelance', label: 'Freelance' }
        ],
        onChange: this.onTableFilterInputChanged.bind(this)
      },
      {
        id: 'isActive',
        type: 'select',
        label: 'Status',
        items: [
          { value: '', label: 'Semua' },
          { value: 'true', label: '🟢 Aktif' },
          { value: 'false', label: '🔴 Nonaktif' }
        ],
        onChange: this.onTableFilterInputChanged.bind(this)
      }
    ]);

    dtEmployees.addContextMenu([
      { id: 'detail', label: 'Detail', icon: CONTEXT_MENU_ICONS.detail, onClick: (row) => this.onDetailEmployeeClick(row) },
      { id: 'edit', label: 'Edit', icon: CONTEXT_MENU_ICONS.edit, onClick: (row) => this.onEditEmployeeClick(row) },
      { id: 'copy', label: 'Copy', icon: CONTEXT_MENU_ICONS.copy, onClick: (row) => this.onCopyEmployeeRow(row) },
      { id: 'paste', label: 'Paste', icon: CONTEXT_MENU_ICONS.paste, onClick: () => this.onPasteEmployeeRow() }
    ]);

    this.addControl(dtEmployees);

    // ── Selection Info ───────────────────────────────────────────
    this.addControl(new WiseLabel('', {
      id: 'lblSelectedInfo',
      style: { fontSize: 12, marginTop: '8px', color: '#475569', fontWeight: 600 }
    }));

    return this;
  }

  async loadInitialData() {
    try {
      await this.loadEmployeesTable();
    } catch (err) {
      this.showInfo('Error Koneksi Backend', err.message, 'error');
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
        statusBadge: emp.isActive ? '🟢 Aktif' : '🔴 Nonaktif',
        tenureText: emp.tenure?.formatted || '-'
      }));

      this.dtEmployees.pageSize = limit;
      this.dtEmployees.currentPage = page;
      this.dtEmployees.setData(formattedRows, jobTitleFilter ? formattedRows.length : totalCount);

      // Persist current filters so pager navigation keeps them
      this._currentFilters = filters;
    } catch (err) {
      this.showInfo('Gagal Memuat Karyawan', err.message, 'error');
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
        this.lblSelectedInfo.text('Tidak ada karyawan yang dipilih.');
      }
      return;
    }

    const primaryRow = row || rows[0];
    this.selectedEmployeeId = primaryRow.id;
    this.currentEmployeeData = primaryRow;

    if (this.lblSelectedInfo) {
      if (rows.length === (this.cachedEmployees ? this.cachedEmployees.length : 0) && rows.length > 1) {
        this.lblSelectedInfo.text(`Semua karyawan terpilih (${rows.length} karyawan)`);
      } else if (rows.length > 1) {
        this.lblSelectedInfo.text(`${rows.length} karyawan terpilih (Aktif: ${primaryRow.fullName})`);
      } else {
        this.lblSelectedInfo.text(`Karyawan Terpilih: ${primaryRow.fullName} (${primaryRow.nik}) — ${primaryRow.jobTitle}`);
      }
    }
  }

  async onEditEmployeeClick(row) {
    const targetRow = row || (this.dtEmployees ? this.dtEmployees.getSelectedRow() : null) || this.currentEmployeeData;
    if (!targetRow) {
      return this.showInfo('Pilih Karyawan', 'Silakan pilih karyawan dari daftar terlebih dahulu untuk mengedit.', 'warning');
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
    this.showInfo('Disalin', `Data karyawan "${targetRow.fullName}" disalin. Pilih Paste pada baris mana pun untuk menduplikasinya sebagai karyawan baru.`, 'information');
  }

  async onPasteEmployeeRow() {
    if (!this.copiedEmployee) {
      return this.showInfo('Belum Ada Salinan', 'Gunakan menu Copy pada sebuah baris terlebih dahulu sebelum Paste.', 'warning');
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
      this.showInfo('Berhasil Ditempel', `Karyawan baru "${newEmployee.fullName}" (${newEmployee.nik}) berhasil dibuat dari data yang disalin.`, 'success');
    } catch (err) {
      this.showInfo('Gagal Paste', err.message, 'error');
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
        this.lblSelectedInfo.text('Pilihan karyawan telah dibatalkan.');
      }
    } else {
      this.dtEmployees.selectAll();
      const selectedRows = this.dtEmployees.getSelectedRows();
      if (selectedRows.length > 0) {
        this.selectedEmployeeId = selectedRows[0].id;
        this.currentEmployeeData = selectedRows[0];
        if (this.lblSelectedInfo) {
          this.lblSelectedInfo.text(`Semua karyawan terpilih (${selectedRows.length} karyawan)`);
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
      return this.showInfo('Pilih Karyawan', 'Silakan pilih karyawan dari daftar terlebih dahulu untuk melihat detail.', 'warning');
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
      return this.showInfo('Peringatan', 'Pilih karyawan terlebih dahulu.', 'warning');
    }
    try {
      const emp = await api.getEmployeeById(empId);
      const isActive = emp?.isActive;
      if (isActive) {
        await api.deactivateEmployee(this.selectedEmployeeId, {
          status: 'Nonaktif',
          reason: 'Status dinonaktifkan oleh administrator melalui Employee Management'
        });
        this.showInfo('Karyawan Dinonaktifkan', `${emp.fullName} berhasil dinonaktifkan.`, 'warning');
      } else {
        await api.activateEmployee(this.selectedEmployeeId);
        this.showInfo('Karyawan Diaktifkan', `${emp.fullName} berhasil diaktifkan kembali.`, 'success');
      }
      await this.loadEmployeesTable(this.dtEmployees.currentPage, this.dtEmployees.pageSize, this._currentFilters || {});
    } catch (err) {
      this.showInfo('Gagal Ubah Status', err.message, 'error');
    }
  }

  async onFindEmployeeMenuClick() {
    await this.loadEmployeesTable(1, this.dtEmployees ? this.dtEmployees.pageSize : 12);
    this.showInfo('Refresh', 'Data karyawan telah disegarkan.', 'information');
  }

  async onReportClick() {
    try {
      const stats = await api.getStatistics();
      if (!stats) return this.showInfo('Laporan Ringkasan', 'Data statistik belum tersedia.', 'warning');

      const deptBreakdown = Object.entries(stats.byDepartment || {})
        .map(([dept, count]) => `• ${dept}: ${count} orang`).join('\n');
      const statusBreakdown = Object.entries(stats.byStatus || {})
        .map(([status, count]) => `• ${status}: ${count} orang`).join('\n');

      const message = [
        `📊 TOTAL KARYAWAN: ${stats.totalEmployees || 0} orang`,
        `🟢 Status Aktif: ${stats.activeEmployees || 0} orang`,
        `🔴 Status Nonaktif: ${stats.inactiveEmployees || 0} orang`,
        '',
        '🏢 JUMLAH PER DEPARTEMEN:',
        deptBreakdown || 'Belum ada data',
        '',
        '💼 STATUS KEPEGAWAIAN:',
        statusBreakdown || 'Belum ada data'
      ].join('\n');

      this.showInfo('Laporan Ringkasan Karyawan', message, 'information');
    } catch (err) {
      this.showInfo('Gagal Memuat Laporan', err.message, 'error');
    }
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinEmployeeManagement;
