(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  class WiseLabel extends WiseControl {
    constructor(value = '', options = {}) {
      super(value, options);
      this.name = 'WiseLabel';
      this.icon = options.icon || null;
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

    getIcon() {
      return this.icon;
    }

    setIcon(icon) {
      this.icon = icon;
      return this;
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        value: this.value,
        icon: this.icon,
        hasClickHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        style: this.style,
        visible: this.visible,
        disabled: this.disabled,
      };
    }

    static buildContent(el, data) {
      el.innerHTML = '';
      if (data.icon) {
        el.className = 'inline-flex items-center gap-1.5 whitespace-pre-wrap text-sm text-slate-800';
        const iconSpan = document.createElement('span');
        iconSpan.className = 'wise-label-icon inline-flex items-center justify-center shrink-0';
        const rawIcon = String(data.icon).trim();
        if (rawIcon.startsWith('<')) {
          iconSpan.innerHTML = rawIcon;
        } else if (/^(https?:\/\/|\/|data:)/.test(rawIcon)) {
          iconSpan.innerHTML = `<img src="${rawIcon}" class="w-4 h-4 object-contain" alt="" />`;
        } else if (rawIcon.includes(' ')) {
          iconSpan.innerHTML = `<i class="${rawIcon}"></i>`;
        } else {
          iconSpan.textContent = rawIcon;
        }
        const textSpan = document.createElement('span');
        textSpan.className = 'wise-label-text';
        textSpan.textContent = data.value ?? '';
        el.appendChild(iconSpan);
        el.appendChild(textSpan);
      } else {
        el.className = 'whitespace-pre-wrap text-sm text-slate-800';
        el.textContent = data.value ?? '';
      }
    }

    static renderElement(data, context) {
      const el = document.createElement('div');
      WiseLabel.buildContent(el, data);
      WiseControl.applyCommon(el, data, context);
      return el;
    }

    static patchElement(winEl, data) {
      const el = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (!el) return;
      WiseLabel.buildContent(el, data);
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseLabel = WiseLabel;
  } else {
    module.exports = WiseLabel;
  }
})();

