(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  // Real Chrome-style tabs: the active one physically overlaps the content
  // panel's top border (-mb-px + z-10 + matching white background) so it
  // reads as fused onto the panel wherever it happens to sit.
  const TAB_BUTTON_BASE = 'appearance-none relative -mb-px rounded-t-lg border border-b-0 border-slate-900/15 px-5 py-1.5 text-base font-medium cursor-pointer transition';
  const TAB_BUTTON_ACTIVE = `${TAB_BUTTON_BASE} z-10 bg-white text-slate-900 shadow-[0_-1px_4px_rgba(15,23,42,0.06)]`;
  const TAB_BUTTON_INACTIVE = `${TAB_BUTTON_BASE} bg-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-800`;

  class WiseTabControl extends WiseControl {
    constructor(options = {}) {
      super('', options);
      this.name = 'WiseTabControl';
      this.tabs = [];
      this.style = options.style || {};
    }

    addTab(label, controls = []) {
      this.tabs.push({ label, controls });
      return this;
    }

    // See WiseTableLayout for why this is what makes addControl(tabControl)
    // auto-register every tab's controls as this[control.id].
    getChildControls() {
      return this.tabs.flatMap((tab) => tab.controls);
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        tabs: this.tabs.map((tab) => ({
          label: tab.label,
          controls: tab.controls.map((control) => control.render()),
        })),
        style: this.style,
        visible: this.visible,
      };
    }

    static renderElement(data, context) {
      const wrapper = document.createElement('div');
      WiseControl.applyCommon(wrapper, data);

      // The row of tab boxes, bottom-aligned so they all sit flush on the
      // panel's top edge regardless of each tab's own height...
      const tabBar = document.createElement('div');
      tabBar.className = 'flex items-end gap-1 pl-1';

      const panels = document.createElement('div');
      panels.className = 'rounded-lg border border-slate-900/15 bg-white p-4 shadow-sm';

      (data.tabs || []).forEach((tab, index) => {
        const tabButton = document.createElement('button');
        tabButton.type = 'button';
        tabButton.textContent = tab.label;
        tabButton.className = index === 0 ? TAB_BUTTON_ACTIVE : TAB_BUTTON_INACTIVE;

        const panel = document.createElement('div');
        panel.className = 'flex flex-col gap-2';
        panel.dataset.tabPanel = String(index);
        panel.style.display = index === 0 ? '' : 'none';
        (tab.controls || []).forEach((control) => panel.appendChild(context.desktop.renderControl(control, context.appId, context.windowId)));

        tabButton.addEventListener('click', () => {
          Array.from(tabBar.children).forEach((btn, btnIndex) => {
            btn.className = btnIndex === index ? TAB_BUTTON_ACTIVE : TAB_BUTTON_INACTIVE;
          });
          panels.querySelectorAll('[data-tab-panel]').forEach((p) => {
            p.style.display = p.dataset.tabPanel === String(index) ? '' : 'none';
          });
        });

        tabBar.appendChild(tabButton);
        panels.appendChild(panel);
      });

      wrapper.appendChild(tabBar);
      wrapper.appendChild(panels);
      return wrapper;
    }

    // Delegates to each tab's controls' own patchElement -- switching tabs
    // is purely client-side, but the controls inside every tab (including
    // hidden ones) still need to stay in sync with server-driven updates.
    static patchElement(winEl, data, context) {
      const registry = window.WiseControlRegistry;
      (data.tabs || []).forEach((tab) => {
        (tab.controls || []).forEach((control) => {
          const ControlClass = registry[control.type] || registry.WiseControl;
          if (typeof ControlClass.patchElement === 'function') {
            ControlClass.patchElement(winEl, control, context);
          }
        });
      });
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseTabControl = WiseTabControl;
  } else {
    module.exports = WiseTabControl;
  }
})();
