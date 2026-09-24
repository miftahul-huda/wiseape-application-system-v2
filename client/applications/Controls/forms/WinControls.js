const WiseWindow = require('../../../system/WiseWindow');
const WiseLabel = require('../../../system/controls/WiseLabel');
const WiseTextBox = require('../../../system/controls/WiseTextBox');
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

const HEADING_STYLE = { fontSize: 15, fontWeight: 700, marginTop: '4px' };
const DEPARTMENTS = ['Engineering', 'Sales', 'Support', 'Marketing'];

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
      { id: 'radioColor', value: 'green' }
    ));

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
    this.addControl(new WiseDate('', { id: 'dateBirthday' }));

    this.addControl(new WiseLabel('Vacation Dates', { id: 'lblVacation', style: HEADING_STYLE }));
    this.addControl(new WiseDateRange({}, { id: 'rangeVacation' }));

    this.addControl(new WiseLabel('Bio', { id: 'lblBio', style: HEADING_STYLE }));
    this.addControl(new WiseTextArea('', { id: 'textBio', placeholder: 'Tell us about yourself...', rows: 3 }));

    this.addControl(new WiseLabel('Notes', { id: 'lblNotes', style: HEADING_STYLE }));
    this.addControl(new WiseHtmlEditor('<p>Write something...</p>', { id: 'editorNotes' }));

    this.addControl(new WiseLabel('Avatar', { id: 'lblAvatar', style: HEADING_STYLE }));
    this.addControl(new WiseFileUpload('Choose Image...', { id: 'uploadAvatar', onChange: this.onAvatarChange.bind(this) }));

    this.addControl(new WiseButton('Show Values', {
      id: 'btnShow',
      onClick: this.onShowValues.bind(this),
      style: { marginTop: '4px' },
    }));
    this.addControl(new WiseLabel('', { id: 'lblResult', style: { fontSize: 12, marginTop: '2px', color: '#374151' } }));

    // -- Layout containers: WiseTableLayout + WiseTabControl --
    this.addControl(new WiseLabel('Contact (Table Layout)', { id: 'lblContactHeading', style: { ...HEADING_STYLE, marginTop: '16px' } }));
    const contactTable = new WiseTableLayout({ id: 'tableContact', rows: 2, columns: 2 });
    contactTable.setCell(0, 0, new WiseLabel('Name', { style: { fontWeight: 600 } }));
    contactTable.setCell(0, 1, new WiseTextBox('', { id: 'txtContactName', dataField: 'contactName' }));
    contactTable.setCell(1, 0, new WiseLabel('This row spans both columns', {}), { colSpan: 2 });
    this.addControl(contactTable);

    this.addControl(new WiseLabel('Preferences (Tabs)', { id: 'lblTabsHeading', style: HEADING_STYLE }));
    const tabs = new WiseTabControl({ id: 'tabsDemo' });
    tabs.addTab('Profile', [new WiseTextBox('', { id: 'txtNickname', dataField: 'nickname' })]);
    tabs.addTab('Notifications', [new WiseCheckboxGroup(
      [{ value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' }],
      { id: 'checkNotify', value: ['email'], dataField: 'notify' }
    )]);
    this.addControl(tabs);

    // -- WiseDataTable: paged/sortable/editable rows backed by the real
    // wiseape_employees table via this.system.employeeRepository. Data
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
        dataField: 'actions', header: '', width: 90, sortable: false, type: 'button',
        label: 'Edit', onClick: this.onEmployeeEditRow.bind(this),
      },
    ]);
    this.addControl(new WiseLabel('', { id: 'lblEmployeeResult', style: { fontSize: 12, marginTop: '2px', color: '#374151' } }));

    return this;
  }

  async loadInitialData() {
    await this.applyEmployeesPage(this.dtEmployees.pageSize, this.dtEmployees.currentPage);
  }

  async applyEmployeesPage(pageSize, page) {
    const offset = (page - 1) * pageSize;
    const { rows, totalCount } = await this.system.employeeRepository.listEmployees({
      limit: pageSize,
      offset,
      sortField: this.dtEmployees.sortField || 'id',
      sortDirection: this.dtEmployees.sortDirection || 'asc',
    });
    this.dtEmployees.pageSize = pageSize;
    this.dtEmployees.currentPage = page;
    this.dtEmployees.setData(rows, totalCount);
  }

  async onEmployeesFilterChanged(pageSize, page) {
    await this.applyEmployeesPage(pageSize, page);
  }

  onEmployeeRowSelect(row) {
    this.lblEmployeeResult.text(`Selected: ${row.name} — ${row.department}`);
  }

  async onEmployeeDeptChange(row, newValue) {
    await this.system.employeeRepository.updateEmployee(row.id, { department: newValue });
    row.department = newValue;
  }

  async onEmployeeActiveChange(row, newValue) {
    await this.system.employeeRepository.updateEmployee(row.id, { active: newValue });
    row.active = newValue;
  }

  onEmployeeEditRow(row) {
    this.lblEmployeeResult.text(`Editing: ${JSON.stringify(row)}`);
  }

  onAvatarChange() {
    // The uploaded URL is already synced onto this.uploadAvatar.value by the
    // time this runs; nothing else needs to happen until "Show Values".
  }

  onShowValues() {
    const summary = {
      color: this.radioColor.value,
      interests: this.checkInterests.value,
      birthday: this.dateBirthday.value,
      vacation: this.rangeVacation.value,
      bio: this.textBio.value,
      notes: this.editorNotes.value,
      avatar: this.uploadAvatar.value,
    };
    this.lblResult.text(JSON.stringify(summary, null, 2));
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinControls;
