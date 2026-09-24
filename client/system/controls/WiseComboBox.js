(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  class WiseComboBox extends WiseControl {
    constructor(items = [], options = {}) {
      super(options.value ?? (items[0] && items[0].value) ?? '', options);
      this.name = 'WiseComboBox';
      this.items = items;
      this.onClick = typeof options.onClick === 'function' ? options.onClick : null;
      this.onHover = typeof options.onHover === 'function' ? options.onHover : null;
      this.style = options.style || {};

      // Public onChange keeps its existing no-argument contract (app code
      // reads back this.value); onItemChanged is an additive, richer
      // sibling that also needs the item that was selected *before* this
      // change -- which dispatchControlEvent has already overwritten
      // this.value with by the time any handler runs, so it has to be
      // tracked here, on the way in, rather than derived after the fact.
      // The wrapper is an arrow function (not a prototype method) so `this`
      // stays the control even though dispatchControlEvent invokes it via
      // `handler.call(win)` -- same trick WiseDataTable's internal
      // on<Event> handlers use.
      const publicOnChange = typeof options.onChange === 'function' ? options.onChange : null;
      this.onItemChanged = typeof options.onItemChanged === 'function' ? options.onItemChanged : null;
      this._lastItem = this.items.find((item) => item.value === this.value) || null;
      this.onChange = (publicOnChange || this.onItemChanged) ? () => {
        const previousItem = this._lastItem;
        const currentItem = this.items.find((item) => item.value === this.value) || null;
        this._lastItem = currentItem;
        if (this.onItemChanged) this.onItemChanged(previousItem, currentItem);
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
        style: this.style,
        visible: this.visible,
      };
    }

    static renderElement(data, context) {
      const wrapper = document.createElement('div');
      wrapper.className = 'relative w-full';

      const el = document.createElement('select');
      el.className = 'w-full cursor-pointer appearance-none rounded-lg border-0 bg-white py-1.5 pl-3 pr-8 text-sm text-slate-800 shadow-sm ring-1 ring-slate-900/10 outline-none transition focus:shadow-md focus:ring-2 focus:ring-[var(--accent)]';
      (data.items || []).forEach((item) => {
        const option = document.createElement('option');
        option.value = item.value;
        option.textContent = item.label;
        if (item.value === data.value) {
          option.selected = true;
        }
        el.appendChild(option);
      });
      WiseControl.applyCommon(el, data, context);
      if (data.hasHandler) {
        el.addEventListener('change', () => context.desktop.sendControlEvent(context.appId, data.id, el, 'change'));
      }

      const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      chevron.setAttribute('viewBox', '0 0 24 24');
      chevron.setAttribute('fill', 'none');
      chevron.setAttribute('stroke', 'currentColor');
      chevron.setAttribute('stroke-width', '2');
      chevron.setAttribute('stroke-linecap', 'round');
      chevron.setAttribute('stroke-linejoin', 'round');
      chevron.setAttribute('class', 'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400');
      chevron.innerHTML = '<path d="m6 9 6 6 6-6"></path>';

      wrapper.appendChild(el);
      wrapper.appendChild(chevron);
      return wrapper;
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseComboBox = WiseComboBox;
  } else {
    module.exports = WiseComboBox;
  }
})();
