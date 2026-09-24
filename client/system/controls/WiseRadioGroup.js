(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  class WiseRadioGroup extends WiseControl {
    constructor(items = [], options = {}) {
      super(options.value ?? (items[0] && items[0].value) ?? '', options);
      this.name = 'WiseRadioGroup';
      this.items = items;
      this.onChange = typeof options.onChange === 'function' ? options.onChange : null;
      this.layout = options.layout === 'vertical' ? 'vertical' : 'horizontal';
      this.style = options.style || {};
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        value: this.value,
        items: this.items,
        hasHandler: !!this.onChange,
        layout: this.layout,
        style: this.style,
        visible: this.visible,
      };
    }

    static renderElement(data, context) {
      const wrapper = document.createElement('div');
      wrapper.className = data.layout === 'vertical'
        ? 'flex flex-col gap-0.5'
        : 'flex flex-row flex-wrap items-center gap-x-4 gap-y-1';
      WiseControl.applyCommon(wrapper, data);

      (data.items || []).forEach((item) => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-3 rounded-md px-2 py-1 text-sm text-slate-800 transition hover:bg-slate-900/5 cursor-pointer';

        const input = document.createElement('input');
        input.type = 'radio';
        // Scoped per window instance, not just per control id -- two windows
        // of the same app both having a "radioColor" group would otherwise
        // share one native radio group across the whole page (selecting one
        // un-checks the other window's).
        input.name = context.windowId ? `${context.windowId}-${data.id}` : data.id;
        input.value = item.value;
        input.className = 'h-[18px] w-[18px] cursor-pointer';
        input.dataset.controlId = data.id;
        input.dataset.controlType = data.type;
        if (item.value === data.value) input.checked = true;
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
      const checked = winEl.querySelector(`input[data-control-id="${id}"]:checked`);
      return checked ? checked.value : '';
    }

    static patchElement(winEl, data) {
      winEl.querySelectorAll(`input[data-control-id="${data.id}"]`).forEach((input) => {
        input.checked = input.value === data.value;
      });
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseRadioGroup = WiseRadioGroup;
  } else {
    module.exports = WiseRadioGroup;
  }
})();
