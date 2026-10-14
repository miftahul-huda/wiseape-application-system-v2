import { WiseApplication } from '../../src/runtime/wise.js';
import WinUtilityLinks from './forms/WinUtilityLinks';

class AppKafkaManager extends WiseApplication {
  async run(appConfig = {}, appParameter = {}) {
    const linksWindow = this.createWindow(WinUtilityLinks, {
      linkType: 'kafka_manager',
      titleKey: 'UT_KAFKA_TITLE',
      appIcon: '📨',
      width: '80%',
      height: 640,
      positionX: 80,
      positionY: 50,
    });

    linksWindow.show(appParameter);

    if (typeof linksWindow.loadInitialData === 'function') {
      await linksWindow.loadInitialData();
    }

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      status: 'started',
      window: linksWindow.toJSON(),
    };
  }
}

export default AppKafkaManager;
