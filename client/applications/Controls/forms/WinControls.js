const WiseWindow = require('../../../system/WiseWindow');
const WiseLabel = require('../../../system/controls/WiseLabel');
const WiseTextBox = require('../../../system/controls/WiseTextBox');
const WiseNumericBox = require('../../../system/controls/WiseNumericBox');
const WiseComboBox = require('../../../system/controls/WiseComboBox');
const WiseRadioGroup = require('../../../system/controls/WiseRadioGroup');
const WiseCheckboxGroup = require('../../../system/controls/WiseCheckboxGroup');
const WiseDate = require('../../../system/controls/WiseDate');
const WiseDateRange = require('../../../system/controls/WiseDateRange');
const WiseTextArea = require('../../../system/controls/WiseTextArea');
const WiseHtmlEditor = require('../../../system/controls/WiseHtmlEditor');
const WiseFileUpload = require('../../../system/controls/WiseFileUpload');
const WiseButton = require('../../../system/controls/WiseButton');
const WiseTableLayout = require('../../../system/controls/WiseTableLayout');
const WiseTabControl = require('../../../system/controls/WiseTabControl');
const WiseDataTable = require('../../../system/controls/WiseDataTable');
const WiseCardGroup = require('../../../system/controls/WiseCardGroup');
const WiseFrame = require('../../../system/controls/WiseFrame');
const ApiEmployeeRepository = require('../repositories/ApiEmployeeRepository');

const employeeRepository = new ApiEmployeeRepository();

const HEADING_STYLE = { fontSize: 15, fontWeight: 700, marginTop: '4px' };
const DEPARTMENTS = ['Engineering', 'Sales', 'Support', 'Marketing'];
const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

