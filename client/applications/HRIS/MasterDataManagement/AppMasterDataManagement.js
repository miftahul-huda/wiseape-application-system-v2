import {
  WiseApplication,
} from '../../../src/runtime/wise.js';
import WinMasterDataManagement from './forms/WinMasterDataManagement';

class AppMasterDataManagement extends WiseApplication {
  async run(appConfig = {}, appParameter = {}) {
    const masterWindow = this.createWindow(WinMasterDataManagement, {
      width: '88%',
      height: '85%',
      positionX: 80,
      positionY: 50,
    });

    masterWindow.show(appParameter);

    if (typeof masterWindow.loadInitialData === 'function') {
      await masterWindow.loadInitialData();
    }

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      status: 'started',
      window: masterWindow.toJSON(),
    };
  }
}

export default AppMasterDataManagement;
