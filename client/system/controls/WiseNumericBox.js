(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  // Decimal point and thousands/digit-grouping separator, detected together
  // from the same locale (which reflects the OS locale on every mainstream
  // browser/OS) so they're always a consistent pair -- e.g. en-US is "."
  // decimal / "," group, id-ID is "," decimal / "." group.
  function getSeparators() {
    if (!isBrowser) return { decimal: '.', group: ',' };
    const parts = new Intl.NumberFormat(undefined, { useGrouping: true }).formatToParts(1234.5);
    const decimal = (parts.find((part) => part.type === 'decimal') || {}).value || '.';
    const group = (parts.find((part) => part.type === 'group') || {}).value || ',';
    return { decimal, group };
  }

  // Grouping separators shift position as they're added/removed mid-edit,
  // so the cursor can't just be restored to the same character index after
  // reformatting -- it has to be restored to "after the same digit", which
  // stays meaningful regardless of how many separators end up around it.
  function countDigitsBefore(text, pos) {
    let count = 0;
    for (let i = 0; i < pos && i < text.length; i += 1) {
      if (text[i] >= '0' && text[i] <= '9') count += 1;
    }
    return count;
  }

  function positionAfterDigits(text, digitCount) {
    if (digitCount <= 0) return 0;
    let count = 0;
    for (let i = 0; i < text.length; i += 1) {
      if (text[i] >= '0' && text[i] <= '9') {
        count += 1;
        if (count === digitCount) return i + 1;
      }
    }
    return text.length;
  }

  class WiseNumericBox extends WiseControl {
    constructor(placeholder = '', options = {}) {
      super(options.value !== undefined ? options.value : '', options);
      this.name = 'WiseNumericBox';
      this.placeholder = placeholder;
      this.min = options.min;
      this.max = options.max;
      this.step = options.step !== undefined ? options.step : 'any';
      this.prefix = options.prefix || '';
      this.suffix = options.suffix || '';
      this.onChange = typeof options.onChange === 'function' ? options.onChange : null;
      this.onClick = typeof options.onClick === 'function' ? options.onClick : null;
      this.onHover = typeof options.onHover === 'function' ? options.onHover : null;
      this.style = options.style || {};
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        dataField: this.dataField,
        value: this.value,
        placeholder: this.placeholder,
        min: this.min,
        max: this.max,
        step: this.step,
        prefix: this.prefix,
        suffix: this.suffix,
        hasHandler: !!this.onChange,
        hasClickHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        style: this.style,
        visible: this.visible,
        disabled: this.disabled,
      };
    }

    // A JS number (always period-based, no grouping) -> "raw" text (digits
    // + the locale decimal point, still no grouping) -- the intermediate
    // form toDisplay() groups and parseValue() reads back from.
    static toRaw(value, decimal) {
      if (value === '' || value === null || value === undefined) return '';
      return String(value).replace('.', decimal);
    }

    // raw or grouped text -> a JS number. Knows the actual group/decimal
    // characters for this locale, so "1.234.567,89" (id-ID) and
    // "1,234,567.89" (en-US) both parse correctly and unambiguously --
    // unlike guessing "any . or , is the decimal point", which breaks the
    // instant grouping separators are in the mix.
    static parseValue(text, decimal, group) {
      if (text === '' || text === null || text === undefined) return null;
      let cleaned = String(text).trim();
      if (group) cleaned = cleaned.split(group).join('');
      if (decimal && decimal !== '.') cleaned = cleaned.split(decimal).join('.');
      const parsed = Number(cleaned);
      return Number.isNaN(parsed) ? null : parsed;
    }

    // raw text -> grouped display text, e.g. "1234567,89" -> "1.234.567,89"
    // (id-ID). What's shown while the field is NOT focused.
    static toDisplay(raw, decimal, group) {
      if (raw === '') return '';
      const negative = raw.startsWith('-');
      const unsigned = negative ? raw.slice(1) : raw;
      const [intPart, fracPart] = unsigned.split(decimal);
      const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, group);
      const sign = negative ? '-' : '';
      return fracPart !== undefined ? `${sign}${groupedInt}${decimal}${fracPart}` : `${sign}${groupedInt}`;
    }

    // Prefix/suffix (e.g. "$" / "kg") are rendered *inside* the control's
    // own visual box, not as separate labels -- the wrapper carries the
    // border/background/shadow/focus-ring that el itself used to have, and
    // el becomes a borderless/transparent flex child alongside them, the
    // same "input group" pattern used everywhere for this. Since the
    // wrapper (not el) is now the returned root, applyCommon (and so
    // data-control-id) moves to the wrapper too -- see gatherValue/
    // patchElement below for the matching lookup, the same two-level
    // pattern WiseDateRange already uses for its own multi-element layout.
    static renderElement(data, context) {
      const { decimal, group } = getSeparators();
      const raw = WiseNumericBox.toRaw(data.value, decimal);

      const wrapper = document.createElement('div');
      wrapper.className = 'flex w-full items-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-900/10 transition focus-within:shadow-md focus-within:ring-2 focus-within:ring-[var(--accent)]';
      WiseControl.applyCommon(wrapper, data, context);

      if (data.prefix) {
        const prefixEl = document.createElement('span');
        prefixEl.className = 'select-none pl-3 text-sm text-slate-500';
        prefixEl.textContent = data.prefix;
        wrapper.appendChild(prefixEl);
      }

      const el = document.createElement('input');
      el.type = 'text';
      el.inputMode = 'decimal';
      el.placeholder = data.placeholder || '';
      el.value = WiseNumericBox.toDisplay(raw, decimal, group);
      el.dataset.decimal = decimal;
      el.dataset.group = group;
      el.className = 'min-w-0 flex-1 appearance-none border-0 bg-transparent px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 outline-none';
      wrapper.appendChild(el);

      if (data.suffix) {
        const suffixEl = document.createElement('span');
        suffixEl.className = 'select-none pr-3 text-sm text-slate-500';
        suffixEl.textContent = data.suffix;
        wrapper.appendChild(suffixEl);
      }

      // Reformats with grouping on every keystroke (not just on blur),
      // restoring the cursor afterward. el.value already contains grouping
      // separators from the previous keystroke's render, so the group
      // character is stripped explicitly *first* -- only the field's own
      // `decimal` character (not "either '.' or ','") is treated as a
      // decimal point here, since once grouping is live there's no way to
      // tell "the group separator that's already there" apart from "the
      // wrong decimal character the user just typed out of habit" when
      // they're the same punctuation mark. Typing the non-decimal one is
      // simply absorbed as if it were a grouping separator (a harmless
      // no-op) -- the alternative is silently corrupting the number.
      el.addEventListener('input', () => {
        const cursorPos = el.selectionStart;
        const oldDecimalPos = el.value.indexOf(decimal);
        // The fraction part never gets grouping characters inserted into
        // it, so once the cursor is past the decimal point its position
        // relative to that point is stable -- restore it by that offset,
        // not by digit count (which can't tell "just after the decimal
        // point, 0 fraction digits so far" apart from "just before it").
        // Digit count is still needed for the integer part, since grouping
        // does shift positions there.
        const inFraction = oldDecimalPos !== -1 && cursorPos > oldDecimalPos;
        const digitsBeforeCursor = countDigitsBefore(el.value, inFraction ? oldDecimalPos + 1 : cursorPos);
        const fractionOffset = inFraction ? cursorPos - (oldDecimalPos + 1) : 0;

        let cleaned = el.value.split(group).join('');
        cleaned = cleaned.split('').filter((ch) => (ch >= '0' && ch <= '9') || ch === '-' || ch === decimal).join('');
        const minus = cleaned.startsWith('-') ? '-' : '';
        cleaned = minus + cleaned.slice(minus.length).replace(/-/g, '');
        const parts = cleaned.split(decimal);
        const raw = parts.length > 1 ? `${parts[0]}${decimal}${parts.slice(1).join('')}` : parts[0];

        const display = WiseNumericBox.toDisplay(raw, decimal, group);
        el.value = display;

        let newPos;
        if (inFraction) {
          const newDecimalPos = display.indexOf(decimal);
          newPos = newDecimalPos === -1 ? display.length : newDecimalPos + 1 + fractionOffset;
        } else {
          newPos = positionAfterDigits(display, digitsBeforeCursor);
        }
        el.setSelectionRange(newPos, newPos);
      });

      // Blur: parse, clamp to min/max, then redisplay WITH grouping.
      el.addEventListener('blur', () => {
        const parsed = WiseNumericBox.parseValue(el.value, decimal, group);
        if (parsed === null) {
          el.value = '';
          return;
        }
        let clamped = parsed;
        if (data.min !== undefined && data.min !== null && clamped < data.min) clamped = data.min;
        if (data.max !== undefined && data.max !== null && clamped > data.max) clamped = data.max;
        el.value = WiseNumericBox.toDisplay(WiseNumericBox.toRaw(clamped, decimal), decimal, group);
      });

      if (data.hasHandler) {
        el.addEventListener('change', () => context.desktop.sendControlEvent(context.appId, data.id, el, 'change'));
      }
      return wrapper;
    }

    static gatherValue(winEl, id) {
      const wrapper = winEl.querySelector(`[data-control-id="${id}"]`);
      const node = wrapper && wrapper.querySelector('input');
      if (!node) return undefined;
      const decimal = node.dataset.decimal || '.';
      const group = node.dataset.group || ',';
      return WiseNumericBox.parseValue(node.value, decimal, group);
    }

    static patchElement(winEl, data) {
      const wrapper = winEl.querySelector(`[data-control-id="${data.id}"]`);
      const node = wrapper && wrapper.querySelector('input');
      if (!node) return;
      const decimal = node.dataset.decimal || getSeparators().decimal;
      const group = node.dataset.group || getSeparators().group;
      node.value = WiseNumericBox.toDisplay(WiseNumericBox.toRaw(data.value, decimal), decimal, group);
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseNumericBox = WiseNumericBox;
  } else {
    module.exports = WiseNumericBox;
  }
})();
