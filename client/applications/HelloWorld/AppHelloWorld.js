import {
  WiseApplication,
} from '../../src/runtime/wise.js';
import WinHello from './forms/WinHello';

class AppHelloWorld extends WiseApplication {
  run(appConfig = {}, appParameter = {}) {
    const helloWindow = this.createWindow(WinHello);

    helloWindow.show(appParameter);

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      status: 'started',
      window: helloWindow.toJSON(),
    };
  }
}

export default AppHelloWorld;
