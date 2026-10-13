import {
  WiseApplication,
} from '../../../src/runtime/wise.js';
import WinRecruitmentPortal from './forms/WinRecruitmentPortal';

class AppRecruitment extends WiseApplication {
  async run(appConfig = {}, appParameter = {}) {
    const portalWindow = this.createWindow(WinRecruitmentPortal, {
      width: '92%',
      height: '88%',
      positionX: 60,
      positionY: 40
    });

    portalWindow.show(appParameter);

    if (typeof portalWindow.loadInitialData === 'function') {
      await portalWindow.loadInitialData();
    }

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      status: 'started',
      window: portalWindow.toJSON()
    };
  }
}

export default AppRecruitment;
