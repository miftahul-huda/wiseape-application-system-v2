(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  class WiseTextBox extends WiseControl {
    constructor(placeholder = '', options = {}) {
      let val = options.value !== undefined && options.value !== null ? String(options.value) : '';
      let ph = options.placeholder !== undefined && options.placeholder !== null ? String(options.placeholder) : '';

      if (options.placeholder !== undefined && options.value === undefined) {
        val = placeholder !== undefined && placeholder !== null ? String(placeholder) : '';
        ph = String(options.placeholder);
      } else if (!ph && placeholder) {
        ph = String(placeholder);
      }

      super(val, options);
      this.name = 'WiseTextBox';
      this.placeholder = ph;
      this.minLength = options.minLength;
      this.maxLength = options.maxLength;
      this.onChange = typeof options.onChange === 'function' ? options.onChange : null;
      this.onClick = typeof options.onClick === 'function' ? options.onClick : null;
      this.onHover = typeof options.onHover === 'function' ? options.onHover : null;
      this.onKeyPress = typeof options.onKeyPress === 'function' ? options.onKeyPress : null;
      this.style = options.style || {};
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        value: this.value,
        placeholder: this.placeholder,
        minLength: this.minLength,
        maxLength: this.maxLength,
        hasHandler: !!this.onChange,
        hasClickHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        hasKeyPressHandler: !!this.onKeyPress,
        style: this.style,
        visible: this.visible,
        disabled: this.disabled,
      };
    }

    static renderElement(data, context) {
      const el = document.createElement('input');
      el.type = 'text';
      const rawPh = data.placeholder || '';
      el.dataset.rawPlaceholder = rawPh;
      el.placeholder = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(rawPh) : rawPh;
      el.value = data.value || '';
      // maxlength is actively enforced by the browser (typing past it is
      // blocked); minlength isn't (it can't be, until you've typed
      // *something*) but does drive :invalid once there's a value shorter
      // than it -- see the input:invalid rule in styles.css for the ring.
      if (data.minLength !== undefined && data.minLength !== null) el.minLength = data.minLength;
      if (data.maxLength !== undefined && data.maxLength !== null) el.maxLength = data.maxLength;
      el.className = 'w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 shadow-none outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]';
      WiseControl.applyCommon(el, data, context);
      if (data.hasHandler) {
        el.addEventListener('change', () => context.desktop.sendControlEvent(context.appId, data.id, el, 'change'));
      }
      if (data.hasKeyPressHandler) {
        el.addEventListener('keydown', (e) => context.desktop.sendControlEvent(context.appId, data.id, el, 'keypress', { key: e.key, code: e.code, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey }));
      }
      return el;
    }

    static patchElement(winEl, data) {
      const el = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (!el) return;
      if (data.value !== undefined && el.value !== data.value) {
        el.value = data.value;
      }
      if (data.placeholder !== undefined) {
        el.dataset.rawPlaceholder = data.placeholder;
        el.placeholder = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(data.placeholder) : data.placeholder;
      }
      Object.entries(data.style || {}).forEach(([key, value]) => {
        el.style[key] = typeof value === 'number' ? `${value}px` : value;
      });
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseTextBox = WiseTextBox;
  } else {
    module.exports = WiseTextBox;
  }
})();
