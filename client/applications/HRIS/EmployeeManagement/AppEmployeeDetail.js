const WiseApplication = require('../../../system/WiseApplication');
const WinEmployeeDetail = require('./forms/WinEmployeeDetail');

class AppEmployeeDetail extends WiseApplication {
  async run(appConfig = {}, appParameter = {}) {
    const detailWindow = this.createWindow(WinEmployeeDetail, {
      width: '90%',
      height: '90%',
      positionX: 80,
      positionY: 50,
    });

    detailWindow.show(appParameter);

    // Load the employee by id if provided in appParameter
    const employeeId = appParameter && (appParameter.employeeId || appParameter.id);
    if (employeeId && typeof detailWindow.loadEmployee === 'function') {
      await detailWindow.loadEmployee(employeeId);
    }

    return {
      appID: this.appID,
      appTitle: detailWindow.title || this.appTitle,
      status: 'started',
      window: detailWindow.toJSON(),
    };
  }
}

module.exports = AppEmployeeDetail;
