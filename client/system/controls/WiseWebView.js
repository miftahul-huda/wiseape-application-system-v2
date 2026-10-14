(function () {
  const isBrowser = typeof window !== 'undefined';
  const WiseControl = isBrowser ? window.WiseControlRegistry.WiseControl : require('./WiseControl');

  // Only http(s) pages are embedded: `javascript:` / `data:` URLs would run in the
  // app's own origin.
  function isSafeUrl(url) {
    return /^https?:\/\/\S+$/i.test(String(url || '').trim());
  }

  // WiseWebView: shows the page at `url` inside the window (an <iframe>).
  //   new WiseWebView({ id: 'web', url: 'https://example.com', height: '70vh' })
  //   view.setUrl(url) / view.reload()
  // A page that sends `X-Frame-Options: DENY|SAMEORIGIN` (or a CSP frame-ancestors)
  // refuses to be embedded and the frame stays blank -- the browser gives the app no
  // way to detect it, which is why the bar above the frame always offers
  // "open in a new tab".
  class WiseWebView extends WiseControl {
    constructor(options = {}) {
      super(options.url || '', options);
      this.name = 'WiseWebView';
      this.url = options.url || '';
      this.height = options.height || '70vh';
      this.showBar = options.showBar !== false;
      this.reloadToken = 0;
      this.style = options.style || {};
    }

    getUrl() {
      return this.url;
    }

    setUrl(url) {
      this.url = url || '';
      this.value = this.url;
      return this;
    }

    // Forces the frame to load its page again, even with an unchanged url.
    reload() {
      this.reloadToken += 1;
      return this;
    }

    render() {
      return {
        type: this.name,
        id: this.id,
        label: this.label,
        labelStyle: this.labelStyle,
        url: this.url,
        height: this.height,
        showBar: this.showBar,
        reloadToken: this.reloadToken,
        style: this.style,
        visible: this.visible,
        disabled: this.disabled,
      };
    }

    static t(key) {
      return (typeof window !== 'undefined' && window.WiseI18n) ? window.WiseI18n.t(key) : key;
    }

    // (Re)points the frame at data.url and shows the loading overlay until it loads.
    static load(wrapper, data) {
      const frame = wrapper.querySelector('iframe');
      const overlay = wrapper.querySelector('.wise-webview-overlay');
      const link = wrapper.querySelector('.wise-webview-open');
      const urlText = wrapper.querySelector('.wise-webview-url');
      const url = String(data.url || '').trim();
      const safe = isSafeUrl(url);

      wrapper.dataset.url = url;
      wrapper.dataset.reloadToken = String(data.reloadToken || 0);
      if (urlText) urlText.textContent = url;
      if (link) {
        link.href = safe ? url : '#';
        link.style.visibility = safe ? '' : 'hidden';
      }

      if (!safe) {
        frame.removeAttribute('src');
        overlay.classList.remove('is-hidden');
        overlay.innerHTML = '';
        overlay.textContent = url ? WiseWebView.t('WEBVIEW_INVALID_URL') : WiseWebView.t('WEBVIEW_NO_URL');
        return;
      }

      overlay.classList.remove('is-hidden');
      overlay.innerHTML = '<span class="wise-spinner" aria-hidden="true"></span>';
      const text = document.createElement('span');
      text.textContent = WiseWebView.t('WEBVIEW_LOADING');
      overlay.appendChild(text);
      frame.src = url;
    }

    static renderElement(data, context) {
      const wrapper = document.createElement('div');
      wrapper.className = 'wise-webview';
      WiseControl.applyCommon(wrapper, data, context);

      if (data.showBar !== false) {
        const bar = document.createElement('div');
        bar.className = 'wise-webview-bar';
        const urlText = document.createElement('span');
        urlText.className = 'wise-webview-url';
        const open = document.createElement('a');
        open.className = 'wise-webview-open';
        open.target = '_blank';
        open.rel = 'noopener noreferrer';
        open.textContent = WiseWebView.t('WEBVIEW_OPEN_NEW_TAB');
        bar.appendChild(urlText);
        bar.appendChild(open);
        wrapper.appendChild(bar);
      }

      const body = document.createElement('div');
      body.className = 'wise-webview-body';
      body.style.height = typeof data.height === 'number' ? `${data.height}px` : (data.height || '70vh');

      const frame = document.createElement('iframe');
      frame.className = 'wise-webview-frame';
      frame.setAttribute('referrerpolicy', 'no-referrer');
      // No allow-top-navigation: the embedded page cannot navigate the app away.
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads');
      frame.addEventListener('load', () => {
        if (frame.getAttribute('src')) wrapper.querySelector('.wise-webview-overlay').classList.add('is-hidden');
      });

      const overlay = document.createElement('div');
      overlay.className = 'wise-webview-overlay';

      body.appendChild(frame);
      body.appendChild(overlay);
      wrapper.appendChild(body);

      WiseWebView.load(wrapper, data);
      return wrapper;
    }

    static patchElement(winEl, data) {
      const wrapper = winEl.querySelector(`[data-control-id="${data.id}"]`);
      if (!wrapper) return;
      const url = String(data.url || '').trim();
      if (wrapper.dataset.url !== url || wrapper.dataset.reloadToken !== String(data.reloadToken || 0)) {
        WiseWebView.load(wrapper, data);
      }
      const body = wrapper.querySelector('.wise-webview-body');
      if (body && data.height) body.style.height = typeof data.height === 'number' ? `${data.height}px` : data.height;
    }

    static gatherValue() {
      return undefined;
    }
  }

  if (isBrowser) {
    window.WiseControlRegistry.WiseWebView = WiseWebView;
  } else {
    module.exports = WiseWebView;
  }
})();
