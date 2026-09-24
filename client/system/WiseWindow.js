// Control type names whose value belongs in WiseWindow.getValues() --
// display/action-only controls (WiseLabel, WiseButton) and containers
// (WiseTableLayout, WiseTabControl, WiseDataTable) are excluded; containers
// contribute through their own child controls instead (see getChildControls
// handling in addControl/getValues below).
const INPUT_CONTROL_TYPES = new Set([
  'WiseTextBox',
  'WiseNumericBox',
  'WiseTextArea',
  'WiseComboBox',
  'WiseRadioGroup',
  'WiseCheckboxGroup',
  'WiseDate',
  'WiseDateRange',
  'WiseHtmlEditor',
  'WiseFileUpload',
]);

class WiseWindow {
  constructor(options = {}) {
    this.windowId = options.windowId || `window-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.title = options.title || 'Untitled Window';
    this.appId = options.appId || null;
    this.appTitle = options.appTitle || 'Application';
    this.appIcon = options.appIcon || '◫';
    this.width = options.width || 640;
    this.height = options.height || 420;
    this.positionX = options.positionX || 220;
    this.positionY = options.positionY || 120;
    this.visible = false;
    this.minimized = false;
    this.maximized = false;
    this.params = null;
    this.controls = [];
    this.onShow = null;
    this.onShowDialog = null;
    this.system = options.system || null;
    this.pendingInfo = null;
  }

  // Queues a one-shot modal alert (icon + title + message + OK button) for
  // the browser to show the next time this window's JSON reaches it --
  // either from run()'s startupResult (called during/after createWindow(),
  // before the app finishes starting) or from a control event handler
  // (called mid-session). See toJSON(): the queued info is read and
  // cleared exactly once, so it shows a single time, not on every
  // subsequent patch. `type` is 'information' (default), 'success',
  // 'warning', or 'error' -- WiseDesktop picks the icon/color from it.
  showInfo(title, message, type = 'information') {
    this.pendingInfo = { title, message, type };
    return this.pendingInfo;
  }

  addControl(control) {
    this.controls.push(control);
    this.registerControl(control);
    return this;
  }

  // Removes a control (and its registered shorthand this[id]) by id.
  // Also unregisters any nested child controls for container controls.
  removeControl(id) {
    const unregister = (control) => {
      if (control.id) {
        delete this[control.id];
      }
      if (typeof control.getChildControls === 'function') {
        control.getChildControls().forEach((child) => unregister(child));
      }
    };

    const index = this.controls.findIndex((c) => c.id === id);
    if (index !== -1) {
      const [removed] = this.controls.splice(index, 1);
      unregister(removed);
    }
    return this;
  }

  // Registers a control (and, for a container control, every control
  // nested inside it) as this[control.id] -- what makes this.txtName work
  // for a control added directly OR nested inside a WiseTableLayout/
  // WiseTabControl added via addControl().
  registerControl(control) {
    if (control.id) {
      this[control.id] = control;
    }
    if (typeof control.getChildControls === 'function') {
      control.getChildControls().forEach((child) => this.registerControl(child));
    }
  }

  onWindowInit() {
    return this;
  }

  // Collects every input control's current value, keyed by its dataField
  // (defaults to id). Display/action-only controls (WiseLabel, WiseButton)
  // are excluded; a container control (getChildControls()) is walked
  // recursively instead of contributing a value of its own.
  getValues() {
    const values = {};

    const collect = (controls) => {
      controls.forEach((control) => {
        if (typeof control.getChildControls === 'function') {
          collect(control.getChildControls());
          return;
        }
        if (!INPUT_CONTROL_TYPES.has(control.name)) return;
        const key = control.dataField || control.id;
        if (key) values[key] = control.value;
      });
    };

    collect(this.controls);
    return values;
  }

  show(param = null) {
    this.visible = true;
    this.minimized = false;
    this.params = param;
    if (typeof this.onShow === 'function') {
      this.onShow(param);
    }

    return {
      status: 'shown',
      window: this.toJSON(),
      param,
    };
  }

  showDialog(param = null) {
    this.visible = true;
    this.minimized = false;
    this.params = param;
    if (typeof this.onShowDialog === 'function') {
      this.onShowDialog(param);
    }

    return {
      status: 'dialog',
      window: this.toJSON(),
      param,
    };
  }

  close() {
    this.visible = false;
    this.minimized = false;
    this.maximized = false;
    return { status: 'closed', window: this.toJSON() };
  }

  maximize() {
    this.maximized = !this.maximized;
    return { status: this.maximized ? 'maximized' : 'restored', maximized: this.maximized, window: this.toJSON() };
  }

  minimize() {
    this.minimized = !this.minimized;
    return { status: this.minimized ? 'minimized' : 'restored', minimized: this.minimized, window: this.toJSON() };
  }

  toJSON() {
    const info = this.pendingInfo;
    this.pendingInfo = null;

    return {
      windowId: this.windowId,
      title: this.title,
      appId: this.appId,
      appTitle: this.appTitle,
      appIcon: this.appIcon,
      width: this.width,
      height: this.height,
      positionX: this.positionX,
      positionY: this.positionY,
      visible: this.visible,
      minimized: this.minimized,
      maximized: this.maximized,
      params: this.params,
      info,
      controls: this.controls.map((control) => control.render ? control.render() : control),
    };
  }
}

module.exports = WiseWindow;
