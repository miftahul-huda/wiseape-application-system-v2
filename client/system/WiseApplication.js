class WiseApplication {
  constructor(appMetadata = {}) {
    this.appID = appMetadata.appID || appMetadata.appId || 'unknown-app';
    this.appTitle = appMetadata.appTitle || 'Untitled Application';
    this.appVersion = appMetadata.appVersion || '1.0.0';
    this.appDeveloper = appMetadata.appDeveloper || 'Wiseape';
    this.appIcon = appMetadata.appIcon || appMetadata.appIconUrl || appMetadata.icon || '◫';
    this.appLibraries = Array.isArray(appMetadata.appLibraries) ? appMetadata.appLibraries : [];
    this.appConfig = appMetadata.appConfig || {};
    this.appStartPoint = appMetadata.appStartPoint || '';
    this.appParameter = appMetadata.appParameter || {};
    this.window = null;
    this.windows = new Map();
    this.controls = [];
    this.system = null;
    this.pendingOpenWindow = null;
  }

  run(appConfig = {}, appParameter = {}) {
    this.appConfig = { ...this.appConfig, ...appConfig };
    this.appParameter = { ...this.appParameter, ...appParameter };

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      appVersion: this.appVersion,
      appDeveloper: this.appDeveloper,
      appIcon: this.appIcon,
      appConfig: this.appConfig,
      appParameter: this.appParameter,
      status: 'started',
    };
  }

  createWindow(WindowClass, options = {}) {
    const windowOptions = {
      appId: this.appID,
      appTitle: this.appTitle,
      appIcon: this.appIcon,
      system: this.system,
      app: this,
      ...options,
    };

    const win = new WindowClass(windowOptions);
    if (!this.window) {
      this.window = win;
    }
    if (!this.windows) this.windows = new Map();
    this.windows.set(win.windowId, win);
    if (typeof win.onWindowInit === 'function') {
      win.onWindowInit();
    }
    return win;
  }

  registerWindow(win) {
    if (!this.windows) this.windows = new Map();
    this.windows.set(win.windowId, win);
  }

  unregisterWindow(windowId) {
    if (this.windows) this.windows.delete(windowId);
  }

  getWindow(windowId) {
    if (!windowId || !this.windows) return this.window;
    return this.windows.get(windowId) || this.window;
  }

  // Delegates to the main window's showInfo() (see WiseWindow) -- lets an
  // app queue a modal alert during run(), e.g. right after createWindow(),
  // before the window has even been shown yet.
  showInfo(title, message, type = 'information') {
    if (!this.window) {
      throw new Error('showInfo() requires a window -- call createWindow() first');
    }
    return this.window.showInfo(title, message, type);
  }

  toJSON() {
    return {
      appID: this.appID,
      appTitle: this.appTitle,
      appVersion: this.appVersion,
      appDeveloper: this.appDeveloper,
      appIcon: this.appIcon,
      appLibraries: this.appLibraries,
      appConfig: this.appConfig,
      appStartPoint: this.appStartPoint,
      appParameter: this.appParameter,
      controls: this.controls.map((control) => control.render ? control.render() : control),
    };
  }
}

module.exports = WiseApplication;
