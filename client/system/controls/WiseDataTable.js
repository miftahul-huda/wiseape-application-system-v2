(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  // Paging/sort/row-select/cell interactions all round-trip through this one
  // control id with a different eventName per interaction (see the
  // on<EventName> handlers below). Since dispatchControlEvent() only syncs
  // values by matching control id -> control.value before calling the
  // handler, every interaction is sent as { [data.id]: <payload> } and read
  // back as `this.value` inside the matching handler -- the same trick
  // WiseFileUpload uses for its async upload result.
  class WiseDataTable extends WiseControl {
    constructor(options = {}) {
      super(null, options);
      this.name = 'WiseDataTable';
      this.columns = [];
      this.data = [];
      this.totalCount = 0;
      this.pageSize = options.pageSize || 10;
      this.currentPage = options.currentPage || 1;
      this.pageSizeOptions = options.pageSizeOptions || [];
      this.sortField = options.sortField || null;
      this.sortDirection = options.sortDirection || 'asc';
      this.height = options.height || (options.style && options.style.height) || null;
      this.maxHeight = options.maxHeight || (options.style && options.style.maxHeight) || null;
      this.scrollable = options.scrollable !== undefined ? options.scrollable : true;
      this.onDataFilterChanged = typeof options.onDataFilterChanged === 'function' ? options.onDataFilterChanged : null;
      this.onRowSelect = typeof options.onRowSelect === 'function' ? options.onRowSelect : null;
      this.onClick = typeof options.onClick === 'function' ? options.onClick : null;
      this.onHover = typeof options.onHover === 'function' ? options.onHover : null;
      this.multiSelect = options.multiSelect !== undefined ? options.multiSelect : true;
      this.selectedRowIndices = Array.isArray(options.selectedRowIndices)
        ? options.selectedRowIndices.map(Number)
        : (options.selectedRowIndex !== null && options.selectedRowIndex !== undefined ? [Number(options.selectedRowIndex)] : []);
      this.selectedRowIndex = this.selectedRowIndices.length > 0 ? this.selectedRowIndices[0] : null;
      this.style = options.style || {};
      this.contextMenuItems = [];

      // Arrow functions (not prototype methods) so `this` stays the control
      // instance even though dispatchControlEvent invokes them via
      // `handler.call(win)` -- exactly like an app author's own
      // `.bind(this)`'d handlers, just supplied internally here instead.
      this.onFilterchange = () => {
        const payload = this.value || {};
        if (payload.pageSize !== undefined) this.pageSize = payload.pageSize;
        if (payload.currentPage !== undefined) this.currentPage = payload.currentPage;
        if (payload.sortField !== undefined) this.sortField = payload.sortField;
        if (payload.sortDirection !== undefined) this.sortDirection = payload.sortDirection;
        if (this.onDataFilterChanged) {
          return this.onDataFilterChanged(this.pageSize, this.currentPage);
        }
      };

      this.onRowselect = () => {
        const payload = this.value || {};
        if (Array.isArray(payload.selectedRowIndices)) {
          this.selectedRowIndices = payload.selectedRowIndices.map(Number).filter((idx) => !isNaN(idx));
          this.selectedRowIndex = this.selectedRowIndices.length > 0 ? this.selectedRowIndices[0] : null;
        } else if (payload.rowIndex !== undefined && payload.rowIndex !== null) {
          this.selectedRowIndex = Number(payload.rowIndex);
          this.selectedRowIndices = [this.selectedRowIndex];
        } else {
          this.selectedRowIndices = [];
          this.selectedRowIndex = null;
        }
        const selectedRows = this.getSelectedRows();
        const primaryRow = selectedRows.length > 0 ? selectedRows[0] : (payload.rowIndex !== undefined ? this.data[payload.rowIndex] : null);
        if (this.onRowSelect) {
          return this.onRowSelect(primaryRow, selectedRows);
        }
      };

      this.onCellchange = () => {
        const payload = this.value || {};
        const column = this.columns.find((col) => col.dataField === payload.dataField);
        const row = this.data[payload.rowIndex];
        if (row && column && typeof column.onChange === 'function') {
          return column.onChange(row, payload.newValue, payload.rowIndex);
        }
      };

      this.onCellclick = () => {
        const payload = this.value || {};
        const column = this.columns.find((col) => col.dataField === payload.dataField);
        const row = this.data[payload.rowIndex];
        if (row && column && typeof column.onClick === 'function') {
          return column.onClick(row, payload.rowIndex);
        }
      };

      this.onContextmenuaction = () => {
        const payload = this.value || {};
        const item = this.contextMenuItems.find((entry) => entry.id === payload.itemId);
        const row = this.data[payload.rowIndex];
        if (item && typeof item.onClick === 'function') {
          return item.onClick(row, payload.rowIndex);
        }
      };

      // dispatchControlEvent capitalises the first letter of the event name
      // to derive the handler: 'filterinputchange' → 'onFilterinputchange'.
      this.onFilterinputchange = () => {
        const payload = this.value || {};
        if (this.filterControls && Array.isArray(this.filterControls)) {
          this.filterControls.forEach((f) => {
            if (payload[f.id] !== undefined) {
              f.value = payload[f.id];
            }
          });
        }
        if (this.onFilterChange) {
          return this.onFilterChange(payload);
        }
      };
    }

    get value() {
      return this._value;
    }

    set value(val) {
      this._value = val;
      if (val && typeof val === 'object') {
        if (Array.isArray(val.selectedRowIndices)) {
          this.setSelectedRowIndices(val.selectedRowIndices);
        } else if (val.rowIndex !== undefined && val.rowIndex !== null) {
          this.setSelectedRowIndex(val.rowIndex);
        }
      }
    }

    setColumns(columns) {
      this.columns = columns || [];
      return this;
    }

    // Registers the right-click context menu shown on every row. Each item
    // is { id?, label, icon?, onClick(row, rowIndex) } -- onClick runs
    // server-side (like a column's own onClick/onChange), routed back
    // through the same event round-trip as row selection via the
    // 'contextmenuaction' event. `icon` follows the same formats WiseIconMenu
    // accepts: an emoji/glyph, inline "<svg...", or an image URL.
    addContextMenu(items) {
      this.contextMenuItems = (items || []).map((item, index) => ({
        id: item.id || `ctx-${index}`,
        label: item.label,
        icon: item.icon || null,
        onClick: typeof item.onClick === 'function' ? item.onClick : null,
      }));
      return this;
    }

    // Adds a single filter control descriptor to the filter bar.
    // Each filter is a plain object:
    //   { id, type: 'text'|'select', placeholder?, label?, items?, onChange }
    // `onChange(filterValues)` receives a map of { [filterId]: value } for
    // ALL current filters every time any one of them changes.
    addFilter(filter) {
      if (!this.filterControls) this.filterControls = [];
      this.filterControls.push(filter);
      // Store onChange separately (functions can't survive JSON serialize)
      if (!this._filterHandlers) this._filterHandlers = {};
      if (typeof filter.onChange === 'function') {
        this._filterHandlers[filter.id] = filter.onChange;
      }
      // If any filter has an onChange, wire up the single shared handler
      this.onFilterChange = (payload) => {
        const handler = Object.values(this._filterHandlers)[0];
        if (handler) return handler(payload);
      };
      return this;
    }

    // Adds multiple filter controls at once.
    addFilters(filters) {
      (filters || []).forEach((f) => this.addFilter(f));
      return this;
    }

    // Clears all filter values and flags the control so the next DOM patch
    // resets input values rather than restoring the stale DOM snapshot.
    clearFilterValues() {
      if (this.filterControls && Array.isArray(this.filterControls)) {
        this.filterControls.forEach((f) => {
          f.value = '';
        });
      }
      this._filterValuesCleared = true;
      return this;
    }

    // Exactly one page of data at a time -- this control never holds (or
    // expects) the whole dataset. See docs/DEVELOPMENT_GUIDE.md §5.
    // Resetting selectedRowIndex ensures the highlight clears on page navigation.
    setData(rows, totalCount) {
      this.data = rows || [];
      this.totalCount = totalCount || 0;
      this.selectedRowIndices = [];
      this.selectedRowIndex = null;
      return this;
    }

    getData() {
      return this.data;
    }

    selectAll() {
      this.selectedRowIndices = (this.data || []).map((_, idx) => idx);
      this.selectedRowIndex = this.selectedRowIndices.length > 0 ? this.selectedRowIndices[0] : null;
      return this;
    }

    deselectAll() {
      this.selectedRowIndices = [];
      this.selectedRowIndex = null;
      return this;
    }

    clearSelection() {
      return this.deselectAll();
    }

    isAllSelected() {
      return (this.data || []).length > 0 && this.selectedRowIndices.length >= this.data.length;
    }

    toggleSelectAll() {
      if (this.isAllSelected()) {
        return this.deselectAll();
      } else {
        return this.selectAll();
      }
    }

    setValue(value) {
      super.setValue(value);
      if (value && typeof value === 'object') {
        if (Array.isArray(value.selectedRowIndices)) {
          this.selectedRowIndices = value.selectedRowIndices.map(Number).filter((idx) => !isNaN(idx));
          this.selectedRowIndex = this.selectedRowIndices.length > 0 ? this.selectedRowIndices[0] : null;
        } else if (value.rowIndex !== undefined && value.rowIndex !== null) {
          this.selectedRowIndex = Number(value.rowIndex);
          this.selectedRowIndices = [this.selectedRowIndex];
        }
      }
      return this;
    }

    getSelectedRowIndex() {
      if (this.selectedRowIndices && this.selectedRowIndices.length > 0) {
        return this.selectedRowIndices[0];
      }
      if (this.value && typeof this.value === 'object') {
        if (this.value.rowIndex !== undefined && this.value.rowIndex !== null) {
          return Number(this.value.rowIndex);
        }
        if (Array.isArray(this.value.selectedRowIndices) && this.value.selectedRowIndices.length > 0) {
          return Number(this.value.selectedRowIndices[0]);
        }
      }
      return null;
    }

    setSelectedRowIndex(index) {
      if (index === null || index === undefined) {
        this.selectedRowIndices = [];
        this.selectedRowIndex = null;
      } else {
        this.selectedRowIndices = [Number(index)];
        this.selectedRowIndex = Number(index);
      }
      return this;
    }

    getSelectedRowIndices() {
      if (this.selectedRowIndices && this.selectedRowIndices.length > 0) {
        return [...this.selectedRowIndices];
      }
      if (this.value && typeof this.value === 'object' && Array.isArray(this.value.selectedRowIndices)) {
        return this.value.selectedRowIndices.map(Number).filter((idx) => !isNaN(idx));
      }
      return [];
    }

    setSelectedRowIndices(indices) {
      this.selectedRowIndices = (indices || []).map(Number).filter((idx) => !isNaN(idx));
      this.selectedRowIndex = this.selectedRowIndices.length > 0 ? this.selectedRowIndices[0] : null;
      return this;
    }

    getSelectedRows() {
      const indices = this.getSelectedRowIndices();
      if (indices.length > 0) {
        return indices.map((idx) => this.data[idx]).filter(Boolean);
      }
      const singleIdx = this.getSelectedRowIndex();
      if (singleIdx !== null && this.data[singleIdx]) {
        return [this.data[singleIdx]];
      }
      return [];
    }

    getSelectedRow() {
      const rows = this.getSelectedRows();
      return rows.length > 0 ? rows[0] : null;
    }

    render() {
      const out = {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        columns: this.columns,
        data: this.data,
        totalCount: this.totalCount,
        selectedRowIndex: this.selectedRowIndices.length > 0 ? this.selectedRowIndices[0] : null,
        selectedRowIndices: this.selectedRowIndices || [],
        multiSelect: this.multiSelect !== false,
        pageSize: this.pageSize,
        currentPage: this.currentPage,
        pageSizeOptions: this.pageSizeOptions,
        sortField: this.sortField,
        sortDirection: this.sortDirection,
        height: this.height,
        maxHeight: this.maxHeight,
        scrollable: this.scrollable,
        contextMenuItems: this.contextMenuItems.map((item) => ({ id: item.id, label: item.label, icon: item.icon })),
        // Serialize filter control descriptors (no function fields)
        filterControls: (this.filterControls || []).map((f) => ({
          id: f.id,
          type: f.type || 'text',
          placeholder: f.placeholder || '',
          label: f.label || '',
          items: f.items || [],
          value: f.value || '',
          hasHandler: !!(this._filterHandlers && Object.keys(this._filterHandlers).length > 0),
        })),
        filterValuesCleared: !!this._filterValuesCleared,
        hasRowSelectHandler: true,
        hasClickHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        style: this.style,
        visible: this.visible,
        disabled: this.disabled,
      };
      this._filterValuesCleared = false;
      return out;
    }

    static renderElement(data, context) {
      const wrapper = document.createElement('div');
      wrapper.className = 'flex flex-col gap-2';
      WiseControl.applyCommon(wrapper, data, context);

      const fireFilterChange = (patch) => {
        context.desktop.sendControlEvent(context.appId, data.id, wrapper, 'filterchange', {
          [data.id]: {
            pageSize: data.pageSize,
            currentPage: data.currentPage,
            sortField: data.sortField,
            sortDirection: data.sortDirection,
            ...patch,
          },
        });
      };

      // Filter bar -- rendered only when filters have been registered via
      // addFilter / addFilters. Inputs fire a debounced 'filterinputchange'
      // event (for text) or an immediate one (for select) so the app can
      // re-query the API with the current filter values.
      if ((data.filterControls || []).length > 0) {
        wrapper.appendChild(WiseDataTable.renderFilterBar(data, context));
      }

      // Pagination at both ends -- convenient on a long table where the
      // bottom pager would otherwise be a scroll away. Both instances are
      // wired to the same fireFilterChange, and a full re-render on every
      // interaction (see patchElement) keeps them in sync automatically.
      wrapper.appendChild(WiseDataTable.renderPager(data, fireFilterChange, 'top'));
      wrapper.appendChild(WiseDataTable.renderTable(data, context, fireFilterChange));
      wrapper.appendChild(WiseDataTable.renderPager(data, fireFilterChange, 'bottom'));

      return wrapper;
    }

    // Renders the horizontal filter bar above the table. Each registered
    // filter appears as a labelled input (text) or select (select/combobox).
    // All inputs share one 'filterinputchange' event payload: a map of
    // { [filterId]: currentValue } for every filter, so the server handler
    // always has the full picture without having to merge state itself.
    static renderFilterBar(data, context) {
      const bar = document.createElement('div');
      bar.className = 'wise-dt-filter-bar flex flex-wrap items-end gap-3 rounded-lg border border-slate-900/8 bg-transparent px-4 py-3 shadow-sm';

      // Collect all current input elements so we can snapshot all values
      // whenever any one of them changes.
      const inputEls = {};

      const fireFilterInput = (triggerId, triggerEl) => {
        if (!data.filterControls.some((f) => f.hasHandler)) return;
        const values = {};
        data.filterControls.forEach((f) => {
          const el = inputEls[f.id];
          values[f.id] = el ? el.value : (f.value || '');
        });
        // Use the triggering element (always live in DOM) as sourceEl so
        // closest('.window') succeeds even after a patchElement rebuild that
        // has already detached the original `bar` reference.
        const sourceEl = triggerEl || bar;
        context.desktop.sendControlEvent(context.appId, data.id, sourceEl, 'filterinputchange', {
          [data.id]: { ...values, _triggerId: triggerId },
        });
      };

      (data.filterControls || []).forEach((filter) => {
        const group = document.createElement('div');
        group.className = 'flex flex-col gap-1 min-w-[140px] flex-1';

        if (filter.label) {
          const lbl = document.createElement('label');
          lbl.className = 'text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none';
          lbl.textContent = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(filter.label) : filter.label;
          lbl.htmlFor = `${data.id}-filter-${filter.id}`;
          group.appendChild(lbl);
        }

        if (filter.type === 'select') {
          // Wrapper for the chevron overlay
          const selectWrap = document.createElement('div');
          selectWrap.className = 'relative';

          const sel = document.createElement('select');
          sel.id = `${data.id}-filter-${filter.id}`;
          sel.className = 'w-full cursor-pointer appearance-none rounded-sm border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-sm text-slate-800 shadow-none outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]';
          inputEls[filter.id] = sel;

          (filter.items || []).forEach((item) => {
            const option = document.createElement('option');
            const v = typeof item === 'object' ? item.value : item;
            const l = typeof item === 'object' ? item.label : item;
            option.value = v;
            option.textContent = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(l) : l;
            if (v === (filter.value || '')) option.selected = true;
            sel.appendChild(option);
          });

          sel.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              fireFilterInput(filter.id, sel);
            }
          });

          const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          chevron.setAttribute('viewBox', '0 0 24 24');
          chevron.setAttribute('fill', 'none');
          chevron.setAttribute('stroke', 'currentColor');
          chevron.setAttribute('stroke-width', '2');
          chevron.setAttribute('class', 'pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400');
          chevron.innerHTML = '<path d="m6 9 6 6 6-6"></path>';

          selectWrap.appendChild(sel);
          selectWrap.appendChild(chevron);
          group.appendChild(selectWrap);
        } else {
          // text input with search icon
          const inputWrap = document.createElement('div');
          inputWrap.className = 'relative';

          const searchIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          searchIcon.setAttribute('viewBox', '0 0 24 24');
          searchIcon.setAttribute('fill', 'none');
          searchIcon.setAttribute('stroke', 'currentColor');
          searchIcon.setAttribute('stroke-width', '2');
          searchIcon.setAttribute('class', 'pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400');
          searchIcon.innerHTML = '<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.35-4.35"></path>';

          const inp = document.createElement('input');
          inp.type = 'text';
          inp.id = `${data.id}-filter-${filter.id}`;
          inp.placeholder = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(filter.placeholder || '') : (filter.placeholder || '');
          inp.value = filter.value || '';
          inp.className = 'w-full appearance-none rounded-sm border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-800 placeholder-slate-400 shadow-none outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]';
          inputEls[filter.id] = inp;

          // Trigger on Enter key
          inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              fireFilterInput(filter.id, inp);
            }
          });

          inputWrap.appendChild(searchIcon);
          inputWrap.appendChild(inp);
          group.appendChild(inputWrap);
        }

        bar.appendChild(group);
      });

      // Display Button
      const btnGroup = document.createElement('div');
      btnGroup.className = 'flex flex-col justify-end';

      const displayBtn = document.createElement('button');
      displayBtn.type = 'button';
      displayBtn.id = `${data.id}-filter-btn-display`;
      displayBtn.className = 'inline-flex items-center justify-center gap-1.5 rounded-md border-0 bg-[var(--accent,#2563eb)] px-3.5 py-1.5 text-sm font-medium text-white shadow-none transition-all duration-150 ease-out hover:opacity-90 active:scale-95 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[var(--accent,#2563eb)] focus:ring-offset-1 h-[34px]';

      const filterIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      filterIcon.setAttribute('viewBox', '0 0 24 24');
      filterIcon.setAttribute('fill', 'none');
      filterIcon.setAttribute('stroke', 'currentColor');
      filterIcon.setAttribute('stroke-width', '2');
      filterIcon.setAttribute('class', 'h-4 w-4 text-white');
      filterIcon.innerHTML = '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>';

      const btnText = document.createElement('span');
      btnText.textContent = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t('TAMPILKAN') : 'Display';

      displayBtn.appendChild(filterIcon);
      displayBtn.appendChild(btnText);

      displayBtn.addEventListener('click', () => {
        fireFilterInput('displayBtn', displayBtn);
      });

      btnGroup.appendChild(displayBtn);
      bar.appendChild(btnGroup);

      return bar;
    }

    static renderTable(data, context, fireFilterChange) {
      const box = document.createElement('div');
      box.className = 'wise-dt-box overflow-hidden rounded-lg border border-slate-900/10 bg-white shadow-md';

      // Scrollable div wrapping the table and rows
      const scrollDiv = document.createElement('div');
      scrollDiv.className = 'wise-datatable-scroll overflow-x-auto overflow-y-auto';
      if (data.height) {
        scrollDiv.style.height = typeof data.height === 'number' ? `${data.height}px` : data.height;
      }
      if (data.maxHeight) {
        scrollDiv.style.maxHeight = typeof data.maxHeight === 'number' ? `${data.maxHeight}px` : data.maxHeight;
      } else if (!data.height && data.scrollable !== false) {
        scrollDiv.style.maxHeight = '380px';
      }

      const table = document.createElement('table');
      table.className = 'w-full border-collapse text-sm';

      const thead = document.createElement('thead');
      thead.className = 'wise-dt-thead';
      thead.style.position = 'sticky';
      thead.style.top = '0';
      thead.style.zIndex = '10';
      const headRow = document.createElement('tr');

      (data.columns || []).forEach((col) => {
        const th = document.createElement('th');
        th.className = 'wise-dt-th px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/95';
        th.style.position = 'sticky';
        th.style.top = '0';
        th.style.zIndex = '10';
        if (col.width) {
          const w = typeof col.width === 'number' ? `${col.width}px` : col.width;
          th.style.width = w;
          th.style.minWidth = w;
        }

        const dataField = col.dataField || col.key || col.field || col.name;
        const sortable = col.sortable !== false && !!dataField;
        const label = document.createElement('span');
        label.className = 'inline-flex items-center gap-1';
        const rawHeader = col.header || col.label || col.title || '';
        const labelText = document.createElement('span');
        labelText.className = 'header-label';
        labelText.dataset.rawText = rawHeader;
        labelText.textContent = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(rawHeader) : rawHeader;
        label.appendChild(labelText);

        if (sortable) {
          const arrow = document.createElement('span');
          arrow.className = 'wise-dt-sort-arrow text-[9px] leading-none';
          const isActive = data.sortField === col.dataField;
          arrow.textContent = isActive ? (data.sortDirection === 'desc' ? '▼' : '▲') : '⇅';
          arrow.style.opacity = isActive ? '1' : '0.45';
          label.appendChild(arrow);

          th.classList.add('cursor-pointer', 'select-none');
          th.addEventListener('click', () => {
            const nextDirection = data.sortField === col.dataField && data.sortDirection === 'asc' ? 'desc' : 'asc';
            fireFilterChange({ sortField: col.dataField, sortDirection: nextDirection, currentPage: 1 });
          });
        }

        th.appendChild(label);
        headRow.appendChild(th);
      });

      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');

      if (!data.data || data.data.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = (data.columns || []).length || 1;
        emptyCell.className = 'wise-dt-empty px-3 py-10 text-center text-sm text-slate-400';
        emptyCell.textContent = 'Tidak ada data';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
      }

      const selectedIndices = Array.isArray(data.selectedRowIndices)
        ? data.selectedRowIndices.map(Number)
        : (data.selectedRowIndex !== null && data.selectedRowIndex !== undefined ? [Number(data.selectedRowIndex)] : []);

      (data.data || []).forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        tr.dataset.rowIndex = String(rowIndex);
        const isOdd = rowIndex % 2 === 1;

        const isSelected = selectedIndices.includes(rowIndex);
        if (isSelected) {
          tr.className = 'selected wise-dt-row-selected wise-dt-row cursor-pointer';
          tr.style.setProperty('background-color', '#bfdbfe', 'important');
        } else if (isOdd) {
          tr.className = 'wise-dt-row-alt wise-dt-row cursor-pointer';
        } else {
          tr.className = 'wise-dt-row cursor-pointer';
        }

        const selectRow = (e) => {
          if (e && e.target && e.target.closest && e.target.closest('[data-cell-interactive]')) return;

          let nextSelected = [];
          const isCtrlOrMeta = e && (e.ctrlKey || e.metaKey);
          const isShift = e && e.shiftKey;

          if (isCtrlOrMeta) {
            // Toggle individual row in multiple selection
            const currentSelected = Array.from(tbody.querySelectorAll('tr.selected')).map((r) => Number(r.dataset.rowIndex));
            if (currentSelected.includes(rowIndex)) {
              nextSelected = currentSelected.filter((idx) => idx !== rowIndex);
            } else {
              nextSelected = [...currentSelected, rowIndex];
            }
          } else if (isShift) {
            // Range select
            const currentSelected = Array.from(tbody.querySelectorAll('tr.selected')).map((r) => Number(r.dataset.rowIndex));
            const lastIndex = currentSelected.length > 0 ? currentSelected[currentSelected.length - 1] : rowIndex;
            const start = Math.min(lastIndex, rowIndex);
            const end = Math.max(lastIndex, rowIndex);
            const range = [];
            for (let i = start; i <= end; i++) range.push(i);
            nextSelected = Array.from(new Set([...currentSelected, ...range]));
          } else {
            // Normal single click (select just this row)
            nextSelected = [rowIndex];
          }

          tbody.querySelectorAll('tr').forEach((r, idx) => {
            const rowIdx = Number(r.dataset.rowIndex !== undefined ? r.dataset.rowIndex : idx);
            if (nextSelected.includes(rowIdx)) {
              r.classList.remove('wise-dt-row-alt');
              r.classList.add('selected', 'wise-dt-row-selected');
              r.style.setProperty('background-color', '#bfdbfe', 'important');
              r.querySelectorAll('td').forEach((td) => {
                td.style.setProperty('background-color', 'transparent', 'important');
              });
            } else {
              r.classList.remove('selected', 'wise-dt-row-selected');
              r.style.removeProperty('background-color');
              if (rowIdx % 2 === 1) {
                r.classList.add('wise-dt-row-alt');
              } else {
                r.classList.remove('wise-dt-row-alt');
              }
            }
          });

          context.desktop.sendControlEvent(context.appId, data.id, table, 'rowselect', {
            [data.id]: { rowIndex, selectedRowIndices: nextSelected },
          });
        };

        tr.addEventListener('click', selectRow);

        if ((data.contextMenuItems || []).length > 0) {
          tr.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            selectRow(e);
            WiseDataTable.showContextMenu(data, context, rowIndex, e.clientX, e.clientY);
          });
        }

        (data.columns || []).forEach((col) => {
          const td = WiseDataTable.renderCell(data, context, col, row, rowIndex);
          if (col.type !== 'button' && col.type !== 'checkbox' && col.type !== 'combobox' && col.type !== 'radiobutton') {
            td.style.cursor = 'pointer';
          }
          if (isSelected) {
            td.style.setProperty('background-color', 'transparent', 'important');
          }
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      scrollDiv.appendChild(table);
      box.appendChild(scrollDiv);
      return box;
    }

    // Appended to document.body (not the table) with fixed positioning --
    // same reasoning as the topbar Windows menu in WiseDesktop.js: the
    // table's own ancestors have no stacking context issue here, but a
    // menu anchored at the cursor still needs to escape any overflow:auto
    // clipping from .wise-datatable-scroll, which a descendant popup would
    // otherwise be cut off by.
    static showContextMenu(data, context, rowIndex, x, y) {
      document.querySelectorAll('.wise-dt-context-menu').forEach((el) => el.remove());

      const menu = document.createElement('div');
      menu.className = 'wise-dt-context-menu';

      // Same icon format WiseIconMenu accepts (emoji/glyph, inline "<svg...",
      // or an image URL) so callers can reuse the same icon values/files.
      const buildMenuIcon = (iconSrc) => {
        const src = (iconSrc || '').trim();
        if (!src) return null;
        const wrapper = document.createElement('span');
        wrapper.className = 'wise-dt-context-menu-icon';
        if (src.startsWith('<svg')) {
          wrapper.innerHTML = src;
        } else if (/^(https?:\/\/|\/|\.\/|data:image\/)/i.test(src) || /\.(png|jpe?g|svg|webp|gif|ico)$/i.test(src)) {
          const img = document.createElement('img');
          img.src = src;
          img.alt = '';
          wrapper.appendChild(img);
        } else {
          wrapper.textContent = src;
        }
        return wrapper;
      };

      (data.contextMenuItems || []).forEach((item) => {
        const entry = document.createElement('div');
        entry.className = 'wise-dt-context-menu-item';

        const icon = buildMenuIcon(item.icon);
        if (icon) entry.appendChild(icon);

        const labelEl = document.createElement('span');
        labelEl.className = 'wise-dt-context-menu-label';
        labelEl.textContent = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(item.label) : item.label;
        entry.appendChild(labelEl);

        entry.addEventListener('click', (event) => {
          event.stopPropagation();
          // sendControlEvent resolves the window via sourceEl.closest('.window').
          // menu itself lives in document.body (see the comment above), so it
          // can't be sourceEl -- and a table/row element captured back when
          // the menu opened can't either: right-clicking a row also selects
          // it, whose own round trip rebuilds the whole table (patchElement),
          // detaching that captured element before the user finishes reading
          // the menu. Re-querying the window fresh at click time by its
          // stable windowId sidesteps both.
          const winEl = document.querySelector(`.window[data-window-id="${context.windowId}"]`);
          context.desktop.sendControlEvent(context.appId, data.id, winEl, 'contextmenuaction', {
            [data.id]: { rowIndex, itemId: item.id },
          });
          closeMenu();
        });
        menu.appendChild(entry);
      });

      const closeMenu = () => {
        menu.remove();
        document.removeEventListener('mousedown', onOutsideClick, true);
        document.removeEventListener('keydown', onKeydown);
      };
      const onOutsideClick = (event) => {
        if (!menu.contains(event.target)) closeMenu();
      };
      const onKeydown = (event) => {
        if (event.key === 'Escape') closeMenu();
      };

      document.body.appendChild(menu);

      // Clamp so the menu doesn't spill past the right/bottom viewport edge
      // when the right-click happens near it.
      const rect = menu.getBoundingClientRect();
      const clampedX = Math.min(x, window.innerWidth - rect.width - 8);
      const clampedY = Math.min(y, window.innerHeight - rect.height - 8);
      menu.style.left = `${Math.max(8, Math.round(clampedX))}px`;
      menu.style.top = `${Math.max(8, Math.round(clampedY))}px`;

      // Deferred to the next tick: the contextmenu event that triggered this
      // is itself a "press" the capturing mousedown listener would otherwise
      // see and immediately treat as an outside click, closing the menu the
      // instant it opens.
      setTimeout(() => document.addEventListener('mousedown', onOutsideClick, true), 0);
      document.addEventListener('keydown', onKeydown);
    }

    static renderCell(data, context, col, row, rowIndex) {
      const td = document.createElement('td');
      td.className = 'wise-dt-td border-b border-slate-900/5 px-3 py-2.5';
      if (col.width) {
        const w = typeof col.width === 'number' ? `${col.width}px` : col.width;
        td.style.width = w;
        td.style.minWidth = w;
      }
      const dataField = col.dataField || col.key || col.field || col.name;
      const cellValue = row[dataField];

      const fireCellChange = (newValue) => {
        context.desktop.sendControlEvent(context.appId, data.id, td, 'cellchange', {
          [data.id]: { rowIndex, dataField, newValue },
        });
      };

      if (col.type === 'button') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.cellInteractive = 'true';
        btn.textContent = col.label || col.header || 'Action';
        btn.className = 'appearance-none rounded-sm border-0 bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white cursor-pointer';
        btn.addEventListener('click', (event) => {
          event.stopPropagation();
          context.desktop.sendControlEvent(context.appId, data.id, td, 'cellclick', {
            [data.id]: { rowIndex, dataField },
          });
        });
        td.appendChild(btn);
      } else if (col.type === 'checkbox') {
        const input = document.createElement('input');
        input.type = 'checkbox';
        // Without an explicit size/shape, appearance:none renders at the
        // browser's tiny intrinsic default -- easy to mistake for a plain
        // dot rather than a checkbox. Match the size WiseCheckboxGroup uses.
        input.className = 'h-[18px] w-[18px] rounded-sm cursor-pointer';
        input.dataset.cellInteractive = 'true';
        input.checked = !!cellValue;
        input.addEventListener('click', (event) => event.stopPropagation());
        input.addEventListener('change', () => fireCellChange(input.checked));
        td.appendChild(input);
      } else if (col.type === 'combobox') {
        const select = document.createElement('select');
        select.dataset.cellInteractive = 'true';
        select.className = 'rounded-sm border border-slate-300 px-1.5 py-1 text-xs';
        (col.items || []).forEach((item) => {
          const option = document.createElement('option');
          const optValue = typeof item === 'object' ? item.value : item;
          const optLabel = typeof item === 'object' ? item.label : item;
          option.value = optValue;
          option.textContent = optLabel;
          if (optValue === cellValue) option.selected = true;
          select.appendChild(option);
        });
        select.addEventListener('click', (event) => event.stopPropagation());
        select.addEventListener('change', () => fireCellChange(select.value));
        td.appendChild(select);
      } else if (col.type === 'radiobutton') {
        (col.items || []).forEach((item) => {
          const optValue = typeof item === 'object' ? item.value : item;
          const optLabel = typeof item === 'object' ? item.label : item;

          const label = document.createElement('label');
          label.className = 'mr-2 inline-flex items-center gap-1 text-xs';

          const input = document.createElement('input');
          input.type = 'radio';
          input.className = 'h-[16px] w-[16px] cursor-pointer';
          // Scoped per window instance too -- see WiseRadioGroup for why.
          const namePrefix = context.windowId ? `${context.windowId}-` : '';
          input.name = `${namePrefix}${data.id}-${rowIndex}-${dataField}`;
          input.dataset.cellInteractive = 'true';
          input.checked = optValue === cellValue;
          input.addEventListener('click', (event) => event.stopPropagation());
          input.addEventListener('change', () => fireCellChange(optValue));

          label.appendChild(input);
          label.appendChild(document.createTextNode(optLabel));
          td.appendChild(label);
        });
      } else if (col.type === 'image') {
        // Read-only thumbnail, like 'text' -- there's no natural "edit" for
        // an image cell in a grid, so this just displays whatever URL is in
        // the cell (e.g. an avatar uploaded elsewhere via WiseFileUpload),
        // with a neutral placeholder when there isn't one.
        if (cellValue) {
          const img = document.createElement('img');
          img.src = cellValue;
          img.alt = '';
          img.className = 'h-9 w-9 rounded-sm object-cover bg-slate-100';
          td.appendChild(img);
        } else {
          const placeholder = document.createElement('div');
          placeholder.className = 'flex h-9 w-9 items-center justify-center rounded-sm bg-slate-100 text-slate-400';
          placeholder.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>';
          td.appendChild(placeholder);
        }
      } else {
        if (typeof cellValue === 'string' && cellValue.trim().startsWith('<')) {
          td.innerHTML = cellValue;
        } else {
          td.textContent = cellValue === undefined || cellValue === null ? '' : String(cellValue);
        }
      }

      return td;
    }

    static renderPager(data, fireFilterChange, position = 'bottom') {
      const pager = document.createElement('div');
      pager.className = `wise-dt-pager flex flex-wrap items-center justify-between gap-3 px-1 py-1 text-xs ${position === 'top' ? 'wise-dt-pager-top' : 'wise-dt-pager-bottom'}`;

      const totalCount = data.totalCount || 0;
      const pageSize = data.pageSize || 10;
      const currentPage = data.currentPage || 1;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

      const info = document.createElement('span');
      info.className = 'wise-dt-pager-info inline-flex items-center gap-1 font-medium text-slate-500';
      const countStrong = document.createElement('strong');
      countStrong.className = 'font-semibold text-slate-700';
      countStrong.textContent = String(totalCount);
      const rowsLabel = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t('BARIS') : 'baris';
      info.appendChild(countStrong);
      info.appendChild(document.createTextNode(` ${rowsLabel}`));
      pager.appendChild(info);

      const controls = document.createElement('div');
      controls.className = 'flex items-center gap-1.5';

      if ((data.pageSizeOptions || []).length > 0) {
        const sizeSelect = document.createElement('select');
        sizeSelect.className = 'wise-dt-page-size mr-1 cursor-pointer rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-none outline-none transition hover:border-[var(--accent)]';
        const pageLabel = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t('HALAMAN') : 'halaman';
        data.pageSizeOptions.forEach((size) => {
          const option = document.createElement('option');
          option.value = size;
          option.textContent = `${size} / ${pageLabel}`;
          if (size === pageSize) option.selected = true;
          sizeSelect.appendChild(option);
        });
        sizeSelect.addEventListener('change', () => {
          fireFilterChange({ pageSize: Number(sizeSelect.value), currentPage: 1 });
        });
        controls.appendChild(sizeSelect);
      }

      const chevron = (direction) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2.5');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.classList.add('h-3.5', 'w-3.5');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', direction === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6');
        svg.appendChild(path);
        return svg;
      };

      // Pill nav buttons: current page is a solid accent pill, others are
      // ghost buttons that lift slightly on hover (matches WiseIconMenu's
      // hover affordance elsewhere in the desktop).
      const navButton = (content, { disabled = false, active = false, onClick, ariaLabel } = {}) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.disabled = disabled;
        if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
        if (typeof content === 'string') {
          btn.textContent = content;
        } else {
          btn.appendChild(content);
        }
        const state = active
          ? 'bg-[var(--accent)] text-white font-semibold shadow-sm'
          : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 hover:-translate-y-px';
        btn.className = `wise-dt-nav-btn inline-flex h-7 min-w-[28px] cursor-pointer items-center justify-center rounded-full border-0 px-2 text-xs transition-all duration-150 ease-out active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:translate-y-0 ${state}`;
        if (!disabled && onClick) btn.addEventListener('click', onClick);
        return btn;
      };

      const prevLabel = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t('HALAMAN_SEBELUMNYA') : 'Halaman sebelumnya';
      controls.appendChild(navButton(chevron('prev'), {
        disabled: currentPage <= 1,
        ariaLabel: prevLabel,
        onClick: () => fireFilterChange({ currentPage: currentPage - 1 }),
      }));

      WiseDataTable.buildPageList(currentPage, totalPages).forEach((page) => {
        if (page === '…') {
          const ellipsis = document.createElement('span');
          ellipsis.className = 'inline-flex h-7 min-w-[20px] items-center justify-center text-slate-300';
          ellipsis.textContent = '…';
          controls.appendChild(ellipsis);
          return;
        }
        controls.appendChild(navButton(String(page), {
          active: page === currentPage,
          onClick: () => fireFilterChange({ currentPage: page }),
        }));
      });

      const nextLabel = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t('HALAMAN_BERIKUTNYA') : 'Halaman berikutnya';
      controls.appendChild(navButton(chevron('next'), {
        disabled: currentPage >= totalPages,
        ariaLabel: nextLabel,
        onClick: () => fireFilterChange({ currentPage: currentPage + 1 }),
      }));

      pager.appendChild(controls);
      return pager;
    }

    // Windows the page-number list around the current page (with leading/
    // trailing ellipses once there are more pages than fit) instead of
    // rendering every single page button when there are many pages.
    static buildPageList(current, total) {
      const pages = [];
      const addRange = (start, end) => {
        for (let page = start; page <= end; page += 1) pages.push(page);
      };

      if (total <= 7) {
        addRange(1, total);
      } else if (current <= 4) {
        addRange(1, 5);
        pages.push('…', total);
      } else if (current >= total - 3) {
        pages.push(1, '…');
        addRange(total - 4, total);
      } else {
        pages.push(1, '…');
        addRange(current - 1, current + 1);
        pages.push('…', total);
      }

      return pages;
    }

    // The DOM shape depends on row count/sort/pager state, which changes on
    // every interaction -- rather than diffing cell-by-cell, just rebuild
    // this control's whole subtree in place from the fresh data.
    // Filter input values are snapshotted from the existing DOM first and
    // restored into the rebuilt filter bar, so typing in a filter doesn't
    // lose focus/value on every keystroke's round-trip.
    static patchElement(winEl, data, context) {
      const existing = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (!existing || !context) return;

      // Preserve scroll position
      const existingScroll = existing.querySelector('.wise-datatable-scroll');
      const scrollTop = existingScroll ? existingScroll.scrollTop : 0;

      // Snapshot current filter values from the live DOM so they survive
      // the full rebuild, UNLESS the server explicitly requested filter reset
      // (e.g. via clearFilterValues() on Display All).
      if (!data.filterValuesCleared) {
        const filterSnapshot = {};
        (data.filterControls || []).forEach((f) => {
          const el = existing.querySelector(`#${data.id}-filter-${f.id}`);
          if (el) filterSnapshot[f.id] = el.value;
        });

        // Merge live values into the descriptor array before rendering
        if (data.filterControls) {
          data.filterControls = data.filterControls.map((f) =>
            filterSnapshot[f.id] !== undefined ? { ...f, value: filterSnapshot[f.id] } : f
          );
        }
      }

      const fresh = WiseDataTable.renderElement(data, context);
      existing.replaceWith(fresh);

      if (scrollTop) {
        const freshScroll = fresh.querySelector('.wise-datatable-scroll');
        if (freshScroll) freshScroll.scrollTop = scrollTop;
      }
    }

    static gatherValue(winEl, id) {
      const dtWrapper = winEl.querySelector(`[data-control-id="${id}"]`);
      if (!dtWrapper) return undefined;
      const selectedTrs = Array.from(dtWrapper.querySelectorAll('tbody tr.selected'));
      if (selectedTrs.length === 0) return undefined;
      const selectedIndices = selectedTrs.map((tr) => Number(tr.dataset.rowIndex)).filter((idx) => !isNaN(idx));
      if (selectedIndices.length === 0) return undefined;
      return {
        rowIndex: selectedIndices[0],
        selectedRowIndices: selectedIndices,
      };
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseDataTable = WiseDataTable;
  } else {
    module.exports = WiseDataTable;
  }
})();
