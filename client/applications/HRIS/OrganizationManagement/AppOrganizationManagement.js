const WiseApplication = require('../../../system/WiseApplication');
const WinOrganizationManagement = require('./forms/WinOrganizationManagement');

class AppOrganizationManagement extends WiseApplication {
  async run(appConfig = {}, appParameter = {}) {
    const orgWindow = this.createWindow(WinOrganizationManagement, {
      width: '90%',
      height: '88%',
      positionX: 70,
      positionY: 40,
    });

    orgWindow.show(appParameter);

    if (typeof orgWindow.loadInitialData === 'function') {
      await orgWindow.loadInitialData();
    }

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      status: 'started',
      window: orgWindow.toJSON(),
    };
  }
}

module.exports = AppOrganizationManagement;
