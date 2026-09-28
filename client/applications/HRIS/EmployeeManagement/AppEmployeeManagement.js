const WiseApplication = require('../../../system/WiseApplication');
const WinEmployeeManagement = require('./forms/WinEmployeeManagement');

class AppEmployeeManagement extends WiseApplication {
  async run(appConfig = {}, appParameter = {}) {
    const employeeWindow = this.createWindow(WinEmployeeManagement, {
      width: '96%',
      height: '90%',
      positionX: 60,
      positionY: 40,
    });

    employeeWindow.show(appParameter);

    if (typeof employeeWindow.loadInitialData === 'function') {
      await employeeWindow.loadInitialData();
    }

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      status: 'started',
      window: employeeWindow.toJSON(),
    };
  }
}

module.exports = AppEmployeeManagement;
