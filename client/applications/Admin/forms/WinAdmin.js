const WiseWindow = require('../../../system/WiseWindow');
const WiseLabel = require('../../../system/controls/WiseLabel');
const WiseButton = require('../../../system/controls/WiseButton');
const WiseTextBox = require('../../../system/controls/WiseTextBox');
const WiseComboBox = require('../../../system/controls/WiseComboBox');
const WiseCheckboxGroup = require('../../../system/controls/WiseCheckboxGroup');
const WiseTabControl = require('../../../system/controls/WiseTabControl');
const WiseDataTable = require('../../../system/controls/WiseDataTable');
const WiseCardGroup = require('../../../system/controls/WiseCardGroup');
const WiseFrame = require('../../../system/controls/WiseFrame');
const WiseTextArea = require('../../../system/controls/WiseTextArea');

const ApiAuthRepository = require('../../../system/ApiAuthRepository');
const ApiThemeRepository = require('../../../system/ApiThemeRepository');

const authRepository = new ApiAuthRepository();
const themeRepository = new ApiThemeRepository();

function themePreviewSwatch(theme) {
  const bg1 = theme.bg1 || '#1e293b';
  const bg2 = theme.bg2 || '#0f172a';
  const accent = theme.accent || '#3b82f6';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150">
    <defs>
      <linearGradient id="g_${theme.id || 't'}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="100%" stop-color="${bg2}" />
      </linearGradient>
    </defs>
    <rect width="300" height="150" fill="url(#g_${theme.id || 't'})" />
    <circle cx="250" cy="110" r="30" fill="${accent}" opacity="0.85" />
    <rect x="20" y="30" width="120" height="16" rx="4" fill="white" opacity="0.9" />
    <rect x="20" y="56" width="180" height="10" rx="3" fill="white" opacity="0.5" />
    <rect x="20" y="74" width="140" height="10" rx="3" fill="white" opacity="0.5" />
    <rect x="20" y="100" width="70" height="24" rx="6" fill="${accent}" />
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

class WinAdmin extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = 'Admin Panel';
    this.appTitle = options.appTitle || 'Admin';
    this.appIcon = options.appIcon || '🛡';
    this.width = '70%';
    this.height = '640';
    this.requiresApproval = !!options.requiresApproval;
    this.pendingUsers = Array.isArray(options.pendingUsers) ? options.pendingUsers : [];
    this.editingUserId = null;
    this.editingThemeId = null;
  }

  onWindowInit() {
    this.controls = [];

    this.addControl(new WiseLabel('System Administration', {
      id: 'lblAdminHeader',
      style: { fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: '8px' },
    }));

    this.addControl(new WiseCheckboxGroup(
      [{ value: 'auto', label: 'Allow new users to register without admin approval' }],
      {
        id: 'chkAutoApprove',
        value: this.requiresApproval ? [] : ['auto'],
        onChange: this.onRegistrationPolicyChange.bind(this),
        style: { marginBottom: '12px' },
      }
    ));

    const tabControl = new WiseTabControl({
      id: 'adminTabs',
      layout: 'vertical',
      activeIndex: 0,
    });

    // --- TAB 1: USER MANAGEMENT ---
    const userTabControls = [];

    userTabControls.push(new WiseLabel('User Management', {
      id: 'lblUserMgmtTitle',
      style: { fontSize: 16, fontWeight: 700, marginBottom: '8px' },
    }));

    const dtUsers = new WiseDataTable({
      id: 'dtUsers',
      pageSize: 5,
      pageSizeOptions: [5, 10, 20],
      onDataFilterChanged: this.onUsersFilterChanged.bind(this),
    });
    dtUsers.setColumns([
      { dataField: 'id', header: 'ID', width: 50 },
      { dataField: 'name', header: 'Name', width: 140 },
      { dataField: 'email', header: 'Email', width: 180 },
      {
        dataField: 'role', header: 'Role', width: 100, type: 'combobox',
        items: [{ value: 'admin', label: 'Admin' }, { value: 'user', label: 'User' }],
        onChange: this.onUserRoleChange.bind(this),
      },
      { dataField: 'status', header: 'Status', width: 90 },
      {
        dataField: 'approveBtn', header: '', width: 85, sortable: false, type: 'button',
        label: 'Approve', onClick: this.onUserApproveClick.bind(this),
      },
      {
        dataField: 'editBtn', header: '', width: 75, sortable: false, type: 'button',
        label: 'Edit', onClick: this.onUserEditClick.bind(this),
      },
      {
        dataField: 'deleteBtn', header: '', width: 75, sortable: false, type: 'button',
        label: 'Delete', onClick: this.onUserDeleteClick.bind(this),
      },
    ]);
    userTabControls.push(dtUsers);

    const frameEditUser = new WiseFrame('Edit User Details', {
      id: 'frameEditUser',
      visible: false,
      style: { marginTop: '12px' },
    });
    frameEditUser.addControl(new WiseLabel('Full Name', { id: 'lblEditUserName' }));
    frameEditUser.addControl(new WiseTextBox('', { id: 'txtEditUserName', dataField: 'editUserName' }));
    frameEditUser.addControl(new WiseLabel('Email Address', { id: 'lblEditUserEmail' }));
    frameEditUser.addControl(new WiseTextBox('', { id: 'txtEditUserEmail', dataField: 'editUserEmail' }));
    frameEditUser.addControl(new WiseLabel('Role', { id: 'lblEditUserRole' }));
    frameEditUser.addControl(new WiseComboBox(
      [{ value: 'admin', label: 'Admin' }, { value: 'user', label: 'User' }],
      { id: 'cmbEditUserRole', value: 'user', dataField: 'editUserRole' }
    ));
    frameEditUser.addControl(new WiseLabel('Status', { id: 'lblEditUserStatus' }));
    frameEditUser.addControl(new WiseComboBox(
      [{ value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending' }],
      { id: 'cmbEditUserStatus', value: 'active', dataField: 'editUserStatus' }
    ));
    frameEditUser.addControl(new WiseButton('Save Changes', {
      id: 'btnSaveUserEdit',
      style: { marginTop: '8px', marginRight: '6px' },
      onClick: this.onSaveUserEdit.bind(this),
    }));
    frameEditUser.addControl(new WiseButton('Cancel', {
      id: 'btnCancelUserEdit',
      style: { marginTop: '8px' },
      onClick: this.onCancelUserEdit.bind(this),
    }));
    userTabControls.push(frameEditUser);

    tabControl.addTab('User Management', userTabControls, '👥');

    // --- TAB 2: THEME MANAGEMENT ---
    const themeTabControls = [];

    themeTabControls.push(new WiseLabel('Theme Management', {
      id: 'lblThemeMgmtTitle',
      style: { fontSize: 16, fontWeight: 700 },
    }));
    themeTabControls.push(new WiseButton('+ Tambah Theme', {
      id: 'btnCreateTheme',
      style: { marginBottom: '8px', alignSelf: 'flex-start' },
      onClick: this.onOpenCreateTheme.bind(this),
    }));


    const cgThemes = new WiseCardGroup({
      id: 'cgThemes',
      pageSize: 6,
      pageSizeOptions: [6, 12],
      titleField: 'name',
      imageField: 'preview',
      textField: 'summary',
      actions: [
        { id: 'edit', label: 'Edit CSS' },
        { id: 'delete', label: 'Delete', variant: 'danger' },
      ],
      onCardAction: this.onThemeCardAction.bind(this),
      onDataFilterChanged: this.onThemesFilterChanged.bind(this),
    });
    themeTabControls.push(cgThemes);

    const frameThemeEditor = new WiseFrame('Theme Editor', {
      id: 'frameThemeEditor',
      visible: false,
      style: { marginTop: '12px' },
    });
    frameThemeEditor.addControl(new WiseLabel('Theme ID', { id: 'lblThemeId' }));
    frameThemeEditor.addControl(new WiseTextBox('', { id: 'txtThemeId', dataField: 'themeId', placeholder: 'e.g. custom-theme-1' }));
    frameThemeEditor.addControl(new WiseLabel('Theme Name', { id: 'lblThemeName' }));
    frameThemeEditor.addControl(new WiseTextBox('', { id: 'txtThemeName', dataField: 'themeName', placeholder: 'e.g. Ocean Blue' }));
    frameThemeEditor.addControl(new WiseLabel('Background 1 (Hex)', { id: 'lblThemeBg1' }));
    frameThemeEditor.addControl(new WiseTextBox('', { id: 'txtThemeBg1', dataField: 'themeBg1', placeholder: '#1e293b' }));
    frameThemeEditor.addControl(new WiseLabel('Background 2 (Hex)', { id: 'lblThemeBg2' }));
    frameThemeEditor.addControl(new WiseTextBox('', { id: 'txtThemeBg2', dataField: 'themeBg2', placeholder: '#0f172a' }));
    frameThemeEditor.addControl(new WiseLabel('Accent Color', { id: 'lblThemeAccent' }));
    frameThemeEditor.addControl(new WiseTextBox('', { id: 'txtThemeAccent', dataField: 'themeAccent', placeholder: '#3b82f6' }));
    frameThemeEditor.addControl(new WiseLabel('Accent Dark Color', { id: 'lblThemeAccentDark' }));
    frameThemeEditor.addControl(new WiseTextBox('', { id: 'txtThemeAccentDark', dataField: 'themeAccentDark', placeholder: '#1d4ed8' }));
    frameThemeEditor.addControl(new WiseLabel('Custom CSS', { id: 'lblThemeCss' }));
    frameThemeEditor.addControl(new WiseTextArea('', { id: 'txtThemeCss', dataField: 'themeCss', placeholder: '/* Custom CSS rules for theme */', rows: 4 }));
    frameThemeEditor.addControl(new WiseButton('Save Theme', {
      id: 'btnSaveTheme',
      style: { marginTop: '8px', marginRight: '6px' },
      onClick: this.onSaveTheme.bind(this),
    }));
    frameThemeEditor.addControl(new WiseButton('Cancel', {
      id: 'btnCancelTheme',
      style: { marginTop: '8px' },
      onClick: this.onCancelThemeEdit.bind(this),
    }));
    themeTabControls.push(frameThemeEditor);

    tabControl.addTab('Theme Management', themeTabControls, '🎨');

    this.addControl(tabControl);
    return this;
  }

  getToken() {
    return this.system && this.system.currentSession ? this.system.currentSession.token : null;
  }

  async loadInitialData() {
    await Promise.all([
      this.applyUsersPage(this.dtUsers.pageSize, this.dtUsers.currentPage),
      this.applyThemesPage(this.cgThemes.pageSize, this.cgThemes.currentPage),
    ]);
  }

  // --- USER MANAGEMENT HANDLERS ---
  async applyUsersPage(pageSize, page) {
    const token = this.getToken();
    if (!token) return;
    const offset = (page - 1) * pageSize;
    try {
      const { rows, totalCount } = await authRepository.listUsers(token, { limit: pageSize, offset });
      this.dtUsers.pageSize = pageSize;
      this.dtUsers.currentPage = page;
      this.dtUsers.setData(rows, totalCount);
    } catch (error) {
      console.warn('[WAS Admin] Failed to load users:', error.message);
    }
  }

  async onUsersFilterChanged(pageSize, page) {
    await this.applyUsersPage(pageSize, page);
  }

  async onUserRoleChange(row, newRole) {
    const token = this.getToken();
    if (!token || !row || !row.id) return;
    try {
      await authRepository.updateUser(token, row.id, { role: newRole });
      row.role = newRole;
      this.showInfo('Success', `User ${row.name} role updated to ${newRole}`, 'success');
    } catch (error) {
      this.showInfo('Error', `Failed to update user role: ${error.message}`, 'error');
    }
  }

  async onUserApproveClick(row) {
    const token = this.getToken();
    if (!token || !row || !row.id) return;
    try {
      await authRepository.approveUser(token, row.id);
      this.showInfo('User Approved', `User ${row.name} approved successfully`, 'success');
      await this.applyUsersPage(this.dtUsers.pageSize, this.dtUsers.currentPage);
    } catch (error) {
      this.showInfo('Error', `Failed to approve user: ${error.message}`, 'error');
    }
  }

  onUserEditClick(row) {
    if (!row) return;
    this.editingUserId = row.id;
    this.txtEditUserName.value = row.name || '';
    this.txtEditUserEmail.value = row.email || '';
    this.cmbEditUserRole.value = row.role || 'user';
    this.cmbEditUserStatus.value = row.status || 'active';
    this.frameEditUser.visible = true;
  }

  async onSaveUserEdit() {
    const token = this.getToken();
    if (!token || !this.editingUserId) return;
    try {
      await authRepository.updateUser(token, this.editingUserId, {
        name: this.txtEditUserName.value,
        email: this.txtEditUserEmail.value,
        role: this.cmbEditUserRole.value,
        status: this.cmbEditUserStatus.value,
      });
      this.frameEditUser.visible = false;
      this.editingUserId = null;
      this.showInfo('Saved', 'User details updated successfully', 'success');
      await this.applyUsersPage(this.dtUsers.pageSize, this.dtUsers.currentPage);
    } catch (error) {
      this.showInfo('Error', `Failed to update user: ${error.message}`, 'error');
    }
  }

  onCancelUserEdit() {
    this.frameEditUser.visible = false;
    this.editingUserId = null;
  }

  async onUserDeleteClick(row) {
    const token = this.getToken();
    if (!token || !row || !row.id) return;
    try {
      await authRepository.deleteUser(token, row.id);
      this.showInfo('User Deleted', `User ${row.name} deleted successfully`, 'success');
      await this.applyUsersPage(this.dtUsers.pageSize, this.dtUsers.currentPage);
    } catch (error) {
      this.showInfo('Error', `Failed to delete user: ${error.message}`, 'error');
    }
  }

  onRegistrationPolicyChange() {
    const token = this.getToken();
    if (!token) return;
    const allowsAuto = this.chkAutoApprove.value.includes('auto');
    this.requiresApproval = !allowsAuto;
    authRepository.setSettings(token, this.requiresApproval)
      .catch((error) => console.warn('[WAS Admin] Failed to save registration policy:', error.message));
  }

  // --- THEME MANAGEMENT HANDLERS ---
  async applyThemesPage(pageSize, page) {
    try {
      const themes = await themeRepository.listThemes();
      const formattedThemes = themes.map((t) => ({
        ...t,
        preview: themePreviewSwatch(t),
        summary: `Colors: ${t.bg1 || '-'} / ${t.accent || '-'}${t.cssContent ? '\nCSS: Custom rules attached' : ''}`,
      }));
      const totalCount = formattedThemes.length;
      const offset = (page - 1) * pageSize;
      const pagedThemes = formattedThemes.slice(offset, offset + pageSize);
      this.cgThemes.pageSize = pageSize;
      this.cgThemes.currentPage = page;
      this.cgThemes.setData(pagedThemes, totalCount);
    } catch (error) {
      console.warn('[WAS Admin] Failed to load themes:', error.message);
    }
  }

  async onThemesFilterChanged(pageSize, page) {
    await this.applyThemesPage(pageSize, page);
  }

  onOpenCreateTheme() {
    this.editingThemeId = null;
    this.txtThemeId.value = `theme-${Date.now().toString(36)}`;
    this.txtThemeId.disabled = false;
    this.txtThemeName.value = '';
    this.txtThemeBg1.value = '#1e293b';
    this.txtThemeBg2.value = '#0f172a';
    this.txtThemeAccent.value = '#3b82f6';
    this.txtThemeAccentDark.value = '#1d4ed8';
    this.txtThemeCss.value = '';
    this.frameThemeEditor.visible = true;
  }

  async onThemeCardAction(action, row) {
    if (!row) return;
    const token = this.getToken();
    if (action === 'edit') {
      this.editingThemeId = row.id;
      this.txtThemeId.value = row.id || '';
      this.txtThemeId.disabled = true;
      this.txtThemeName.value = row.name || '';
      this.txtThemeBg1.value = row.bg1 || '#1e293b';
      this.txtThemeBg2.value = row.bg2 || '#0f172a';
      this.txtThemeAccent.value = row.accent || '#3b82f6';
      this.txtThemeAccentDark.value = row.accentDark || '#1d4ed8';
      this.txtThemeCss.value = row.cssContent || '';
      this.frameThemeEditor.visible = true;
    } else if (action === 'delete') {
      if (!token) {
        this.showInfo('Error', 'Authentication token missing', 'error');
        return;
      }
      try {
        await themeRepository.deleteTheme(token, row.id);
        this.showInfo('Theme Deleted', `Theme ${row.name} deleted successfully`, 'success');
        await this.applyThemesPage(this.cgThemes.pageSize, this.cgThemes.currentPage);
      } catch (error) {
        this.showInfo('Error', `Failed to delete theme: ${error.message}`, 'error');
      }
    }
  }

  async onSaveTheme() {
    const token = this.getToken();
    if (!token) {
      this.showInfo('Error', 'Authentication token missing', 'error');
      return;
    }

    const data = {
      id: this.txtThemeId.value,
      name: this.txtThemeName.value,
      bg1: this.txtThemeBg1.value,
      bg2: this.txtThemeBg2.value,
      accent: this.txtThemeAccent.value,
      accentDark: this.txtThemeAccentDark.value,
      cssContent: this.txtThemeCss.value,
    };

    if (!data.name) {
      this.showInfo('Warning', 'Theme name cannot be empty', 'warning');
      return;
    }

    try {
      if (this.editingThemeId) {
        await themeRepository.updateTheme(token, this.editingThemeId, data);
        this.showInfo('Saved', `Theme ${data.name} updated successfully`, 'success');
      } else {
        await themeRepository.createTheme(token, data);
        this.showInfo('Created', `Theme ${data.name} added successfully`, 'success');
      }
      this.frameThemeEditor.visible = false;
      this.editingThemeId = null;
      await this.applyThemesPage(this.cgThemes.pageSize, this.cgThemes.currentPage);
    } catch (error) {
      this.showInfo('Error', `Failed to save theme: ${error.message}`, 'error');
    }
  }

  onCancelThemeEdit() {
    this.frameThemeEditor.visible = false;
    this.editingThemeId = null;
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinAdmin;
