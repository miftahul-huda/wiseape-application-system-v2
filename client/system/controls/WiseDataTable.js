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
      this.onDataFilterChanged = typeof options.onDataFilterChanged === 'function' ? options.onDataFilterChanged : null;
      this.onRowSelect = typeof options.onRowSelect === 'function' ? options.onRowSelect : null;
      this.onClick = typeof options.onClick === 'function' ? options.onClick : null;
      this.onHover = typeof options.onHover === 'function' ? options.onHover : null;
      this.style = options.style || {};

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
        const row = this.data[payload.rowIndex];
        if (row && this.onRowSelect) {
          return this.onRowSelect(row);
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
    }

    setColumns(columns) {
      this.columns = columns || [];
      return this;
    }

    // Exactly one page of data at a time -- this control never holds (or
    // expects) the whole dataset. See docs/DEVELOPMENT_GUIDE.md §5.
    setData(rows, totalCount) {
      this.data = rows || [];
      this.totalCount = totalCount || 0;
      return this;
    }

    getData() {
      return this.data;
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        columns: this.columns,
        data: this.data,
        totalCount: this.totalCount,
        pageSize: this.pageSize,
        currentPage: this.currentPage,
        pageSizeOptions: this.pageSizeOptions,
        sortField: this.sortField,
        sortDirection: this.sortDirection,
        hasRowSelectHandler: !!this.onRowSelect,
        hasClickHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        style: this.style,
        visible: this.visible,
        disabled: this.disabled,
      };
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

      // Pagination at both ends -- convenient on a long table where the
      // bottom pager would otherwise be a scroll away. Both instances are
      // wired to the same fireFilterChange, and a full re-render on every
      // interaction (see patchElement) keeps them in sync automatically.
      wrapper.appendChild(WiseDataTable.renderPager(data, fireFilterChange, 'top'));
      wrapper.appendChild(WiseDataTable.renderTable(data, context, fireFilterChange));
      wrapper.appendChild(WiseDataTable.renderPager(data, fireFilterChange, 'bottom'));

      return wrapper;
    }

    static renderTable(data, context, fireFilterChange) {
      const box = document.createElement('div');
      box.className = 'overflow-hidden rounded-lg border border-slate-900/10 bg-white shadow-sm';

      const table = document.createElement('table');
      table.className = 'w-full border-collapse text-sm';

      const thead = document.createElement('thead');
      thead.className = 'bg-[var(--accent-dark)]';
      const headRow = document.createElement('tr');

      (data.columns || []).forEach((col) => {
        const th = document.createElement('th');
        th.className = 'border-b border-black/15 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white/90';
        if (col.width) th.style.width = `${col.width}px`;

        let headerText = col.header || '';
        const sortable = col.sortable !== false && !!col.dataField;
        if (sortable) {
          if (data.sortField === col.dataField) {
            headerText += data.sortDirection === 'desc' ? ' ▼' : ' ▲';
          }
          th.classList.add('cursor-pointer', 'select-none');
          th.addEventListener('click', () => {
            const nextDirection = data.sortField === col.dataField && data.sortDirection === 'asc' ? 'desc' : 'asc';
            fireFilterChange({ sortField: col.dataField, sortDirection: nextDirection, currentPage: 1 });
          });
        }
        th.textContent = headerText;
        headRow.appendChild(th);
      });

      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');

      (data.data || []).forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        // bg-slate-50 is nearly indistinguishable from white -- bump to
        // slate-100 so the stripe is actually visible.
        const zebra = rowIndex % 2 === 1 ? 'bg-slate-100' : 'bg-white';

        if (data.hasRowSelectHandler) {
          tr.className = `${zebra} cursor-pointer hover:bg-slate-900/5`;
          tr.addEventListener('click', (event) => {
            if (event.target.closest('[data-cell-interactive]')) return;
            context.desktop.sendControlEvent(context.appId, data.id, table, 'rowselect', {
              [data.id]: { rowIndex },
            });
          });
        } else {
          tr.className = zebra;
        }

        (data.columns || []).forEach((col) => {
          tr.appendChild(WiseDataTable.renderCell(data, context, col, row, rowIndex));
        });

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      box.appendChild(table);
      return box;
    }

    static renderCell(data, context, col, row, rowIndex) {
      const td = document.createElement('td');
      td.className = 'border-b border-slate-900/5 px-2 py-2';
      const cellValue = row[col.dataField];

      const fireCellChange = (newValue) => {
        context.desktop.sendControlEvent(context.appId, data.id, td, 'cellchange', {
          [data.id]: { rowIndex, dataField: col.dataField, newValue },
        });
      };

      if (col.type === 'button') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.cellInteractive = 'true';
        btn.textContent = col.label || 'Action';
        btn.className = 'appearance-none rounded-md border-0 bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white cursor-pointer';
        btn.addEventListener('click', (event) => {
          event.stopPropagation();
          context.desktop.sendControlEvent(context.appId, data.id, td, 'cellclick', {
            [data.id]: { rowIndex, dataField: col.dataField },
          });
        });
        td.appendChild(btn);
      } else if (col.type === 'checkbox') {
        const input = document.createElement('input');
        input.type = 'checkbox';
        // Without an explicit size/shape, appearance:none renders at the
        // browser's tiny intrinsic default -- easy to mistake for a plain
        // dot rather than a checkbox. Match the size WiseCheckboxGroup uses.
        input.className = 'h-[18px] w-[18px] rounded cursor-pointer';
        input.dataset.cellInteractive = 'true';
        input.checked = !!cellValue;
        input.addEventListener('click', (event) => event.stopPropagation());
        input.addEventListener('change', () => fireCellChange(input.checked));
        td.appendChild(input);
      } else if (col.type === 'combobox') {
        const select = document.createElement('select');
        select.dataset.cellInteractive = 'true';
        select.className = 'rounded border border-slate-300 px-1.5 py-1 text-xs';
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
          input.name = `${namePrefix}${data.id}-${rowIndex}-${col.dataField}`;
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
          img.className = 'h-9 w-9 rounded-md object-cover bg-slate-100';
          td.appendChild(img);
        } else {
          const placeholder = document.createElement('div');
          placeholder.className = 'flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-400';
          placeholder.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>';
          td.appendChild(placeholder);
        }
      } else {
        td.textContent = cellValue === undefined || cellValue === null ? '' : String(cellValue);
      }

      return td;
    }

    static renderPager(data, fireFilterChange, position = 'bottom') {
      const pager = document.createElement('div');
      const spacing = position === 'top' ? 'pb-2' : 'pt-2';
      pager.className = `flex items-center justify-between gap-3 px-1 ${spacing} text-xs`;

      const totalCount = data.totalCount || 0;
      const pageSize = data.pageSize || 10;
      const currentPage = data.currentPage || 1;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

      const info = document.createElement('span');
      info.className = 'text-slate-400';
      info.textContent = `${totalCount} rows`;
      pager.appendChild(info);

      const controls = document.createElement('div');
      controls.className = 'flex items-center gap-1';

      if ((data.pageSizeOptions || []).length > 0) {
        const sizeSelect = document.createElement('select');
        sizeSelect.className = 'mr-2 cursor-pointer rounded-md border-0 bg-slate-100 px-2 py-1.5 text-xs text-slate-600 outline-none transition focus:ring-2 focus:ring-[var(--accent)]';
        data.pageSizeOptions.forEach((size) => {
          const option = document.createElement('option');
          option.value = size;
          option.textContent = `${size} / page`;
          if (size === pageSize) option.selected = true;
          sizeSelect.appendChild(option);
        });
        sizeSelect.addEventListener('change', () => {
          fireFilterChange({ pageSize: Number(sizeSelect.value), currentPage: 1 });
        });
        controls.appendChild(sizeSelect);
      }

      // Flat nav "buttons" -- no borders/shadows, just a background that
      // appears on hover or for whichever page is current.
      const navButton = (label, { disabled = false, active = false, onClick } = {}) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.disabled = disabled;
        const state = active
          ? 'bg-[var(--accent)] text-white font-semibold'
          : 'bg-transparent text-slate-600 hover:bg-slate-100';
        btn.className = `min-w-[26px] cursor-pointer rounded-md border-0 px-2 py-1.5 text-xs transition disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent ${state}`;
        if (!disabled && onClick) btn.addEventListener('click', onClick);
        return btn;
      };

      controls.appendChild(navButton('‹', {
        disabled: currentPage <= 1,
        onClick: () => fireFilterChange({ currentPage: currentPage - 1 }),
      }));

      WiseDataTable.buildPageList(currentPage, totalPages).forEach((page) => {
        if (page === '…') {
          const ellipsis = document.createElement('span');
          ellipsis.className = 'px-1 text-slate-400';
          ellipsis.textContent = '…';
          controls.appendChild(ellipsis);
          return;
        }
        controls.appendChild(navButton(String(page), {
          active: page === currentPage,
          onClick: () => fireFilterChange({ currentPage: page }),
        }));
      });

      controls.appendChild(navButton('›', {
        disabled: currentPage >= totalPages,
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
    static patchElement(winEl, data, context) {
      const existing = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (!existing || !context) return;
      existing.replaceWith(WiseDataTable.renderElement(data, context));
    }

    // Every interaction sends its payload explicitly via overrideValues
    // (see the fire* helpers above); there's nothing meaningful to read
    // passively off this control's own DOM.
    static gatherValue() {
      return undefined;
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseDataTable = WiseDataTable;
  } else {
    module.exports = WiseDataTable;
  }
})();
