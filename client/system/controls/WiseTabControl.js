(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  // Horizontal layout button styles
  const TAB_BUTTON_BASE = 'appearance-none relative overflow-hidden flex flex-none whitespace-nowrap items-center justify-center rounded-t-lg px-5 py-2.5 text-sm font-medium cursor-pointer transition-all duration-150 border border-transparent select-none';
  const TAB_BUTTON_ACTIVE = `${TAB_BUTTON_BASE} bg-white text-inherit font-semibold border-slate-200/80 border-b-white shadow-2xs -mb-px z-10`;
  const TAB_BUTTON_INACTIVE = `${TAB_BUTTON_BASE} bg-slate-100/60 text-slate-600 hover:bg-slate-200/50 hover:text-inherit`;

  // Vertical layout button styles (sidebar navigation pills)
  const SIDEBAR_BUTTON_BASE = 'appearance-none group relative flex items-center justify-between w-full rounded-md px-3.5 py-2.5 text-sm font-medium cursor-pointer transition-all duration-150 border border-transparent select-none';
  const SIDEBAR_BUTTON_ACTIVE = `${SIDEBAR_BUTTON_BASE} bg-white text-inherit font-semibold shadow-xs ring-1 ring-slate-900/10 border-slate-200/60`;
  const SIDEBAR_BUTTON_INACTIVE = `${SIDEBAR_BUTTON_BASE} text-slate-600 hover:bg-slate-200/50 hover:text-inherit`;

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
    const transLabel = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(label) : label;
    return `
      ${activePill}
      <span class="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap ${isActive ? 'pl-2' : 'pl-0'} transition-all">
        ${iconHtml}
        <span class="wise-tab-text" data-raw-label="${label}">${transLabel}</span>
      </span>
      ${chevron}
    `;
  }

  function renderHorizontalButtonContent(label, icon, isActive) {
    const activeLine = isActive
      ? '<span class="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-full bg-[var(--accent,#2563eb)]"></span>'
      : '';
    const iconHtml = formatTabIcon(icon);
    const transLabel = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(label) : label;
    return `
      ${activeLine}
      <span class="inline-flex items-center gap-2 relative z-10 whitespace-nowrap">
        ${iconHtml}
        <span class="wise-tab-text" data-raw-label="${label}">${transLabel}</span>
      </span>
    `;
  }

  function tabButtonClasses(layout) {
    return layout === 'vertical'
      ? { active: SIDEBAR_BUTTON_ACTIVE, inactive: SIDEBAR_BUTTON_INACTIVE }
      : { active: TAB_BUTTON_ACTIVE, inactive: TAB_BUTTON_INACTIVE };
  }

  // The horizontal tab bar is [header row = prev button | scroller | next
  // button]. The scroller (data-tab-bar) holds only the tab buttons, so the
  // per-button index logic below is the same for both layouts. Selectors are
  // :scope-anchored because tab panels can contain nested tab controls.
  function getTabParts(wrapper) {
    return {
      tabBar: wrapper.querySelector(':scope > [data-tab-bar], :scope > [data-tab-header] > [data-tab-bar]'),
      panels: wrapper.querySelector(':scope > [data-tab-panels]'),
    };
  }

  const TAB_ARROW_CLASS = 'flex-none appearance-none cursor-pointer select-none border-0 bg-transparent flex items-center justify-center px-3 text-slate-600 shadow-none transition-colors hover:bg-slate-200/50 hover:text-inherit';

  // Wraps the scroller with < and > buttons that appear only while the tabs
  // overflow, and are disabled at the respective scroll end.
  function buildScrollableTabHeader(tabBar) {
    const header = document.createElement('div');
    header.dataset.tabHeader = '';
    header.className = 'flex items-stretch gap-1 border-b border-slate-200/80 pl-1 z-10 min-w-0 w-full';
    // The tabs must not feed ancestors' intrinsic (min-content) width, or an
    // auto-sized parent (table cell, shrink-to-fit window) grows to fit them
    // all on one line instead of letting the scroller overflow.
    header.style.contain = 'inline-size';

    const makeArrow = (glyph, dir) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = TAB_ARROW_CLASS;
      btn.setAttribute('aria-label', dir < 0 ? 'Scroll tabs left' : 'Scroll tabs right');
      btn.innerHTML = `<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="${glyph}"/></svg>`;
      btn.style.display = 'none';
      btn.addEventListener('click', () => {
        tabBar.scrollBy({ left: dir * Math.max(120, tabBar.clientWidth * 0.6), behavior: 'smooth' });
      });
      return btn;
    };
    const prev = makeArrow('15 18 9 12 15 6', -1);
    const next = makeArrow('9 18 15 12 9 6', 1);

    const update = () => {
      const overflow = tabBar.scrollWidth - tabBar.clientWidth > 1;
      prev.style.display = overflow ? '' : 'none';
      next.style.display = overflow ? '' : 'none';
      prev.disabled = tabBar.scrollLeft <= 0;
      next.disabled = tabBar.scrollLeft >= tabBar.scrollWidth - tabBar.clientWidth - 1;
      prev.style.opacity = prev.disabled ? '0.3' : '';
      next.style.opacity = next.disabled ? '0.3' : '';
    };
    tabBar.addEventListener('scroll', update, { passive: true });
    tabBar.addEventListener('wheel', (e) => {
      if (tabBar.scrollWidth <= tabBar.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      tabBar.scrollLeft += e.deltaY;
      e.preventDefault();
    }, { passive: false });
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(update).observe(tabBar);
    }
    // Buttons are re-labelled (language switch, active change) without
    // resizing the scroller, so re-check when its children change too.
    new MutationObserver(update).observe(tabBar, { childList: true, subtree: true, characterData: true });
    requestAnimationFrame(update);

    header.appendChild(prev);
    header.appendChild(tabBar);
    header.appendChild(next);
    return header;
  }

  function revealTab(tabBar, button) {
    if (!tabBar || !button || tabBar.scrollWidth <= tabBar.clientWidth) return;
    const left = button.offsetLeft;
    const right = left + button.offsetWidth;
    if (left < tabBar.scrollLeft) tabBar.scrollTo({ left: Math.max(0, left - 8), behavior: 'smooth' });
    else if (right > tabBar.scrollLeft + tabBar.clientWidth) tabBar.scrollTo({ left: right - tabBar.clientWidth + 8, behavior: 'smooth' });
  }

  class WiseTabControl extends WiseControl {
    constructor(options = {}) {
      super(options.activeIndex || 0, options);
      this.name = 'WiseTabControl';
      this.tabs = [];
      if (Array.isArray(options.tabs)) {
        options.tabs.forEach((t) => {
          this.addTab({
            id: t.id,
            label: t.label || t.title || t.name || t.id || '',
            controls: t.controls || [],
            icon: t.icon || null
          });
        });
      }
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
      let tabId = null;

      if (typeof label === 'object' && label !== null && !Array.isArray(label)) {
        tabId = label.id || null;
        tabLabel = label.label || label.title || label.name || '';
        tabControls = label.controls || controls || [];
        tabIcon = label.icon || icon || null;
      } else if (typeof icon === 'object' && icon !== null) {
        tabIcon = icon.icon || null;
      }

      this.tabs.push({ id: tabId, label: tabLabel, controls: tabControls, icon: tabIcon });
      return this;
    }

    addTabContent(tabIdOrLabel, control) {
      let targetTab = this.tabs.find((t) => t.id === tabIdOrLabel || t.label === tabIdOrLabel);
      if (!targetTab) {
        targetTab = { id: tabIdOrLabel, label: tabIdOrLabel, controls: [], icon: null };
        this.tabs.push(targetTab);
      }
      if (Array.isArray(control)) {
        targetTab.controls.push(...control);
      } else if (control) {
        targetTab.controls.push(control);
      }
      return this;
    }

    getChildControls() {
      return this.tabs.flatMap((tab) => tab.controls);
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        label: this.label,
        labelStyle: this.labelStyle,
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
      if (!isVertical) {
        wrapper.style.width = wrapper.style.width || '100%';
        wrapper.style.minWidth = '0';
        wrapper.style.maxWidth = '100%';
      }

      const activeIndex = Number(data.value) || 0;

      const tabBar = document.createElement('div');
      tabBar.className = isVertical
        ? 'flex w-52 flex-none flex-col gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 p-2 shadow-2xs backdrop-blur-xs'
        : 'flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-px -mb-px';

      tabBar.dataset.tabBar = '';
      if (!isVertical) {
        // Hidden scrollbar: the < > buttons (and wheel / touch) scroll instead.
        tabBar.style.scrollbarWidth = 'none';
      }

      const panels = document.createElement('div');
      panels.dataset.tabPanels = '';
      panels.className = isVertical
        ? 'min-w-0 flex-1 rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs'
        : 'rounded-b-lg rounded-tr-lg border border-slate-200/80 bg-white p-5 shadow-xs';

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
          if (!isVertical) revealTab(tabBar, tabBar.children[index]);
        });

        tabBar.appendChild(tabButton);
        panels.appendChild(panel);
      });

      wrapper.appendChild(isVertical ? tabBar : buildScrollableTabHeader(tabBar));
      wrapper.appendChild(panels);
      if (!isVertical) requestAnimationFrame(() => revealTab(tabBar, tabBar.children[activeIndex]));
      return wrapper;
    }

    // Reads the active tab index back from the DOM. Without this the window-side
    // control keeps its initial `value` (0) -- tab clicks only update the DOM
    // unless an onTabChanged handler is set -- so the next event from any other
    // control would patch the tab bar back to the first tab.
    static gatherValue(winEl, id) {
      const wrapper = winEl.querySelector(`[data-control-id="${id}"]`);
      if (!wrapper) return undefined;
      const panels = getTabParts(wrapper).panels;
      if (!panels) return undefined;
      const items = Array.from(panels.querySelectorAll(':scope > [data-tab-panel]'));
      const active = items.findIndex((panel) => panel.style.display !== 'none');
      return active >= 0 ? active : undefined;
    }

    static patchElement(winEl, data, context) {
      const wrapper = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (wrapper) {
        const activeIndex = Number(data.value) || 0;
        const isVertical = data.layout === 'vertical';
        const buttonClasses = tabButtonClasses(data.layout);
        const { tabBar, panels } = getTabParts(wrapper);
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
          if (!isVertical) revealTab(tabBar, tabBar.children[activeIndex]);
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





