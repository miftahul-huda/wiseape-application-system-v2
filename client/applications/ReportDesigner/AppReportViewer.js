import { WiseApplication } from '../../src/runtime/wise.js';
import WinReportViewer from './forms/WinReportViewer';

// appParameter.reportGroupId (optional): the report group to show. Without it
// the viewer shows a group chooser.
class AppReportViewer extends WiseApplication {
  async run(appConfig = {}, appParameter = {}) {
    const param = appParameter || {};
    const viewerWindow = this.createWindow(WinReportViewer, {
      width: '90%',
      height: '88%',
      positionX: 80,
      positionY: 40,
      reportGroupId: param.reportGroupId || null,
    });

    viewerWindow.show(param);

    if (typeof viewerWindow.loadInitialData === 'function') {
      await viewerWindow.loadInitialData();
    }

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      status: 'started',
      window: viewerWindow.toJSON(),
    };
  }
}

export default AppReportViewer;
