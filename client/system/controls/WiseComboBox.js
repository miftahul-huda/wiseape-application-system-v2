(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  class WiseComboBox extends WiseControl {
    constructor(items = [], options = {}) {
      let resolvedItems = items;
      let opts = options || {};
      let initialValOverride = undefined;

      if (!Array.isArray(items)) {
        if (opts && Array.isArray(opts.items)) {
          resolvedItems = opts.items;
          initialValOverride = items;
        } else if (typeof items === 'object' && items !== null && Array.isArray(items.items)) {
          resolvedItems = items.items;
          opts = items;
        } else {
          resolvedItems = [];
          if (items !== undefined && items !== null) {
            initialValOverride = items;
          }
        }
      }

      const normalizedItems = (resolvedItems || []).map((it) => (typeof it === 'object' && it !== null ? { value: it.value !== undefined ? it.value : it.label, label: it.label !== undefined ? it.label : String(it.value) } : { value: it, label: String(it) }));
      
      let initialValue = '';
      if (initialValOverride !== undefined && initialValOverride !== null) {
        initialValue = initialValOverride;
      } else if (opts.value !== undefined && opts.value !== null) {
        initialValue = opts.value;
      } else if (opts.selectedValue !== undefined && opts.selectedValue !== null) {
        initialValue = opts.selectedValue;
      } else if (opts.selectedIndex !== undefined && opts.selectedIndex >= 0 && normalizedItems[opts.selectedIndex]) {
        initialValue = normalizedItems[opts.selectedIndex].value;
      } else if (normalizedItems[0]) {
        initialValue = normalizedItems[0].value;
      }

      super(initialValue, opts);
      this.name = 'WiseComboBox';
      this.items = normalizedItems;
      this.placeholder = opts.placeholder || 'Pilih opsi...';
      this.onClick = typeof opts.onClick === 'function' ? opts.onClick : null;
      this.onHover = typeof opts.onHover === 'function' ? opts.onHover : null;
      this.style = opts.style || {};

      const publicOnChange = typeof opts.onChange === 'function' ? opts.onChange : null;
      this.onItemChanged = typeof opts.onItemChanged === 'function' ? opts.onItemChanged : null;
      this._lastItem = this.items.find((item) => String(item.value) === String(this.value)) || null;
      this.onChange = (publicOnChange || this.onItemChanged) ? () => {
        const previousItem = this._lastItem;
        const currentItem = this.items.find((item) => String(item.value) === String(this.value)) || null;
        this._lastItem = currentItem;
        if (this.onItemChanged) this.onItemChanged(previousItem, currentItem);
        if (publicOnChange) return publicOnChange();
      } : null;
    }

    get selectedIndex() {
      return this.items.findIndex((item) => String(item.value) === String(this.value));
    }

    set selectedIndex(index) {
      const idx = parseInt(index, 10);
      if (!isNaN(idx) && idx >= 0 && this.items[idx]) {
        this.value = this.items[idx].value;
        this._lastItem = this.items[idx];
      }
    }

    get selectedValue() {
      return this.value;
    }

    set selectedValue(val) {
      this.setValue(val);
    }

    get selectedItem() {
      const idx = this.selectedIndex;
      return idx >= 0 ? this.items[idx] : null;
    }

    set selectedItem(item) {
      if (item && item.value !== undefined) {
        this.setValue(item.value);
      }
    }

    setValue(value) {
      this.value = value;
      this._lastItem = this.items.find((item) => String(item.value) === String(value)) || null;
      return this;
    }

    getItems() {
      return this.items;
    }

    setItems(items) {
      this.items = (items || []).map((it) => (typeof it === 'object' && it !== null ? { value: it.value !== undefined ? it.value : it.label, label: it.label !== undefined ? it.label : String(it.value) } : { value: it, label: String(it) }));
      return this;
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        value: this.value,
        selectedIndex: this.selectedIndex,
        items: this.items,
        placeholder: this.placeholder,
        hasHandler: !!this.onChange,
        hasClickHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        style: this.style,
        visible: this.visible,
        disabled: this.disabled,
      };
    }

    static gatherValue(winEl, id) {
      const wrapper = winEl.querySelector(`[data-control-id="${id}"]`);
      if (!wrapper) return undefined;
      const hiddenInput = wrapper.querySelector('.wise-combobox-value') || wrapper.querySelector('input[type="hidden"]');
      if (hiddenInput) return hiddenInput.value;
      if (wrapper.dataset && wrapper.dataset.value !== undefined) return wrapper.dataset.value;
      return wrapper.value;
    }

    static renderElement(data, context) {
      const items = (data.items || []).map((it) => (typeof it === 'object' && it !== null ? it : { value: it, label: String(it) }));
      const currentValue = data.value !== undefined && data.value !== null ? data.value : (items[0] ? items[0].value : '');
      const currentItem = items.find((it) => String(it.value) === String(currentValue)) || items[0] || null;

      const wrapper = document.createElement('div');
      wrapper.className = 'wise-combobox-wrapper relative w-full text-slate-800';
      wrapper.dataset.value = currentValue;
      wrapper.dataset.controlId = data.id || '';
      wrapper.dataset.controlType = 'WiseComboBox';
      // Lets patchElement detect that the server changed the option list
      // (e.g. cascading Department -> Division -> Position) and rebuild.
      wrapper.dataset.itemsSig = JSON.stringify(items.map((it) => [it.value, it.label]));
      Object.defineProperty(wrapper, 'value', {
        get: () => wrapper.dataset.value,
        set: (v) => {
          wrapper.dataset.value = v;
          if (hiddenInput) hiddenInput.value = v;
        },
        configurable: true
      });

      // Hidden input for form gathering
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.className = 'wise-combobox-value';
      hiddenInput.name = data.dataField || data.id || '';
      hiddenInput.value = currentValue;
      wrapper.appendChild(hiddenInput);

      // Trigger button
      const trigger = document.createElement('div');
      trigger.className = 'wise-combobox-trigger w-full cursor-pointer flex items-center justify-between rounded-md border border-slate-300 bg-white py-1.5 pl-3 pr-3 text-sm text-slate-800 shadow-none outline-none transition select-none';
      trigger.setAttribute('tabindex', '0');

      const labelSpan = document.createElement('span');
      labelSpan.className = 'wise-combobox-label truncate select-none text-left flex-1 mr-2';
      const initialText = currentItem ? currentItem.label : (data.placeholder || 'Pilih opsi...');
      labelSpan.textContent = initialText;
      labelSpan.dataset.rawLabel = initialText;
      trigger.appendChild(labelSpan);

      const chevronSpan = document.createElement('span');
      chevronSpan.className = 'wise-combobox-chevron pointer-events-none shrink-0 text-slate-400 transition-transform duration-200';
      chevronSpan.innerHTML = '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>';
      trigger.appendChild(chevronSpan);
      wrapper.appendChild(trigger);

      // Dropdown Panel
      const dropdown = document.createElement('div');
      dropdown.className = 'wise-combobox-dropdown hidden absolute left-0 right-0 z-[100] mt-1 rounded-md border border-slate-300 bg-white shadow-lg flex flex-col overflow-hidden';
      dropdown.style.minWidth = '100%';

      // Search Box
      const searchContainer = document.createElement('div');
      searchContainer.className = 'p-1.5 border-b border-slate-200 bg-slate-50 flex items-center gap-1.5';
      
      const searchIcon = document.createElement('span');
      searchIcon.className = 'text-xs text-slate-400 select-none pl-1';
      searchIcon.innerHTML = '🔍';
      searchContainer.appendChild(searchIcon);

      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.className = 'wise-combobox-search-input';
      searchInput.placeholder = 'Cari / Search...';
      searchContainer.appendChild(searchInput);
      dropdown.appendChild(searchContainer);

      // Options List
      const optionsList = document.createElement('div');
      optionsList.className = 'wise-combobox-options max-h-56 overflow-y-auto py-1 text-sm';
      dropdown.appendChild(optionsList);
      wrapper.appendChild(dropdown);

      function renderOptions(filterText = '') {
        optionsList.innerHTML = '';
        const q = filterText.toLowerCase().trim();
        const activeVal = String(wrapper.dataset.value);

        const filtered = items.filter((it) => {
          if (!q) return true;
          return String(it.label || '').toLowerCase().includes(q) || String(it.value || '').toLowerCase().includes(q);
        });

        if (filtered.length === 0) {
          const emptyDiv = document.createElement('div');
          emptyDiv.className = 'py-3 px-3 text-center text-xs text-slate-400 select-none';
          emptyDiv.textContent = 'Tidak ada hasil / No results';
          optionsList.appendChild(emptyDiv);
          return;
        }

        filtered.forEach((it) => {
          const optEl = document.createElement('div');
          const isSelected = String(it.value) === activeVal;
          optEl.className = `wise-combobox-option px-3 py-1.5 cursor-pointer flex items-center justify-between transition ${
            isSelected
              ? 'bg-[color-mix(in_srgb,var(--accent)_15%,white)] text-[var(--accent-dark)] font-semibold'
              : 'text-slate-700 hover:bg-[color-mix(in_srgb,var(--accent)_10%,white)] hover:text-[var(--accent-dark)]'
          }`;
          optEl.dataset.value = it.value;

          const optLabel = document.createElement('span');
          optLabel.className = 'truncate';
          optLabel.textContent = it.label;
          optEl.appendChild(optLabel);

          if (isSelected) {
            const checkMark = document.createElement('span');
            checkMark.className = 'text-xs text-[var(--accent)] font-bold ml-2 shrink-0';
            checkMark.textContent = '✓';
            optEl.appendChild(checkMark);
          }

          optEl.addEventListener('click', (e) => {
            e.stopPropagation();
            selectOption(it);
          });

          optionsList.appendChild(optEl);
        });
      }

      function selectOption(it) {
        wrapper.dataset.value = it.value;
        hiddenInput.value = it.value;
        labelSpan.textContent = it.label;
        labelSpan.dataset.rawLabel = it.label;
        closeDropdown();
        if (data.hasHandler && context && context.desktop) {
          context.desktop.sendControlEvent(context.appId, data.id, wrapper, 'change', { [data.id]: it.value });
        }
      }

      function openDropdown() {
        if (data.disabled || wrapper.classList.contains('disabled')) return;
        wrapper.classList.add('is-open');
        dropdown.classList.remove('hidden');
        chevronSpan.style.transform = 'rotate(180deg)';
        searchInput.value = '';
        renderOptions('');
        setTimeout(() => {
          searchInput.focus();
          const selectedEl = optionsList.querySelector('.bg-\\[color-mix\\(in_srgb\\,var\\(--accent\\)_15\\%\\,white\\)\\]');
          if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
          }
        }, 15);
      }

      function closeDropdown() {
        wrapper.classList.remove('is-open');
        dropdown.classList.add('hidden');
        chevronSpan.style.transform = '';
      }

      function toggleDropdown() {
        if (dropdown.classList.contains('hidden')) {
          openDropdown();
        } else {
          closeDropdown();
        }
      }

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
      });

      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          openDropdown();
        }
      });

      searchInput.addEventListener('input', () => {
        renderOptions(searchInput.value);
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeDropdown();
          trigger.focus();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const firstOpt = optionsList.querySelector('.wise-combobox-option');
          if (firstOpt) {
            const val = firstOpt.dataset.value;
            const targetItem = items.find((it) => String(it.value) === String(val));
            if (targetItem) selectOption(targetItem);
          }
        }
      });

      // Close when clicking outside
      const onDocClick = (e) => {
        if (!wrapper.contains(e.target)) {
          closeDropdown();
        }
      };
      document.addEventListener('click', onDocClick);

      WiseControl.applyCommon(wrapper, data, context);
      return wrapper;
    }

    static patchElement(winEl, data, context) {
      const wrapper = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (!wrapper) return;

      const newSig = JSON.stringify((data.items || []).map((it) => (typeof it === 'object' && it !== null ? [it.value, it.label] : [it, String(it)])));
      if (context && wrapper.dataset.itemsSig !== undefined && wrapper.dataset.itemsSig !== newSig) {
        wrapper.replaceWith(WiseComboBox.renderElement(data, context));
        return;
      }

      const items = (data.items || []).map((it) => (typeof it === 'object' && it !== null ? { value: it.value !== undefined ? it.value : it.label, label: it.label !== undefined ? it.label : String(it.value) } : { value: it, label: String(it) }));
      let currentValue = data.value !== undefined && data.value !== null ? data.value : wrapper.dataset.value;
      let currentItem = items.find((it) => String(it.value) === String(currentValue));

      if (!currentItem && data.selectedIndex !== undefined && data.selectedIndex >= 0 && items[data.selectedIndex]) {
        currentItem = items[data.selectedIndex];
        currentValue = currentItem.value;
      }
      if (!currentItem && items.length > 0) {
        if (!data.placeholder || (currentValue !== '' && currentValue !== undefined && currentValue !== null)) {
          currentItem = items[0];
          currentValue = currentItem.value;
        }
      }

      wrapper.dataset.value = currentValue !== undefined && currentValue !== null ? currentValue : '';
      const hiddenInput = wrapper.querySelector('.wise-combobox-value') || wrapper.querySelector('input[type="hidden"]');
      if (hiddenInput) hiddenInput.value = wrapper.dataset.value;

      const labelSpan = wrapper.querySelector('.wise-combobox-label');
      if (labelSpan) {
        const displayLabel = currentItem ? currentItem.label : (data.placeholder || 'Pilih opsi...');
        labelSpan.textContent = displayLabel;
        labelSpan.dataset.rawLabel = displayLabel;
      }

      // Do NOT call WiseControl.patchElement here: the wrapper is a <div>, so
      // the generic version would set textContent and wipe the trigger/dropdown.
      Object.entries(data.style || {}).forEach(([key, value]) => {
        wrapper.style[key] = typeof value === 'number' ? `${value}px` : value;
      });
      if (data.visible === false) {
        wrapper.style.display = 'none';
      } else if (wrapper.style.display === 'none') {
        wrapper.style.display = (data.style && data.style.display) || '';
      }
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry = window.WiseControlRegistry || {};
    window.WiseControlRegistry.WiseComboBox = WiseComboBox;
  } else {
    module.exports = WiseComboBox;
  }
})();
