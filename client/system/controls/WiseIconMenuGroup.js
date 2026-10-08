(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  class WiseIconMenuGroup extends WiseControl {
    constructor(title = '', items = [], options = {}) {
      let resolvedTitle = title;
      let resolvedItems = items;
      let resolvedOptions = options;

      if (typeof title === 'object' && title !== null && !Array.isArray(title)) {
        resolvedOptions = title;
        resolvedTitle = resolvedOptions.title || '';
        resolvedItems = resolvedOptions.items || resolvedOptions.menus || [];
      } else if (Array.isArray(items)) {
        resolvedItems = items;
        resolvedOptions = options || {};
      } else if (typeof items === 'object' && items !== null) {
        resolvedOptions = items;
        resolvedItems = resolvedOptions.items || resolvedOptions.menus || [];
      }

      super('', resolvedOptions);
      this.name = 'WiseIconMenuGroup';
      this.title = resolvedTitle || resolvedOptions.title || '';
      this.items = resolvedItems || [];
      this.layout = resolvedOptions.layout || 'horizontal'; // 'horizontal' | 'grid' | 'vertical'
      this.columns = resolvedOptions.columns || 4;
      this.style = resolvedOptions.style || {};
      this.onClick = typeof resolvedOptions.onClick === 'function' ? resolvedOptions.onClick : null;
      this.onHover = typeof resolvedOptions.onHover === 'function' ? resolvedOptions.onHover : null;
    }

    addMenu(menu) {
      this.items.push(menu);
      return this;
    }

    addControl(menu) {
      return this.addMenu(menu);
    }

    getChildControls() {
      return this.items;
    }

    getItems() {
      return this.items;
    }

    setItems(items) {
      this.items = items || [];
      return this;
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        title: this.title,
        layout: this.layout,
        columns: this.columns,
        items: (this.items || []).map((item) => (typeof item.render === 'function' ? item.render() : item)),
        hasClickHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        style: this.style,
        visible: this.visible,
        disabled: this.disabled,
      };
    }

    static renderElement(data, context) {
      const groupEl = document.createElement('div');
      groupEl.className = 'wise-icon-menu-group relative z-40 rounded-lg border border-slate-900/10 bg-white/70 px-2.5 py-1.5 shadow-xs backdrop-blur-md transition';
      groupEl.style.position = 'relative';
      groupEl.style.zIndex = '40';

      WiseControl.applyCommon(groupEl, data, context);

      if (data.title) {
        const header = document.createElement('div');
        header.className = 'mb-1.5 flex items-center justify-between border-b border-slate-200/60 pb-1';
        const titleText = document.createElement('span');
        titleText.className = 'text-xs font-bold uppercase tracking-wider text-slate-500';
        titleText.textContent = data.title;
        header.appendChild(titleText);
        groupEl.appendChild(header);
      }

      const body = document.createElement('div');
      if (data.layout === 'vertical') {
        body.className = 'flex flex-col gap-1.5';
      } else if (data.layout === 'grid') {
        const cols = data.columns || 4;
        body.className = 'grid gap-2';
        body.style.display = 'grid';
        body.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
      } else {
        // horizontal (default)
        body.className = 'flex flex-row flex-wrap items-center gap-1';
      }

      (data.items || []).forEach((item) => {
        body.appendChild(context.desktop.renderControl(item, context.appId, context.windowId));
      });

      groupEl.appendChild(body);
      return groupEl;
    }

    static patchElement(winEl, data, context) {
      const existing = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (existing && context) {
        existing.replaceWith(WiseIconMenuGroup.renderElement(data, context));
        return;
      }

      const registry = window.WiseControlRegistry;
      (data.items || []).forEach((item) => {
        const ControlClass = registry[item.type] || registry.WiseControl;
        if (typeof ControlClass.patchElement === 'function') {
          ControlClass.patchElement(winEl, item, context);
        }
      });
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseIconMenuGroup = WiseIconMenuGroup;
  } else {
    module.exports = WiseIconMenuGroup;
  }
})();
