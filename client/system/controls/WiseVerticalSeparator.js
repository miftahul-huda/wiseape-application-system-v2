(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  class WiseVerticalSeparator extends WiseControl {
    constructor(options = {}) {
      super('', options);
      this.name = 'WiseVerticalSeparator';
      this.height = options.height || 26;
      this.style = options.style || {};
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        height: this.height,
        style: this.style,
        visible: this.visible,
      };
    }

    static renderElement(data, context) {
      const el = document.createElement('div');
      el.className = 'wise-vertical-separator self-center w-px mx-1 bg-slate-300/80 transition-colors';
      const h = typeof data.height === 'number' ? `${data.height}px` : (data.height || '26px');
      el.style.height = h;
      WiseControl.applyCommon(el, data, context);
      return el;
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseVerticalSeparator = WiseVerticalSeparator;
  } else {
    module.exports = WiseVerticalSeparator;
  }
})();
