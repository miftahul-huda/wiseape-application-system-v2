import {
  WiseWindow,
  WiseButton,
  WiseComboBox,
  WiseWebView,
  WiseFrame,
  WiseI18n,
} from '../../../src/runtime/wise.js';

import UtilitiesApiRepository from '../services/UtilitiesApiRepository';
const api = new UtilitiesApiRepository();

const GREY_BUTTON = { background: '#e2e8f0', color: '#334155' };

// Shows one saved link in a WiseWebView; the combobox switches between the
// saved links of the same type.
class WinWebViewer extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.linkType = options.linkType;
    this.linkId = options.linkId ? String(options.linkId) : '';
    this.linkName = options.linkName || '';
    this.initialUrl = options.url || '';
    this.links = [];
    this.title = `${this.linkName} — ${WiseI18n.t(options.titleKey || 'UT_KONG_TITLE')}`;
    this.appIcon = options.appIcon || this.appIcon;
    this.width = options.width || '92%';
    this.height = options.height || '90%';
    this.positionX = options.positionX !== undefined ? options.positionX : 40;
    this.positionY = options.positionY !== undefined ? options.positionY : 30;
    this.titleKey = options.titleKey || 'UT_KONG_TITLE';
  }

  onWindowInit() {
    this.controls = [];

    const bar = new WiseFrame('', {
      id: 'frameWebViewerBar',
      style: { display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', border: 'none', background: 'transparent', padding: '0 0 8px 0' }
    });
    this.cmbLink = new WiseComboBox([{ value: this.linkId, label: this.linkName }], {
      id: 'cmbViewerLink', label: WiseI18n.t('UT_LBL_VIEWER_LINK'), value: this.linkId, style: { width: '420px', maxWidth: '100%' },
      onChange: this.onLinkChanged.bind(this)
    });
    const btnReload = new WiseButton(WiseI18n.t('UT_RELOAD'), {
      id: 'btnViewerReload', onClick: this.onReloadClick.bind(this), style: GREY_BUTTON,
      label: ' ' // aligns the button with the combobox (which has a caption)
    });
    bar.addControl(this.cmbLink);
    bar.addControl(btnReload);
    this.addControl(bar);

    this.webView = new WiseWebView({ id: 'webView', url: this.initialUrl, height: '72vh' });
    this.addControl(this.webView);
    return this;
  }

  async onShow() {
    this.visible = true;
    try {
      this.links = await api.listLinks(this.linkType);
      if (this.links.length === 0) return;
      this.cmbLink.setItems(this.links.map((l) => ({ value: String(l.id), label: l.name })));
      this.cmbLink.setValue(this.links.some((l) => String(l.id) === this.linkId) ? this.linkId : '');
    } catch (err) {
      // the page itself is already shown; only the switcher is unavailable
      this.showInfo(WiseI18n.t('ERROR_KONEKSI_BACKEND'), err.message, 'error');
    }
  }

  onLinkChanged() {
    const link = this.links.find((l) => String(l.id) === String(this.cmbLink.value));
    if (!link) return;
    this.linkId = String(link.id);
    this.linkName = link.name;
    this.title = `${link.name} — ${WiseI18n.t(this.titleKey)}`;
    this.webView.setUrl(link.url);
  }

  onReloadClick() {
    this.webView.reload();
  }
}

export default WinWebViewer;
