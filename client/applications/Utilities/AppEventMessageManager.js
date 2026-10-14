import { WiseApplication } from '../../src/runtime/wise.js';
import WinEventMessageManager from './forms/WinEventMessageManager';

class AppEventMessageManager extends WiseApplication {
  async run(appConfig = {}, appParameter = {}) {
    const managerWindow = this.createWindow(WinEventMessageManager, {
      width: '85%',
      height: 700,
      positionX: 70,
      positionY: 50,
    });

    managerWindow.show(appParameter);

    if (typeof managerWindow.loadInitialData === 'function') {
      await managerWindow.loadInitialData();
    }

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      status: 'started',
      window: managerWindow.toJSON(),
    };
  }
}

export default AppEventMessageManager;