// wiseape_employees has no avatar column (and this is just a demo of
// WiseDataTable's 'image' column type, not a real upload feature) -- an
// initials-on-a-color-swatch SVG, generated client-side and never
// persisted, gives every row a distinct image without inventing a schema
// change or fake stored data.
function initialsAvatar(name) {
  const initials = String(name || '?').split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  const color = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="14" fill="${color}"/><text x="32" y="41" font-family="sans-serif" font-size="24" font-weight="600" fill="white" text-anchor="middle">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

class WinControls extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = 'Controls Gallery';
    this.appTitle = options.appTitle || 'Controls';
    this.appIcon = options.appIcon || '🎛';
    this.width = '820';
    this.height = '900';
  }

  onWindowInit() {
    this.controls = [];

    this.addControl(new WiseLabel('Favorite Color', { id: 'lblColor', style: HEADING_STYLE }));
    this.addControl(new WiseRadioGroup(
      [
        { value: 'red', label: 'Red' },
        { value: 'green', label: 'Green' },
        { value: 'blue', label: 'Blue' },
      ],
      { id: 'radioColor', value: 'green', onChange: () => { this.dateBirthday.setDisabled(true) } }
    ));

    this.addControl(new WiseLabel('Department', { id: 'lblDepartment', style: HEADING_STYLE }));
    this.addControl(new WiseComboBox(
      DEPARTMENTS.map((dept) => ({ value: dept, label: dept })),
      { id: 'cmbDepartment', value: 'Engineering', onChange: () => { console.log("Department changed"); this.dateBirthday.setDisabled(false); } }
    ));

    this.addControl(new WiseLabel('Age', { id: 'lblAge', style: HEADING_STYLE }));
    this.addControl(new WiseNumericBox('Enter age...', { id: 'numAge', value: 25, min: 0, max: 120, step: 1, suffix: 'yrs' }));

    // A number small enough for min/max clamping doesn't reach into the
    // thousands, so it never actually shows the digit-grouping separator --
    // this field is here specifically to demonstrate that (grouping is
    // live as you type; see WiseNumericBox's input handler), plus a prefix.
    this.addControl(new WiseLabel('Annual Salary', { id: 'lblSalary', style: HEADING_STYLE }));
    this.addControl(new WiseNumericBox('Enter salary...', { id: 'numSalary', value: 75000000, min: 0, prefix: 'Rp' }));

    this.addControl(new WiseLabel('Interests', { id: 'lblInterests', style: HEADING_STYLE }));
    this.addControl(new WiseCheckboxGroup(
      [
        { value: 'music', label: 'Music' },
        { value: 'sports', label: 'Sports' },
        { value: 'reading', label: 'Reading' },
        { value: 'travel', label: 'Travel' },
      ],
      { id: 'checkInterests', value: ['music', 'travel'] }
    ));

    this.addControl(new WiseLabel('Birthday', { id: 'lblBirthday', style: HEADING_STYLE }));
    this.addControl(new WiseDate('', { id: 'dateBirthday', disabled: true }));

    this.addControl(new WiseLabel('Vacation Dates', { id: 'lblVacation', style: HEADING_STYLE }));
    this.addControl(new WiseDateRange({}, { id: 'rangeVacation' }));

    this.addControl(new WiseLabel('Bio', { id: 'lblBio', style: HEADING_STYLE }));
    this.addControl(new WiseTextArea('', { id: 'textBio', placeholder: 'Tell us about yourself...', rows: 3 }));

    this.addControl(new WiseLabel('Notes', { id: 'lblNotes', style: HEADING_STYLE }));
    this.addControl(new WiseHtmlEditor('<p>Write something...</p>', { id: 'editorNotes' }));

    this.addControl(new WiseLabel('Avatar', { id: 'lblAvatar', style: HEADING_STYLE }));
    this.addControl(new WiseFileUpload('Choose Image...', { id: 'uploadAvatar', onChange: this.onAvatarChange.bind(this) }));



    // -- Layout containers: WiseTableLayout + WiseTabControl --
    this.addControl(new WiseLabel('Contact (Table Layout)', { id: 'lblContactHeading', style: { ...HEADING_STYLE, marginTop: '16px' } }));
    const contactTable = new WiseTableLayout({ id: 'tableContact', rows: 2, columns: 2 });
    contactTable.setCell(0, 0, new WiseLabel('Name', { style: { fontWeight: 600 } }));
    contactTable.setCell(0, 1, new WiseTextBox('', { id: 'txtContactName', dataField: 'contactName', disabled: true }));
    contactTable.setCell(1, 0, new WiseLabel('This row spans both columns', {}), { colSpan: 2 });
    this.addControl(contactTable);

    this.addControl(new WiseLabel('Preferences (Tabs)', { id: 'lblTabsHeading', style: HEADING_STYLE }));
    const tabs = new WiseTabControl({ id: 'tabsDemo' });
    tabs.addTab('Profile', [new WiseTextBox('2-20 characters...', { id: 'txtNickname', dataField: 'nickname', minLength: 2, maxLength: 20 })]);
    tabs.addTab('Notifications', [new WiseCheckboxGroup(
      [{ value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' }],
      { id: 'checkNotify', value: ['email'], dataField: 'notify' }
    )]);
    this.addControl(tabs);

    // -- WiseFrame: a titled box grouping controls together --
    const noteFrame = new WiseFrame('Quick Note', { id: 'frameNote' });
    noteFrame.addControl(new WiseTextArea('', { id: 'txtQuickNote', placeholder: 'Type a quick note...', rows: 2, dataField: 'quickNote' }));
    noteFrame.addControl(new WiseCheckboxGroup(
      [{ value: 'pinned', label: 'Pin this note' }],
      { id: 'checkPinNote', value: [], dataField: 'notePinned' }
    ));
    this.addControl(noteFrame);

    // -- WiseDataTable: paged/sortable/editable rows backed by the real
    // wiseape_employees table via this app's own employeeRepository. Data
    // starts empty here (onWindowInit must stay synchronous) and is filled
    // in by loadInitialData(), awaited from AppControls.run() before show().
    this.addControl(new WiseLabel('Team Directory (Data Table)', { id: 'lblEmployeesHeading', style: HEADING_STYLE }));
    this.addControl(new WiseDataTable({
      id: 'dtEmployees',
      pageSize: 5,
      pageSizeOptions: [5, 10, 20],
      onDataFilterChanged: this.onEmployeesFilterChanged.bind(this),
      onRowSelect: this.onEmployeeRowSelect.bind(this),
    }));
    this.dtEmployees.setColumns([
      { dataField: 'avatar', header: '', width: 50, sortable: false, type: 'image' },
      { dataField: 'name', header: 'Name', width: 170 },
      {
        dataField: 'department', header: 'Department', width: 160, type: 'combobox',
        items: DEPARTMENTS, onChange: this.onEmployeeDeptChange.bind(this),
      },
      {
        dataField: 'active', header: 'Active', width: 80, sortable: false, type: 'checkbox',
        onChange: this.onEmployeeActiveChange.bind(this),
      },
      {
        dataField: 'level', header: 'Level', width: 150, sortable: false, type: 'radiobutton',
        items: [{ value: 'junior', label: 'Junior' }, { value: 'senior', label: 'Senior' }],
        onChange: this.onEmployeeLevelChange.bind(this),
      },
      {
        dataField: 'actions', header: '', width: 90, sortable: false, type: 'button',
        label: 'Edit', onClick: this.onEmployeeEditRow.bind(this),
      },
    ]);
    this.addControl(new WiseLabel('', { id: 'lblEmployeeResult', style: { fontSize: 12, marginTop: '2px', color: '#374151' } }));

    // -- WiseCardGroup: same paged employeeRepository data as the data
    // table above, rendered as cards instead of rows -- titleField/
    // imageField/textField map row fields onto each card, the card-group
    // equivalent of a WiseDataTable column's dataField.
    this.addControl(new WiseLabel('Team Directory (Card Group)', { id: 'lblCardsHeading', style: { ...HEADING_STYLE, marginTop: '16px' } }));
    this.addControl(new WiseCardGroup({
      id: 'cgEmployees',
      pageSize: 6,
      pageSizeOptions: [6, 12],
      titleField: 'name',
      imageField: 'avatar',
      textField: 'department',
      onDataFilterChanged: this.onEmployeeCardsFilterChanged.bind(this),
      onRowSelect: this.onEmployeeCardSelect.bind(this),
    }));
    this.addControl(new WiseLabel('', { id: 'lblCardResult', style: { fontSize: 12, marginTop: '2px', color: '#374151' } }));

    this.addControl(new WiseButton('Show Values', {
      id: 'btnShow',
      onClick: this.onShowValues.bind(this),
      style: { marginTop: '4px' },
    }));

    // -- WiseWindow.showInfo() / WiseApplication.showInfo(): a one-shot
    // modal alert, icon picked from type -- see WiseDesktop.showInfoDialog.
    this.addControl(new WiseLabel('Show Info Dialog', { id: 'lblInfoHeading', style: { ...HEADING_STYLE, marginTop: '16px' } }));
    this.addControl(new WiseButton('Information', { id: 'btnInfoInformation', onClick: this.onShowInfoInformation.bind(this) }));
    this.addControl(new WiseButton('Success', { id: 'btnInfoSuccess', onClick: this.onShowInfoSuccess.bind(this) }));
    this.addControl(new WiseButton('Warning', { id: 'btnInfoWarning', onClick: this.onShowInfoWarning.bind(this) }));
    this.addControl(new WiseButton('Error', { id: 'btnInfoError', onClick: this.onShowInfoError.bind(this) }));

    return this;
  }

  async loadInitialData() {
    await this.applyEmployeesPage(this.dtEmployees.pageSize, this.dtEmployees.currentPage);
    await this.applyEmployeeCardsPage(this.cgEmployees.pageSize, this.cgEmployees.currentPage);
  }

  async applyEmployeesPage(pageSize, page) {
    const offset = (page - 1) * pageSize;
    const { rows, totalCount } = await employeeRepository.listEmployees({
      limit: pageSize,
      offset,
      sortField: this.dtEmployees.sortField || 'id',
      sortDirection: this.dtEmployees.sortDirection || 'asc',
    });
    this.dtEmployees.pageSize = pageSize;
    this.dtEmployees.currentPage = page;
    this.dtEmployees.setData(rows.map((row) => ({ ...row, avatar: initialsAvatar(row.name) })), totalCount);
  }

  async onEmployeesFilterChanged(pageSize, page) {
    await this.applyEmployeesPage(pageSize, page);
  }

  onEmployeeRowSelect(row) {
    this.lblEmployeeResult.text(`Selected: ${row.name} — ${row.department}`);
  }

  async onEmployeeDeptChange(row, newValue) {
    await employeeRepository.updateEmployee(row.id, { department: newValue });
    row.department = newValue;
  }

  async onEmployeeActiveChange(row, newValue) {
    await employeeRepository.updateEmployee(row.id, { active: newValue });
    row.active = newValue;
  }

  async onEmployeeLevelChange(row, newValue) {
    await employeeRepository.updateEmployee(row.id, { level: newValue });
    row.level = newValue;
  }

  onEmployeeEditRow(row) {
    this.lblEmployeeResult.text(`Editing: ${JSON.stringify(row)}`);
  }

  // Same wiseape_employees source and pageSize/currentPage-on-the-control
  // pattern as applyEmployeesPage above -- WiseCardGroup pages exactly like
  // WiseDataTable, it just renders each row as a card instead of a row.
  async applyEmployeeCardsPage(pageSize, page) {
    const offset = (page - 1) * pageSize;
    const { rows, totalCount } = await employeeRepository.listEmployees({ limit: pageSize, offset });
    this.cgEmployees.pageSize = pageSize;
    this.cgEmployees.currentPage = page;
    this.cgEmployees.setData(rows.map((row) => ({ ...row, avatar: initialsAvatar(row.name) })), totalCount);
  }

  async onEmployeeCardsFilterChanged(pageSize, page) {
    await this.applyEmployeeCardsPage(pageSize, page);
  }

  onEmployeeCardSelect(row) {
    this.lblCardResult.text(`Selected: ${row.name} — ${row.department}`);
  }

  onAvatarChange() {
    // The uploaded URL is already synced onto this.uploadAvatar.value by the
    // time this runs; nothing else needs to happen until "Show Values".
  }

  onShowValues() {
    const summary = this.getValues();
    this.showInfo('Current Control Values', JSON.stringify(summary, null, 2), 'information');
  }

  onShowInfoInformation() {
    this.showInfo('Heads up', 'This is an informational message.', 'information');
  }

  onShowInfoSuccess() {
    this.showInfo('Saved', 'Your changes were saved successfully.', 'success');
  }

  onShowInfoWarning() {
    this.showInfo('Careful', 'This action might have side effects.', 'warning');
  }

  onShowInfoError() {
    this.showInfo('Something went wrong', 'Could not complete the request.', 'error');
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinControls;
