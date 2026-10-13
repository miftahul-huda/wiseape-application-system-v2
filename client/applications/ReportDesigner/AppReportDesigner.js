import { WiseApplication } from '../../src/runtime/wise.js';
import WinReportDesigner from './forms/WinReportDesigner';

class AppReportDesigner extends WiseApplication {
  async run(appConfig = {}, appParameter = {}) {
    const designerWindow = this.createWindow(WinReportDesigner, {
      width: '96%',
      height: '90%',
      positionX: 60,
      positionY: 40,
    });

    designerWindow.show(appParameter);

    if (typeof designerWindow.loadInitialData === 'function') {
      await designerWindow.loadInitialData();
    }

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      status: 'started',
      window: designerWindow.toJSON(),
    };
  }
}

export default AppReportDesigner;
