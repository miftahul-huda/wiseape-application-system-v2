// Runs WAS applications entirely in the browser.
//
// For a "browser app" the Win*/App* classes execute here instead of in the
// Node `client` server: control events are dispatched in-process (no
// POST /api/applications/:appId/events round trip) and the window JSON is
// handed straight to WiseDesktop.patchWindowControls / renderWindow. Data
// still comes from the backend REST services (e.g. RecruitmentApiRepository).
//
// This mirrors WiseApplicationSystem.runApplication / dispatchControlEvent /
// closeApplicationWindow on the server, minus the per-request session and
// theme echo (the browser already owns that state).

// Applications that run in the browser. Keys are app module paths relative to
// the client root; to migrate another application, convert its files to ES
// modules and add its folder to this glob.
const BROWSER_APP_LOADERS = import.meta.glob([
  '/applications/**/App*.js',
]);

const KEY_META_FIELDS = new Set(['key', 'code', 'ctrlKey', 'shiftKey', 'altKey', '_windowId']);

function parseStartPoint(app) {
  if (!app || !app.appStartPoint) return null;
  const [relativePath, className] = String(app.appStartPoint).split(':');
  if (!relativePath || !className) return null;
  return { modulePath: `/${relativePath.replace(/^\/+/, '')}`, className };
}

class LocalAppRuntime {
  constructor() {
    this.runningApplications = new Map();
  }

  // True when this app's start point is one of the browser apps above.
  canRun(app) {
    const sp = parseStartPoint(app);
    return !!(sp && BROWSER_APP_LOADERS[sp.modulePath]);
  }

  // True when the app is currently running in the browser (used to route
  // control events / window-close notifications).
  isRunning(appId) {
    return this.runningApplications.has(String(appId));
  }

  async run(app, system, appParameter = null) {
    const sp = parseStartPoint(app);
    const loaded = await BROWSER_APP_LOADERS[sp.modulePath]();
    const AppClass = loaded[sp.className] || loaded.default;

    const meta = typeof app.toJSON === 'function' ? app.toJSON() : app;
    const instance = new AppClass(meta);
    instance.system = system;

    if (!system.currentSession) {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('was_token') : null;
      let user = null;
      try {
        user = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('was_user') || 'null') : null;
      } catch (_) {}
      if (token || user) {
        system.currentSession = { token, user };
      }
    }

    const mergedParam = appParameter
      ? { ...(meta.appParameter || {}), ...appParameter }
      : (meta.appParameter || {});
    const startupResult = await instance.run(meta.appConfig, mergedParam);

    const primaryKey = String(instance.appID || meta.appID);
    this.runningApplications.set(primaryKey, instance);
    if (meta && meta.appID) {
      this.runningApplications.set(String(meta.appID), instance);
    }

    return {
      event: { event: 'onApplicationIconClick', app: meta },
      application: instance.toJSON ? instance.toJSON() : meta,
      startupResult,
    };
  }

  async dispatchControlEvent(appId, controlId, eventName, values = {}, windowId = null) {
    const instance = this.runningApplications.get(String(appId));
    if (!instance || (!instance.window && (!instance.windows || instance.windows.size === 0))) {
      throw new Error(`No running window for application ${appId}`);
    }

    const targetWindowId = windowId || values._windowId;
    const win = (instance.getWindow && targetWindowId)
      ? instance.getWindow(targetWindowId)
      : (instance.window || (instance.windows && Array.from(instance.windows.values())[0]));

    if (!win) {
      throw new Error(`Window ${targetWindowId || 'main'} not found in application ${appId}`);
    }

    Object.entries(values).forEach(([id, value]) => {
      if (KEY_META_FIELDS.has(id)) return;
      if (win[id]) win[id].value = value;
    });

    const control = win[controlId];
    if (!control) {
      throw new Error(`Control ${controlId} not found`);
    }

    const handlerName = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
    const handler = control[handlerName];
    if (typeof handler === 'function') {
      if (eventName === 'keypress') {
        const keyMeta = {};
        KEY_META_FIELDS.forEach((f) => { if (values[f] !== undefined) keyMeta[f] = values[f]; });
        await handler.call(win, keyMeta);
      } else {
        await handler.call(win);
      }
    }

    const openWindow = win.pendingOpenWindow
      ? win.pendingOpenWindow.toJSON()
      : (instance.pendingOpenWindow ? instance.pendingOpenWindow.toJSON() : null);
    win.pendingOpenWindow = null;
    instance.pendingOpenWindow = null;

    const windowData = win.toJSON();
    if (win.visible === false && targetWindowId && instance.windows
      && instance.windows.has(targetWindowId)
      && targetWindowId !== (instance.window && instance.window.windowId)) {
      instance.windows.delete(targetWindowId);
    }
    if (win.visible === false) {
      this.unloadIfIdle(appId, instance);
    }

    const updatedWindows = [];
    if (instance.windows) {
      instance.windows.forEach((w) => {
        if (w && w.windowId !== win.windowId && w.visible !== false) {
          updatedWindows.push(w.toJSON());
        }
      });
    }

    return { window: windowData, updatedWindows, openWindow };
  }

  // Titlebar "x" closes the window purely in the DOM; this keeps the
  // in-memory instance in sync and frees the app once no window is left.
  closeWindow(appId, windowId) {
    const instance = this.runningApplications.get(String(appId));
    if (!instance) return { status: 'not-found' };

    const win = (instance.getWindow && windowId) ? instance.getWindow(windowId) : instance.window;
    if (win) win.visible = false;
    if (windowId && instance.windows && instance.windows.has(windowId)
      && windowId !== (instance.window && instance.window.windowId)) {
      instance.windows.delete(windowId);
    }

    const unloaded = this.unloadIfIdle(appId, instance);
    return { status: unloaded ? 'unloaded' : 'closed' };
  }

  unloadIfIdle(appId, instance) {
    if (!instance) return false;

    const windows = instance.windows ? Array.from(instance.windows.values()) : [];
    const hasActiveWindow = windows.length > 0
      ? windows.some((w) => w && w.visible !== false)
      : !!(instance.window && instance.window.visible !== false);
    if (hasActiveWindow) return false;

    this.runningApplications.delete(String(appId));
    this.runningApplications.delete(String(instance.appID));
    return true;
  }
}

export default LocalAppRuntime;
