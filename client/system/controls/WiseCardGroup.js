(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  // Same paged, server-round-trip-driven architecture as WiseDataTable (see
  // that control for the fuller rationale) -- one control id, a different
  // eventName per interaction, a full re-render on every patch -- except
  // each row renders as a card (image + title + text) in a responsive grid
  // instead of a table row. Which row field feeds which part of the card is
  // configurable via titleField/imageField/textField, the card-group
  // equivalent of a WiseDataTable column's dataField.
  class WiseCardGroup extends WiseControl {
    constructor(options = {}) {
      super(null, options);
      this.name = 'WiseCardGroup';
      this.titleField = options.titleField || 'title';
      this.imageField = options.imageField || 'image';
      this.textField = options.textField || 'text';
      this.data = [];
      this.totalCount = 0;
      this.pageSize = options.pageSize || 10;
      this.currentPage = options.currentPage || 1;
      this.pageSizeOptions = options.pageSizeOptions || [];
      this.onDataFilterChanged = typeof options.onDataFilterChanged === 'function' ? options.onDataFilterChanged : null;
      this.onRowSelect = typeof options.onRowSelect === 'function' ? options.onRowSelect : null;
      this.onClick = typeof options.onClick === 'function' ? options.onClick : null;
      this.onHover = typeof options.onHover === 'function' ? options.onHover : null;
      this.style = options.style || {};

      // Arrow functions (not prototype methods) so `this` stays the control
      // instance even though dispatchControlEvent invokes them via
      // `handler.call(win)` -- same trick WiseDataTable's own internal
      // on<Event> handlers use.
      this.onFilterchange = () => {
        const payload = this.value || {};
        if (payload.pageSize !== undefined) this.pageSize = payload.pageSize;
        if (payload.currentPage !== undefined) this.currentPage = payload.currentPage;
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
    }

    // Exactly one page of data at a time -- this control never holds (or
    // expects) the whole dataset. Same contract as WiseDataTable.setData.
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
        titleField: this.titleField,
        imageField: this.imageField,
        textField: this.textField,
        data: this.data,
        totalCount: this.totalCount,
        pageSize: this.pageSize,
        currentPage: this.currentPage,
        pageSizeOptions: this.pageSizeOptions,
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
            ...patch,
          },
        });
      };

      // Pagination at both ends, same reasoning as WiseDataTable -- a long
      // card grid would otherwise leave the bottom pager a scroll away.
      wrapper.appendChild(WiseCardGroup.renderPager(data, fireFilterChange, 'top'));
      wrapper.appendChild(WiseCardGroup.renderGrid(data, context));
      wrapper.appendChild(WiseCardGroup.renderPager(data, fireFilterChange, 'bottom'));

      return wrapper;
    }

    static renderGrid(data, context) {
      const grid = document.createElement('div');
      grid.className = 'grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]';

      (data.data || []).forEach((row, rowIndex) => {
        const card = document.createElement('div');
        // relative + hover:z-10 keeps the enlarged card drawn above its
        // grid neighbors instead of being visually clipped by them --
        // z-index alone is enough here since grid items respect it without
        // needing position: relative for stacking, but it's set explicitly
        // for clarity.
        card.className = 'relative flex flex-col overflow-hidden rounded-lg border border-slate-900/10 bg-white shadow-sm transition hover:z-10 hover:scale-105 hover:shadow-lg';

        if (data.hasRowSelectHandler) {
          card.classList.add('cursor-pointer');
          card.addEventListener('click', () => {
            context.desktop.sendControlEvent(context.appId, data.id, card, 'rowselect', {
              [data.id]: { rowIndex },
            });
          });
        }

        const imageBox = document.createElement('div');
        imageBox.className = 'flex h-28 w-full items-center justify-center bg-slate-100 text-slate-400';

        const imageUrl = row[data.imageField];
        if (imageUrl) {
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = '';
          img.className = 'h-full w-full object-cover';
          imageBox.appendChild(img);
        } else {
          // Same neutral placeholder WiseDataTable's own 'image' column
          // type uses when a cell has no image -- keeps every card the
          // same height whether or not it has a real picture.
          imageBox.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>';
        }

        const body = document.createElement('div');
        body.className = 'flex flex-col gap-1 p-3';

        const title = document.createElement('div');
        title.className = 'text-sm font-semibold text-slate-800';
        title.textContent = row[data.titleField] ?? '';

        const text = document.createElement('div');
        text.className = 'whitespace-pre-wrap text-xs text-slate-500';
        text.textContent = row[data.textField] ?? '';

        body.appendChild(title);
        body.appendChild(text);

        card.appendChild(imageBox);
        card.appendChild(body);
        grid.appendChild(card);
      });

      if ((data.data || []).length === 0) {
        const empty = document.createElement('div');
        empty.className = 'py-6 text-center text-sm text-slate-400';
        empty.textContent = 'No items';
        grid.appendChild(empty);
      }

      return grid;
    }

    // Identical shape to WiseDataTable.renderPager, minus sorting (a card
    // group has no columns to sort by).
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
      info.textContent = `${totalCount} items`;
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

      WiseCardGroup.buildPageList(currentPage, totalPages).forEach((page) => {
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

    // The DOM shape depends on row count/pager state, which changes on
    // every interaction -- rather than diffing card-by-card, just rebuild
    // this control's whole subtree in place from the fresh data, same as
    // WiseDataTable.
    static patchElement(winEl, data, context) {
      const existing = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (!existing || !context) return;
      existing.replaceWith(WiseCardGroup.renderElement(data, context));
    }

    // Every interaction sends its payload explicitly via overrideValues
    // (see fireFilterChange/the rowselect listener above); there's nothing
    // meaningful to read passively off this control's DOM.
    static gatherValue() {
      return undefined;
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseCardGroup = WiseCardGroup;
  } else {
    module.exports = WiseCardGroup;
  }
})();
