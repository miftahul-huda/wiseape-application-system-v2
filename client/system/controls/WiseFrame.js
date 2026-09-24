(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  // A titled box that groups a set of child controls together -- the
  // "fieldset with a nicer look" of the catalog. Same container pattern as
  // WiseTableLayout/WiseTabControl: getChildControls() lets addControl()
  // auto-register everything inside it, and patchElement delegates to each
  // child's own patchElement.
  class WiseFrame extends WiseControl {
    constructor(title = '', options = {}) {
      super('', options);
      this.name = 'WiseFrame';
      this.title = title;
      this.controls = [];
      this.style = options.style || {};
    }

    addControl(control) {
      this.controls.push(control);
      return this;
    }

    getChildControls() {
      return this.controls;
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        title: this.title,
        controls: this.controls.map((control) => control.render()),
        style: this.style,
        visible: this.visible,
      };
    }

    static renderElement(data, context) {
      const wrapper = document.createElement('div');
      wrapper.className = 'rounded-lg border border-slate-900/10 bg-white/60 p-4 shadow-sm';
      WiseControl.applyCommon(wrapper, data);

      if (data.title) {
        const heading = document.createElement('div');
        heading.className = 'mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500';
        heading.textContent = data.title;
        wrapper.appendChild(heading);
      }

      const body = document.createElement('div');
      body.className = 'flex flex-col gap-2';
      (data.controls || []).forEach((control) => body.appendChild(context.desktop.renderControl(control, context.appId, context.windowId)));
      wrapper.appendChild(body);

      return wrapper;
    }

    static patchElement(winEl, data, context) {
      const registry = window.WiseControlRegistry;
      (data.controls || []).forEach((control) => {
        const ControlClass = registry[control.type] || registry.WiseControl;
        if (typeof ControlClass.patchElement === 'function') {
          ControlClass.patchElement(winEl, control, context);
        }
      });
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseFrame = WiseFrame;
  } else {
    module.exports = WiseFrame;
  }
})();
