(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  class WiseIconMenu extends WiseControl {
    constructor(label = '', options = {}) {
      super(label, options);
      this.name = 'WiseIconMenu';
      this.icon = options.icon || '';
      this.iconSize = options.iconSize || 36;
      this.badge = options.badge !== undefined ? options.badge : null;
      this.badgeColor = options.badgeColor || null;
      this.description = options.description || '';
      this.layout = options.layout === 'horizontal' ? 'horizontal' : 'vertical';
      this.active = !!options.active;
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
        icon: this.icon,
        iconSize: this.iconSize,
        badge: this.badge,
        badgeColor: this.badgeColor,
        description: this.description,
        layout: this.layout,
        active: this.active,
        hasHandler: !!this.onClick,
        hasHoverHandler: !!this.onHover,
        style: this.style,
        visible: this.visible,
        disabled: this.disabled,
      };
    }

    static renderElement(data, context) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.controlId = data.id || '';
      btn.dataset.controlType = data.type || 'WiseIconMenu';

      const isVertical = data.layout !== 'horizontal';

      // Borderless button styling with clean hover effect
      btn.className = 'wise-icon-menu group relative inline-flex items-center justify-center p-1 rounded-md border-0 bg-transparent transition-all duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]';

      if (data.active) {
        btn.classList.add('bg-[var(--accent)]/15', 'text-[var(--accent)]');
      }

      const valText = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(data.value || '') : (data.value || '');
      const descText = (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(data.description || '') : (data.description || '');

      // Native browser tooltip fallback
      btn.title = descText ? `${valText} — ${descText}` : valText;

      // Icon container
      const iconWrapper = document.createElement('div');
      const sizePx = typeof data.iconSize === 'number' ? `${data.iconSize}px` : (data.iconSize || '32px');
      iconWrapper.className = 'relative flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-110';
      iconWrapper.style.width = sizePx;
      iconWrapper.style.height = sizePx;
      iconWrapper.style.overflow = 'hidden';

      const iconSrc = (data.icon || '').trim();
      const isImgUrl = /^(https?:\/\/|\/|\.\/|data:image\/)/i.test(iconSrc) || /\.(png|jpe?g|svg|webp|gif|ico)$/i.test(iconSrc);
      const isSvgMarkup = iconSrc.startsWith('<svg') || /<svg[\s>]/i.test(iconSrc);

      if (isImgUrl) {
        const img = document.createElement('img');
        img.src = iconSrc;
        img.alt = valText;
        img.className = 'w-full h-full object-contain pointer-events-none select-none';
        img.onerror = () => {
          img.style.display = 'none';
          iconWrapper.textContent = '🔘';
          iconWrapper.className += ' text-2xl';
        };
        iconWrapper.appendChild(img);
      } else if (isSvgMarkup) {
        iconWrapper.innerHTML = iconSrc;
        const svgEl = iconWrapper.querySelector('svg');
        if (svgEl) {
          // Tools like VTracer export SVGs with hard-coded width/height attributes
          // (e.g. width="512" height="512"). Those presentation attributes prevent
          // the SVG from scaling via CSS. Remove them and ensure a viewBox is set
          // so the SVG preserves its aspect ratio when told to fill 100%.
          const attrW = svgEl.getAttribute('width');
          const attrH = svgEl.getAttribute('height');
          if (!svgEl.getAttribute('viewBox') && attrW && attrH) {
            svgEl.setAttribute('viewBox', `0 0 ${attrW} ${attrH}`);
          }
          svgEl.removeAttribute('width');
          svgEl.removeAttribute('height');
          svgEl.style.width = '100%';
          svgEl.style.height = '100%';
          svgEl.style.display = 'block';
        }
      } else {
        // Emoji or text glyph
        const span = document.createElement('span');
        span.className = 'select-none pointer-events-none leading-none';
        span.style.fontSize = typeof data.iconSize === 'number' ? `${Math.round(data.iconSize * 0.75)}px` : '26px';
        span.textContent = iconSrc || '📌';
        iconWrapper.appendChild(span);
      }
      btn.appendChild(iconWrapper);

      // Floating Tooltip popup (title & description visible only on mouseover, attached to body so it is never obstructed)
      if (data.value || data.description) {
        let tooltip = null;

        const updateTooltipPos = () => {
          if (!tooltip) return;
          const rect = btn.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) {
            hideTooltip();
            return;
          }
          tooltip.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
          tooltip.style.top = `${Math.round(rect.bottom + 8)}px`;
        };

        const showTooltip = () => {
          if (tooltip) return;
          tooltip = document.createElement('div');
          tooltip.className = 'wise-floating-tooltip pointer-events-none fixed flex flex-col items-center whitespace-nowrap transition-opacity duration-150 ease-out';
          tooltip.style.zIndex = '99999999';
          tooltip.style.transform = 'translateX(-50%)';
          tooltip.style.opacity = '1';

          // Caret pointing up to the icon
          const caret = document.createElement('div');
          caret.className = 'w-2 h-2 bg-slate-950 border-t border-l border-slate-700/80 rotate-45 -mb-1 z-10';

          const bubble = document.createElement('div');
          bubble.className = 'flex flex-col items-center rounded-md bg-slate-950 px-3 py-1.5 text-center text-white border border-slate-700/80 shadow-2xl min-w-max';

          if (data.value) {
            const titleSpan = document.createElement('span');
            titleSpan.className = 'text-xs font-semibold leading-tight tracking-wide text-white';
            titleSpan.textContent = valText;
            bubble.appendChild(titleSpan);
          }

          if (data.description) {
            const descSpan = document.createElement('span');
            descSpan.className = 'text-[10px] text-slate-300 leading-tight mt-0.5 font-normal';
            descSpan.textContent = descText;
            bubble.appendChild(descSpan);
          }

          tooltip.appendChild(caret);
          tooltip.appendChild(bubble);
          document.body.appendChild(tooltip);
          updateTooltipPos();

          window.addEventListener('scroll', updateTooltipPos, true);
        };

        const hideTooltip = () => {
          if (tooltip) {
            window.removeEventListener('scroll', updateTooltipPos, true);
            tooltip.remove();
            tooltip = null;
          }
        };

        btn.addEventListener('mouseenter', showTooltip);
        btn.addEventListener('mouseleave', hideTooltip);
        btn.addEventListener('click', hideTooltip);
        btn.addEventListener('blur', hideTooltip);
      }

      // Badge (optional pill indicator on the top-right)
      if (data.badge !== null && data.badge !== undefined && data.badge !== '') {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'absolute -top-1.5 -right-1.5 flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white rounded-full shadow-xs pointer-events-none';
        badgeEl.style.backgroundColor = data.badgeColor || 'var(--accent, #ef4444)';
        badgeEl.textContent = String(data.badge);
        btn.appendChild(badgeEl);
      }

      WiseControl.applyCommon(btn, data, context);

      if (data.hasHandler) {
        btn.addEventListener('click', () => {
          context.desktop.sendControlEvent(context.appId, data.id, btn, 'click');
        });
      }

      return btn;
    }

    // Without this, a patch would fall back to WiseControl's generic
    // patchElement, which sets textContent and wipes out the icon markup
    // built above -- rebuild the whole button from fresh data instead.
    static patchElement(winEl, data, context) {
      const existing = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (!existing || !context) return;
      existing.replaceWith(WiseIconMenu.renderElement(data, context));
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseIconMenu = WiseIconMenu;
  } else {
    module.exports = WiseIconMenu;
  }
})();
