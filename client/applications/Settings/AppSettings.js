import {
  WiseApplication,
} from '../../src/runtime/wise.js';
import WinSettings from './forms/WinSettings';

class AppSettings extends WiseApplication {
  async run(appConfig = {}, appParameter = {}) {
    const settingsWindow = this.createWindow(WinSettings, {
      width: 480,
      height: 620,
      positionX: 360,
      positionY: 80,
      themes: this.system.themes,
    });

    await settingsWindow.loadInitialData();
    settingsWindow.show(appParameter);

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      status: 'started',
      window: settingsWindow.toJSON(),
    };
  }
}

export default AppSettings;
