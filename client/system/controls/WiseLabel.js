(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  class WiseLabel extends WiseControl {
    constructor(value = '', options = {}) {
      super(value, options);
      this.name = 'WiseLabel';
      this.onClick = typeof options.onClick === 'function' ? options.onClick : null;
      this.onHover = typeof options.onHover === 'function' ? options.onHover : null;
      this.style = options.style || {};
    }

    text(value) {
      if (value !== undefined) {
        this.value = value;
      }
      return this.value;
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        value: this.value,
        hasClickHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        style: this.style,
        visible: this.visible,
      };
    }

    static renderElement(data, context) {
      const el = document.createElement('div');
      el.className = 'whitespace-pre-wrap text-sm text-slate-800';
      el.textContent = data.value;
      WiseControl.applyCommon(el, data, context);
      return el;
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseLabel = WiseLabel;
  } else {
    module.exports = WiseLabel;
  }
})();
