(function () {
  const isBrowser = typeof window !== 'undefined';

  class WiseControl {
    constructor(value = '', options = {}) {
      this.value = value;
      this.name = 'WiseControl';
      this.id = options.id || null;
      // Key WiseWindow.getValues() collects this control's value under;
      // defaults to id so most controls never need to set it explicitly.
      this.dataField = options.dataField || options.id || null;
      this.visible = options.visible !== undefined ? options.visible : true;
    }

    // Generic accessors so app code doesn't have to touch `.value` directly
    // -- every control stores its one piece of state there (containers that
    // don't have a single scalar value, e.g. WiseDataTable, expose their own
    // getData()/setData() instead; see each subclass).
    getValue() {
      return this.value;
    }

    setValue(value) {
      this.value = value;
      return this;
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        value: this.value,
        visible: this.visible,
      };
    }

    // ---- Browser-only: DOM rendering. Every subclass owns its own
    // renderElement/gatherValue/patchElement; these are the generic
    // fallbacks used when a subclass doesn't need to override them. ----

    static applyCommon(el, data, context) {
      if (data.id) {
        el.dataset.controlId = data.id;
        el.dataset.controlType = data.type;
      }
      Object.entries(data.style || {}).forEach(([key, value]) => {
        el.style[key] = typeof value === 'number' ? `${value}px` : value;
      });
      if (data.visible === false) {
        el.style.display = 'none';
      }

      // Generic click/hover wiring, shared by every control so a subclass
      // doesn't need its own listener code just to support these two --
      // opt-in via hasClickHandler/hasHoverHandler (set from
      // options.onClick/options.onHover), same shape as each control's own
      // onChange flag. `change` stays per-control (see each subclass) since
      // what DOM event actually means "changed" varies (native change,
      // blur, custom logic) in a way click/hover don't.
      if (context && context.desktop && data.id) {
        if (data.hasClickHandler) {
          el.addEventListener('click', () => context.desktop.sendControlEvent(context.appId, data.id, el, 'click'));
        }
        if (data.hasHoverHandler) {
          el.addEventListener('mouseenter', () => context.desktop.sendControlEvent(context.appId, data.id, el, 'hover'));
        }
      }
    }

    // Renders an unrecognized control type as a raw JSON dump, and is the
    // base implementation for simple single-element controls (text input,
    // select, textarea, ...) that don't need their own DOM structure logic.
    static renderElement(data) {
      const el = document.createElement('pre');
      el.textContent = JSON.stringify(data, null, 2);
      WiseControl.applyCommon(el, data);
      return el;
    }

    // Reads this control's current value back out of the DOM. Returns
    // `undefined` for non-value-bearing controls (labels, buttons) so
    // they're excluded from the values gathered when another control's
    // event fires.
    static gatherValue(winEl, id) {
      const node = winEl.querySelector(`[data-control-id="${id}"]`);
      if (!node) return undefined;
      if (node.isContentEditable) return node.innerHTML;
      if (node.tagName === 'INPUT' || node.tagName === 'SELECT' || node.tagName === 'TEXTAREA') {
        return node.value;
      }
      return undefined;
    }

    // Applies a fresh value (from the server) back onto this control's DOM.
    static patchElement(winEl, data) {
      const el = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (!el) return;

      if (el.isContentEditable) {
        el.innerHTML = data.value ?? '';
      } else if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
        el.value = data.value ?? '';
      } else {
        el.textContent = data.value ?? '';
      }
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry = window.WiseControlRegistry || {};
    window.WiseControlRegistry.WiseControl = WiseControl;
  } else {
    module.exports = WiseControl;
  }
})();
