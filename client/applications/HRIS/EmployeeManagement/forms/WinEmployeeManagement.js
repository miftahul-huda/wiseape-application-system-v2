const fs = require('fs');
const path = require('path');

const WiseWindow = require('../../../../system/WiseWindow');
const WiseLabel = require('../../../../system/controls/WiseLabel');
const WiseDataTable = require('../../../../system/controls/WiseDataTable');
const WiseIconMenu = require('../../../../system/controls/WiseIconMenu');
const WiseIconMenuGroup = require('../../../../system/controls/WiseIconMenuGroup');
const WiseVerticalSeparator = require('../../../../system/controls/WiseVerticalSeparator');

const HrisApiRepository = require('../services/HrisApiRepository');
const api = new HrisApiRepository();

// Toolbar icons live as their own .svg files (assets/icons/) so a designer
// can restyle them without touching this file -- read once at module load
// and inlined as markup, since WiseIconMenu renders an `icon` starting with
// "<svg" directly rather than fetching it as an <img> src.
const ICONS_DIR = path.join(__dirname, '..', 'assets', 'icons');
const loadIcon = (fileName) => fs.readFileSync(path.join(ICONS_DIR, fileName), 'utf8');
const MENU_ICONS = {
  displayAll: loadIcon('display-all.svg'),
  selectAll: loadIcon('select-all.svg'),
  detail: loadIcon('detail.svg'),
  add: loadIcon('add.svg'),
  deactivate: loadIcon('deactivate.svg'),
  find: loadIcon('find.svg'),
  report: loadIcon('report.svg')
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
      maxHeight: '65vh',
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

    dtEmployees.addContextMenu([
      { id: 'detail', label: 'Detail', onClick: (row) => this.onEditEmployeeClick(row) },
      { id: 'edit', label: 'Edit', onClick: (row) => this.onEditEmployeeClick(row) },
      { id: 'copy', label: 'Copy', onClick: (row) => this.onCopyEmployeeRow(row) },
      { id: 'paste', label: 'Paste', onClick: () => this.onPasteEmployeeRow() }
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

  async loadEmployeesTable(page = 1, limit = 12) {
    try {
      const res = await api.listEmployees({ page, limit });

      this.cachedEmployees = res.rows || [];
      const totalCount = res.meta?.total || this.cachedEmployees.length;

      const formattedRows = this.cachedEmployees.map(emp => ({
        ...emp,
        statusBadge: emp.isActive ? '🟢 Aktif' : '🔴 Nonaktif',
        tenureText: emp.tenure?.formatted || '-'
      }));

      this.dtEmployees.pageSize = limit;
      this.dtEmployees.currentPage = page;
      this.dtEmployees.setData(formattedRows, totalCount);
    } catch (err) {
      this.showInfo('Gagal Memuat Karyawan', err.message, 'error');
    }
  }

  async onTableFilterChanged(pageSize, page) {
    await this.loadEmployeesTable(page, pageSize);
  }

  onEmployeeRowSelect(row) {
    if (!row) return;
    this.selectedEmployeeId = row.id;
    this.currentEmployeeData = row;
    if (this.lblSelectedInfo) {
      this.lblSelectedInfo.text(`Karyawan Terpilih: ${row.fullName} (${row.nik}) — ${row.jobTitle}`);
    }
  }

  async onEditEmployeeClick(row) {
    if (!row) return;
    this.selectedEmployeeId = row.id;
    this.currentEmployeeData = row;
    await this.openDetailWindow(row.id);
  }

  async openDetailWindow(employeeId) {
    this.launchApp('employeeDetail', { employeeId });
  }

  // Keeps the copied employee's fields in memory only (not the OS
  // clipboard) -- Paste turns it into a brand new employee record, so id/nik
  // and this table's own display-only fields (statusBadge, tenureText,
  // virtual tenure/totalSalary) are stripped since they either must be
  // unique or aren't real columns to send back to the API.
  onCopyEmployeeRow(row) {
    if (!row) return;
    const { id, nik, tenure, totalSalary, statusBadge, tenureText, createdAt, updatedAt, ...copyable } = row;
    this.copiedEmployee = copyable;
    this.showInfo('Disalin', `Data karyawan "${row.fullName}" disalin. Pilih Paste pada baris mana pun untuk menduplikasinya sebagai karyawan baru.`, 'information');
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
      await this.loadEmployeesTable(this.dtEmployees.currentPage, this.dtEmployees.pageSize);
      this.showInfo('Berhasil Ditempel', `Karyawan baru "${newEmployee.fullName}" (${newEmployee.nik}) berhasil dibuat dari data yang disalin.`, 'success');
    } catch (err) {
      this.showInfo('Gagal Paste', err.message, 'error');
    }
  }

  async onDisplayAllClick() {
    await this.loadEmployeesTable(1, this.dtEmployees ? this.dtEmployees.pageSize : 12);
    this.showInfo('Display All', 'Menampilkan seluruh daftar karyawan tanpa filter pencarian.', 'information');
  }

  async onToggleSelectAllClick() {
    const selectedRow = this.dtEmployees ? this.dtEmployees.getSelectedRow() : null;
    const currentId = this.selectedEmployeeId || (selectedRow ? selectedRow.id : null);

    if (currentId) {
      this.selectedEmployeeId = null;
      this.currentEmployeeData = null;
      if (this.dtEmployees) this.dtEmployees.setSelectedRowIndex(null);
      if (this.lblSelectedInfo) this.lblSelectedInfo.text('Tidak ada karyawan yang dipilih.');
      this.showInfo('Deselect', 'Pilihan karyawan telah dibatalkan.', 'information');
    } else if (this.cachedEmployees && this.cachedEmployees.length > 0) {
      const first = this.cachedEmployees[0];
      this.selectedEmployeeId = first.id;
      this.currentEmployeeData = first;
      if (this.dtEmployees) this.dtEmployees.setSelectedRowIndex(0);
      if (this.lblSelectedInfo) this.lblSelectedInfo.text(`Karyawan Terpilih: ${first.fullName} (${first.nik}) — ${first.jobTitle}`);
      this.showInfo('Select Employee', `Karyawan terpilih: ${first.fullName}`, 'success');
    } else {
      this.showInfo('Peringatan', 'Tidak ada data karyawan pada daftar.', 'warning');
    }
  }

  async onDetailEmployeeClick() {
    const selectedRow = this.dtEmployees ? this.dtEmployees.getSelectedRow() : null;
    const empId = this.selectedEmployeeId || (selectedRow ? selectedRow.id : null);

    if (!empId) {
      return this.showInfo('Pilih Karyawan', 'Silakan pilih karyawan dari daftar terlebih dahulu.', 'warning');
    }
    await this.openDetailWindow(empId);
  }

  async onNewEmployeeClick() {
    // Open detail window without an id (add mode)
    this.launchApp('employeeDetail', { employeeId: null });
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
      await this.loadEmployeesTable(this.dtEmployees.currentPage, this.dtEmployees.pageSize);
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
