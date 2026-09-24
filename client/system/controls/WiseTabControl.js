(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  // Horizontal layout button styles
  const TAB_BUTTON_BASE = 'appearance-none relative overflow-hidden flex items-center justify-center rounded-t-xl px-5 py-2.5 text-xs font-medium cursor-pointer transition-all duration-150 border border-transparent select-none';
  const TAB_BUTTON_ACTIVE = `${TAB_BUTTON_BASE} bg-white text-slate-900 font-semibold border-slate-200/80 border-b-white shadow-2xs -mb-px z-10`;
  const TAB_BUTTON_INACTIVE = `${TAB_BUTTON_BASE} bg-slate-100/60 text-slate-600 hover:bg-slate-200/50 hover:text-slate-900`;

  // Vertical layout button styles (sidebar navigation pills)
  const SIDEBAR_BUTTON_BASE = 'appearance-none group relative flex items-center justify-between w-full rounded-lg px-3.5 py-2.5 text-xs font-medium cursor-pointer transition-all duration-150 border border-transparent select-none';
  const SIDEBAR_BUTTON_ACTIVE = `${SIDEBAR_BUTTON_BASE} bg-white text-slate-900 font-semibold shadow-xs ring-1 ring-slate-900/10 border-slate-200/60`;
  const SIDEBAR_BUTTON_INACTIVE = `${SIDEBAR_BUTTON_BASE} text-slate-600 hover:bg-slate-200/50 hover:text-slate-900`;

  function formatTabIcon(icon) {
    if (!icon) return '';
    const rawIcon = String(icon).trim();
    if (rawIcon.startsWith('<')) {
      return `<span class="wise-tab-icon inline-flex items-center justify-center shrink-0">${rawIcon}</span>`;
    }
    if (/^(https?:\/\/|\/|data:)/.test(rawIcon)) {
      return `<span class="wise-tab-icon inline-flex items-center justify-center shrink-0"><img src="${rawIcon}" class="w-4 h-4 object-contain" alt="" /></span>`;
    }
    if (rawIcon.includes(' ')) {
      return `<span class="wise-tab-icon inline-flex items-center justify-center shrink-0"><i class="${rawIcon}"></i></span>`;
    }
    return `<span class="wise-tab-icon inline-flex items-center justify-center shrink-0 text-sm">${rawIcon}</span>`;
  }

  function renderSidebarButtonContent(label, icon, isActive) {
    const activePill = isActive
      ? '<span class="absolute left-1.5 top-2.5 bottom-2.5 w-1 rounded-full bg-[var(--accent,#2563eb)]"></span>'
      : '';
    const iconHtml = formatTabIcon(icon);
    const chevron = isActive
      ? '<svg class="w-3.5 h-3.5 text-[var(--accent,#2563eb)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>'
      : '<svg class="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>';
    return `
      ${activePill}
      <span class="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap ${isActive ? 'pl-2' : 'pl-0'} transition-all">
        ${iconHtml}
        <span>${label}</span>
      </span>
      ${chevron}
    `;
  }

  function renderHorizontalButtonContent(label, icon, isActive) {
    const activeLine = isActive
      ? '<span class="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-full bg-[var(--accent,#2563eb)]"></span>'
      : '';
    const iconHtml = formatTabIcon(icon);
    return `
      ${activeLine}
      <span class="inline-flex items-center gap-2 relative z-10">
        ${iconHtml}
        <span>${label}</span>
      </span>
    `;
  }

  function tabButtonClasses(layout) {
    return layout === 'vertical'
      ? { active: SIDEBAR_BUTTON_ACTIVE, inactive: SIDEBAR_BUTTON_INACTIVE }
      : { active: TAB_BUTTON_ACTIVE, inactive: TAB_BUTTON_INACTIVE };
  }

  class WiseTabControl extends WiseControl {
    constructor(options = {}) {
      super(options.activeIndex || 0, options);
      this.name = 'WiseTabControl';
      this.tabs = [];
      this.layout = options.layout === 'vertical' ? 'vertical' : 'horizontal';
      this.onClick = typeof options.onClick === 'function' ? options.onClick : null;
      this.onHover = typeof options.onHover === 'function' ? options.onHover : null;
      this.style = options.style || {};

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

    addTab(label, controls = [], icon = null) {
      let tabLabel = label;
      let tabControls = controls;
      let tabIcon = icon;

      if (typeof label === 'object' && label !== null && !Array.isArray(label)) {
        tabLabel = label.label || '';
        tabControls = label.controls || controls || [];
        tabIcon = label.icon || icon || null;
      } else if (typeof icon === 'object' && icon !== null) {
        tabIcon = icon.icon || null;
      }

      this.tabs.push({ label: tabLabel, controls: tabControls, icon: tabIcon });
      return this;
    }

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
          icon: tab.icon || null,
          controls: tab.controls.map((control) => control.render()),
        })),
        hasTabChangeHandler: !!this.onTabChanged,
        hasClickHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        layout: this.layout,
        style: this.style,
        visible: this.visible,
        disabled: this.disabled,
      };
    }

    static renderElement(data, context) {
      const isVertical = data.layout === 'vertical';
      const buttonClasses = tabButtonClasses(data.layout);

      const wrapper = document.createElement('div');
      wrapper.className = isVertical ? 'flex items-stretch gap-2' : 'flex flex-col';
      WiseControl.applyCommon(wrapper, data, context);

      const activeIndex = Number(data.value) || 0;

      const tabBar = document.createElement('div');
      tabBar.className = isVertical
        ? 'flex w-52 flex-none flex-col gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 shadow-2xs backdrop-blur-xs'
        : 'flex items-center gap-1.5 border-b border-slate-200/80 pl-1 z-10';

      const panels = document.createElement('div');
      panels.className = isVertical
        ? 'min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs'
        : 'rounded-b-xl rounded-tr-xl border border-slate-200/80 bg-white p-5 shadow-xs';

      (data.tabs || []).forEach((tab, index) => {
        const isActive = index === activeIndex;
        const tabButton = document.createElement('button');
        tabButton.type = 'button';
        tabButton.className = isActive ? buttonClasses.active : buttonClasses.inactive;
        if (isVertical) {
          tabButton.innerHTML = renderSidebarButtonContent(tab.label, tab.icon, isActive);
        } else {
          tabButton.innerHTML = renderHorizontalButtonContent(tab.label, tab.icon, isActive);
        }

        const panel = document.createElement('div');
        panel.className = 'flex flex-col gap-2';
        panel.dataset.tabPanel = String(index);
        panel.style.display = isActive ? '' : 'none';
        (tab.controls || []).forEach((control) => panel.appendChild(context.desktop.renderControl(control, context.appId, context.windowId)));

        tabButton.addEventListener('click', () => {
          Array.from(tabBar.children).forEach((btn, btnIndex) => {
            const isBtnActive = btnIndex === index;
            const currentTab = data.tabs[btnIndex] || {};
            btn.className = isBtnActive ? buttonClasses.active : buttonClasses.inactive;
            if (isVertical) {
              btn.innerHTML = renderSidebarButtonContent(currentTab.label || '', currentTab.icon, isBtnActive);
            } else {
              btn.innerHTML = renderHorizontalButtonContent(currentTab.label || '', currentTab.icon, isBtnActive);
            }
          });
          panels.querySelectorAll('[data-tab-panel]').forEach((p) => {
            p.style.display = p.dataset.tabPanel === String(index) ? '' : 'none';
          });
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

    static patchElement(winEl, data, context) {
      const wrapper = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (wrapper) {
        const activeIndex = Number(data.value) || 0;
        const isVertical = data.layout === 'vertical';
        const buttonClasses = tabButtonClasses(data.layout);
        const [tabBar, panels] = wrapper.children;
        if (tabBar && panels) {
          Array.from(tabBar.children).forEach((btn, index) => {
            const isActive = index === activeIndex;
            const currentTab = data.tabs[index] || {};
            btn.className = isActive ? buttonClasses.active : buttonClasses.inactive;
            if (isVertical) {
              btn.innerHTML = renderSidebarButtonContent(currentTab.label || '', currentTab.icon, isActive);
            } else {
              btn.innerHTML = renderHorizontalButtonContent(currentTab.label || '', currentTab.icon, isActive);
            }
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





