(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  class WiseTextBox extends WiseControl {
    constructor(placeholder = '', options = {}) {
      super(options.value || '', options);
      this.name = 'WiseTextBox';
      this.placeholder = placeholder;
      this.minLength = options.minLength;
      this.maxLength = options.maxLength;
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
        style: this.style,
        visible: this.visible,
      };
    }

    static renderElement(data) {
      const el = document.createElement('input');
      el.type = 'text';
      el.placeholder = data.placeholder || '';
      el.value = data.value || '';
      // maxlength is actively enforced by the browser (typing past it is
      // blocked); minlength isn't (it can't be, until you've typed
      // *something*) but does drive :invalid once there's a value shorter
      // than it -- see the input:invalid rule in styles.css for the ring.
      if (data.minLength !== undefined && data.minLength !== null) el.minLength = data.minLength;
      if (data.maxLength !== undefined && data.maxLength !== null) el.maxLength = data.maxLength;
      el.className = 'w-full appearance-none rounded-lg border-0 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm ring-1 ring-slate-900/10 outline-none transition focus:shadow-md focus:ring-2 focus:ring-[var(--accent)]';
      WiseControl.applyCommon(el, data);
      return el;
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseTextBox = WiseTextBox;
  } else {
    module.exports = WiseTextBox;
  }
})();
