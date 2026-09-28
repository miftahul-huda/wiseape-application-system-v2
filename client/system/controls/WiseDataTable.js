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
      this.selectedRowIndex = null;
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
        this.selectedRowIndex = payload.rowIndex;
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
    // Resetting selectedRowIndex ensures the highlight clears on page navigation.
    setData(rows, totalCount) {
      this.data = rows || [];
      this.totalCount = totalCount || 0;
      this.selectedRowIndex = null;
      return this;
    }

    getData() {
      return this.data;
    }

    getSelectedRowIndex() {
      return this.selectedRowIndex !== undefined && this.selectedRowIndex !== null ? Number(this.selectedRowIndex) : null;
    }

    setSelectedRowIndex(index) {
      this.selectedRowIndex = index !== null && index !== undefined ? Number(index) : null;
      return this;
    }

    getSelectedRow() {
      if (this.selectedRowIndex !== null && this.selectedRowIndex !== undefined && this.data && this.data[this.selectedRowIndex]) {
        return this.data[this.selectedRowIndex];
      }
      return null;
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        columns: this.columns,
        data: this.data,
        totalCount: this.totalCount,
        selectedRowIndex: this.selectedRowIndex !== undefined && this.selectedRowIndex !== null ? Number(this.selectedRowIndex) : null,
        pageSize: this.pageSize,
        currentPage: this.currentPage,
        pageSizeOptions: this.pageSizeOptions,
        sortField: this.sortField,
        sortDirection: this.sortDirection,
        height: this.height,
        maxHeight: this.maxHeight,
        scrollable: this.scrollable,
        hasRowSelectHandler: true,
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
      box.className = 'wise-dt-box overflow-hidden rounded-xl border border-slate-900/10 bg-white shadow-md';

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

        const sortable = col.sortable !== false && !!col.dataField;
        const label = document.createElement('span');
        label.className = 'inline-flex items-center gap-1';
        const labelText = document.createElement('span');
        labelText.textContent = col.header || '';
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

      (data.data || []).forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        tr.dataset.rowIndex = String(rowIndex);
        const isOdd = rowIndex % 2 === 1;

        const isSelected = data.selectedRowIndex !== null && data.selectedRowIndex !== undefined && Number(data.selectedRowIndex) === rowIndex;
        if (isSelected) {
          tr.className = 'selected wise-dt-row-selected wise-dt-row cursor-pointer';
        } else if (isOdd) {
          tr.className = 'wise-dt-row-alt wise-dt-row cursor-pointer';
        } else {
          tr.className = 'wise-dt-row cursor-pointer';
        }

        const selectRow = (e) => {
          if (e && e.target && e.target.closest && e.target.closest('[data-cell-interactive]')) return;

          const tbodyEl = tr.closest('tbody');
          if (tbodyEl) {
            tbodyEl.querySelectorAll('tr').forEach((r, idx) => {
              r.classList.remove('selected', 'wise-dt-row-selected');
              r.style.removeProperty('background-color');
              if (idx % 2 === 1) {
                r.classList.add('wise-dt-row-alt');
              } else {
                r.classList.remove('wise-dt-row-alt');
              }
            });
          }

          tr.classList.remove('wise-dt-row-alt');
          tr.classList.add('selected', 'wise-dt-row-selected');
          tr.style.setProperty('background-color', '#bfdbfe', 'important');
          tr.querySelectorAll('td').forEach((td) => {
            td.style.setProperty('background-color', 'transparent', 'important');
          });

          context.desktop.sendControlEvent(context.appId, data.id, table, 'rowselect', {
            [data.id]: { rowIndex },
          });
        };

        tr.addEventListener('click', selectRow);

        (data.columns || []).forEach((col) => {
          const td = WiseDataTable.renderCell(data, context, col, row, rowIndex);
          if (col.type !== 'button' && col.type !== 'checkbox' && col.type !== 'combobox' && col.type !== 'radiobutton') {
            td.style.cursor = 'pointer';
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

    static renderCell(data, context, col, row, rowIndex) {
      const td = document.createElement('td');
      td.className = 'wise-dt-td border-b border-slate-900/5 px-3 py-2.5';
      if (col.width) {
        const w = typeof col.width === 'number' ? `${col.width}px` : col.width;
        td.style.width = w;
        td.style.minWidth = w;
      }
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
      info.appendChild(countStrong);
      info.appendChild(document.createTextNode(totalCount === 1 ? ' baris' : ' baris'));
      pager.appendChild(info);

      const controls = document.createElement('div');
      controls.className = 'flex items-center gap-1.5';

      if ((data.pageSizeOptions || []).length > 0) {
        const sizeSelect = document.createElement('select');
        sizeSelect.className = 'wise-dt-page-size mr-1 cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 outline-none transition hover:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40';
        data.pageSizeOptions.forEach((size) => {
          const option = document.createElement('option');
          option.value = size;
          option.textContent = `${size} / halaman`;
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

      controls.appendChild(navButton(chevron('prev'), {
        disabled: currentPage <= 1,
        ariaLabel: 'Halaman sebelumnya',
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

      controls.appendChild(navButton(chevron('next'), {
        disabled: currentPage >= totalPages,
        ariaLabel: 'Halaman berikutnya',
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

      // A full rebuild otherwise resets the row viewport to the top on
      // every interaction (e.g. selecting a row scrolled out of view),
      // since the fresh .wise-datatable-scroll div starts at scrollTop 0.
      const existingScroll = existing.querySelector('.wise-datatable-scroll');
      const scrollTop = existingScroll ? existingScroll.scrollTop : 0;

      const fresh = WiseDataTable.renderElement(data, context);
      existing.replaceWith(fresh);

      if (scrollTop) {
        const freshScroll = fresh.querySelector('.wise-datatable-scroll');
        if (freshScroll) freshScroll.scrollTop = scrollTop;
      }
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
