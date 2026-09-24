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
      // The active tab index is stored as this.value (via the base class),
      // consistent with every other control -- gettable/settable through
      // the generic getValue()/setValue() rather than a bespoke property.
      super(options.activeIndex || 0, options);
      this.name = 'WiseTabControl';
      this.tabs = [];
      this.onClick = typeof options.onClick === 'function' ? options.onClick : null;
      this.onHover = typeof options.onHover === 'function' ? options.onHover : null;
      this.style = options.style || {};

      // Tab switching itself stays instant/client-only (see renderElement --
      // no round trip needed just to change which panel is visible).
      // onTabChanged is opt-in on top of that: when set, clicking a tab
      // ALSO fires a 'tabchange' event so server-side app code can react.
      // Bridged the same way WiseDataTable bridges its internal on<Event>
      // handlers to its public options -- dispatchControlEvent resolves
      // 'tabchange' to `onTabchange` (only the first letter capitalized),
      // so that's the internal hook; onTabChanged is the public one.
      this.onTabChanged = typeof options.onTabChanged === 'function' ? options.onTabChanged : null;
      this._lastActiveIndex = this.value;
      this.onTabchange = () => {
        const previousIndex = this._lastActiveIndex;
        const currentIndex = Number(this.value) || 0;
        this._lastActiveIndex = currentIndex;
        if (this.onTabChanged) {
          return this.onTabChanged(this.tabs[previousIndex] || null, this.tabs[currentIndex] || null);
        }
      };
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
        value: this.value,
        tabs: this.tabs.map((tab) => ({
          label: tab.label,
          controls: tab.controls.map((control) => control.render()),
        })),
        hasTabChangeHandler: !!this.onTabChanged,
        hasClickHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        style: this.style,
        visible: this.visible,
      };
    }

    static renderElement(data, context) {
      const wrapper = document.createElement('div');
      WiseControl.applyCommon(wrapper, data, context);

      const activeIndex = Number(data.value) || 0;

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
        tabButton.className = index === activeIndex ? TAB_BUTTON_ACTIVE : TAB_BUTTON_INACTIVE;

        const panel = document.createElement('div');
        panel.className = 'flex flex-col gap-2';
        panel.dataset.tabPanel = String(index);
        panel.style.display = index === activeIndex ? '' : 'none';
        (tab.controls || []).forEach((control) => panel.appendChild(context.desktop.renderControl(control, context.appId, context.windowId)));

        tabButton.addEventListener('click', () => {
          // Switching tabs stays instant/client-only -- no reason to wait
          // on a round trip just to show a different panel.
          Array.from(tabBar.children).forEach((btn, btnIndex) => {
            btn.className = btnIndex === index ? TAB_BUTTON_ACTIVE : TAB_BUTTON_INACTIVE;
          });
          panels.querySelectorAll('[data-tab-panel]').forEach((p) => {
            p.style.display = p.dataset.tabPanel === String(index) ? '' : 'none';
          });
          // onTabChanged is opt-in on top of that -- only fires a real
          // event (and so a server round trip) when an app author actually
          // asked for one.
          if (data.hasTabChangeHandler) {
            context.desktop.sendControlEvent(context.appId, data.id, tabButton, 'tabchange', { [data.id]: index });
          }
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
    // Also re-syncs which tab is showing, in case a handler called
    // setValue() on this control server-side (e.g. jumping to a tab in
    // response to something other than the user clicking it directly).
    static patchElement(winEl, data, context) {
      const wrapper = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (wrapper) {
        const activeIndex = Number(data.value) || 0;
        const [tabBar, panels] = wrapper.children;
        if (tabBar && panels) {
          Array.from(tabBar.children).forEach((btn, index) => {
            btn.className = index === activeIndex ? TAB_BUTTON_ACTIVE : TAB_BUTTON_INACTIVE;
          });
          panels.querySelectorAll('[data-tab-panel]').forEach((panel) => {
            panel.style.display = panel.dataset.tabPanel === String(activeIndex) ? '' : 'none';
          });
        }
      }

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
