import {
  WiseApplication,
} from '../../src/runtime/wise.js';
import WinHRIS from './forms/WinHRIS';

class AppHRIS extends WiseApplication {
  run(appConfig = {}, appParameter = {}) {
    const hrisWindow = this.createWindow(WinHRIS, {
      width: '90%',
      height: '90%',
    });

    hrisWindow.show(appParameter);

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      status: 'started',
      window: hrisWindow.toJSON(),
    };
  }
}

export default AppHRIS;
