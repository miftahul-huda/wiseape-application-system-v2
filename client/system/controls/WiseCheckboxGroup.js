(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  class WiseCheckboxGroup extends WiseControl {
    constructor(items = [], options = {}) {
      super(Array.isArray(options.value) ? options.value : [], options);
      this.name = 'WiseCheckboxGroup';
      this.items = items;
      this.layout = options.layout === 'vertical' ? 'vertical' : 'horizontal';
      this.onClick = typeof options.onClick === 'function' ? options.onClick : null;
      this.onHover = typeof options.onHover === 'function' ? options.onHover : null;
      this.style = options.style || {};

      // onItemChecked reports which single item just toggled, plus its new
      // checked state -- computed as the difference between the checked-
      // values array before and after this change (dispatchControlEvent
      // has already overwritten this.value with the new array by the time
      // any handler runs, so the previous array has to be tracked on the
      // way in). Arrow function so `this` stays the control despite
      // dispatchControlEvent's `handler.call(win)` -- see WiseComboBox.
      const publicOnChange = typeof options.onChange === 'function' ? options.onChange : null;
      this.onItemChecked = typeof options.onItemChecked === 'function' ? options.onItemChecked : null;
      this._lastValues = Array.isArray(this.value) ? [...this.value] : [];
      this.onChange = (publicOnChange || this.onItemChecked) ? () => {
        const previousValues = this._lastValues;
        const currentValues = Array.isArray(this.value) ? this.value : [];
        this._lastValues = [...currentValues];
        const newlyChecked = currentValues.find((v) => !previousValues.includes(v));
        const changedValue = newlyChecked !== undefined
          ? newlyChecked
          : previousValues.find((v) => !currentValues.includes(v));
        const changedItem = this.items.find((item) => item.value === changedValue) || null;
        if (this.onItemChecked) {
          this.onItemChecked(changedItem ? { ...changedItem, checked: newlyChecked !== undefined } : null);
        }
        if (publicOnChange) return publicOnChange();
      } : null;
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
        value: this.value,
        items: this.items,
        hasHandler: !!this.onChange,
        hasClickHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        layout: this.layout,
        style: this.style,
        visible: this.visible,
        disabled: this.disabled,
      };
    }

    static renderElement(data, context) {
      const wrapper = document.createElement('div');
      wrapper.className = data.layout === 'vertical'
        ? 'flex flex-col gap-0.5'
        : 'flex flex-row flex-wrap items-center gap-x-4 gap-y-1';
      WiseControl.applyCommon(wrapper, data, context);

      const selected = Array.isArray(data.value) ? data.value : [];

      (data.items || []).forEach((item) => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-3 rounded-md px-2 py-1 text-sm text-slate-800 transition hover:bg-slate-900/5 cursor-pointer';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = item.value;
        input.className = 'h-[18px] w-[18px] cursor-pointer rounded';
        input.dataset.controlId = data.id;
        input.dataset.controlType = data.type;
        if (selected.includes(item.value)) input.checked = true;
        if (data.hasHandler) {
          input.addEventListener('change', () => context.desktop.sendControlEvent(context.appId, data.id, wrapper, 'change'));
        }

        label.appendChild(input);
        label.appendChild(document.createTextNode(item.label));
        wrapper.appendChild(label);
      });

      return wrapper;
    }

    static gatherValue(winEl, id) {
      return Array.from(winEl.querySelectorAll(`input[data-control-id="${id}"]:checked`)).map((input) => input.value);
    }

    static patchElement(winEl, data) {
      const values = Array.isArray(data.value) ? data.value : [];
      winEl.querySelectorAll(`input[data-control-id="${data.id}"]`).forEach((input) => {
        input.checked = values.includes(input.value);
      });
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseCheckboxGroup = WiseCheckboxGroup;
  } else {
    module.exports = WiseCheckboxGroup;
  }
})();
