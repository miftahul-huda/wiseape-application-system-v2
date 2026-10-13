(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  const DEFAULT_STYLE = {
    background: 'var(--accent)',
    color: '#ffffff',
    fontWeight: 600,
    borderRadius: '5px',
    padding: '8px 14px',
    border: 'none',
    boxShadow: 'none',
    cursor: 'pointer',
  };

  class WiseButton extends WiseControl {
    constructor(label = '', options = {}) {
      super(label, options);
      this.name = 'WiseButton';
      this.onClick = typeof options.onClick === 'function' ? options.onClick : null;
      this.onHover = typeof options.onHover === 'function' ? options.onHover : null;
      this.style = Object.assign({}, DEFAULT_STYLE, options.style || {});
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        value: this.value,
        // The onClick function itself can't cross the JSON boundary to the
        // browser. Only whether a handler exists is sent; the browser asks
        // the server to actually invoke it (see WiseApplicationSystem.dispatchControlEvent).
        hasHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        style: Object.assign({}, DEFAULT_STYLE, this.style || {}),
        visible: this.visible,
        disabled: this.disabled,
      };
    }

    static renderElement(data, context) {
      const el = document.createElement('button');
      el.type = 'button';
      const labelText = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(data.value) : (data.value ?? '');
      el.textContent = labelText;
      el.className = 'appearance-none border-0 justify-self-start inline-flex items-center justify-center gap-2 text-sm transition hover:brightness-105 active:brightness-95 cursor-pointer';
      // hasHoverHandler wiring comes from applyCommon; hasHandler (click) is
      // this control's own primary event and stays wired here explicitly,
      // unchanged from before.
      const mergedData = Object.assign({}, data, {
        style: Object.assign({}, DEFAULT_STYLE, data.style || {}),
      });
      WiseControl.applyCommon(el, mergedData, context);
      if (data.hasHandler) {
        el.addEventListener('click', () => context.desktop.sendControlEvent(context.appId, data.id, el, 'click'));
      }
      return el;
    }

    static patchElement(winEl, data) {
      const el = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (!el) return;
      const labelText = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(data.value) : (data.value ?? '');
      el.textContent = labelText;
      const mergedStyle = Object.assign({}, DEFAULT_STYLE, data.style || {});
      Object.entries(mergedStyle).forEach(([key, value]) => {
        el.style[key] = typeof value === 'number' ? `${value}px` : value;
      });
    }
  }

  WiseButton.DEFAULT_STYLE = DEFAULT_STYLE;

  if (isBrowser) {
    window.WiseControlRegistry.WiseButton = WiseButton;
  } else {
    module.exports = WiseButton;
  }
})();

