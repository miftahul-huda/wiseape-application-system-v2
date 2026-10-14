import {
  WiseWindow,
  WiseButton,
  WiseDataTable,
  WiseFrame,
  WiseI18n,
} from '../../../src/runtime/wise.js';

import WinUtilityLinkEdit from './WinUtilityLinkEdit';
import WinWebViewer from './WinWebViewer';

import UtilitiesApiRepository from '../services/UtilitiesApiRepository';
const api = new UtilitiesApiRepository();

const GREY_BUTTON = { background: '#e2e8f0', color: '#334155' };
const DANGER_BUTTON = { background: '#dc2626', color: '#ffffff' };
const PAGE_SIZE = 12;

// Generic list window for one link type ('kong_manager' | 'kafka_manager').
class WinUtilityLinks extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.linkType = options.linkType;
    this.titleKey = options.titleKey;
    this.title = WiseI18n.t(this.titleKey);
    this.appTitle = options.appTitle || WiseI18n.t(this.titleKey);
    this.appIcon = options.appIcon || '🔗';
    this.width = options.width || '80%';
    this.height = options.height || 640;
    this.positionX = options.positionX !== undefined ? options.positionX : 80;
    this.positionY = options.positionY !== undefined ? options.positionY : 50;
    this.rows = []; // full (unpaged) list
  }

  onWindowInit() {
    this.controls = [];

    const bar = new WiseFrame('', {
      id: 'frameLinksToolbar',
      style: { display: 'flex', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap', border: 'none', background: 'transparent', padding: '0 0 8px 0' }
    });
    bar.addControl(new WiseButton(WiseI18n.t('UT_ADD'), { id: 'btnLinkAdd', onClick: () => this.onAddClick() }));
    bar.addControl(new WiseButton(WiseI18n.t('EDIT'), { id: 'btnLinkEdit', onClick: () => this.onEditClick(), style: GREY_BUTTON }));
    bar.addControl(new WiseButton(WiseI18n.t('HAPUS'), { id: 'btnLinkDelete', onClick: () => this.onDeleteClick(), style: DANGER_BUTTON }));
    bar.addControl(new WiseButton(WiseI18n.t('UT_OPEN'), { id: 'btnLinkOpen', onClick: () => this.onOpenClick() }));
    bar.addControl(new WiseButton(WiseI18n.t('REFRESH'), { id: 'btnLinkRefresh', onClick: () => this.loadInitialData(), style: GREY_BUTTON }));
    this.addControl(bar);

    this.dtLinks = new WiseDataTable({
      id: 'dtLinks', pageSize: PAGE_SIZE, maxHeight: '55vh',
      onDataFilterChanged: (size, page) => this.showPage(size, page)
    });
    this.dtLinks.setColumns([
      { dataField: 'name', header: WiseI18n.t('UT_COL_NAME'), width: 220 },
      { dataField: 'url', header: WiseI18n.t('UT_COL_URL'), width: 320 },
      { dataField: 'description', header: WiseI18n.t('KETERANGAN'), width: 260 },
      { dataField: 'defaultMark', header: WiseI18n.t('UT_COL_DEFAULT'), width: 100 }
    ]);
    this.dtLinks.addContextMenu([
      { id: 'open', label: WiseI18n.t('UT_OPEN'), onClick: (row) => this.onOpenClick(row) },
      { id: 'edit', label: WiseI18n.t('EDIT'), onClick: (row) => this.onEditClick(row) },
      { id: 'delete', label: WiseI18n.t('HAPUS'), onClick: (row) => this.onDeleteClick(row) }
    ]);
    this.addControl(this.dtLinks);
    return this;
  }

  async loadInitialData() {
    try {
      const links = await api.listLinks(this.linkType);
      this.rows = links.map((l) => ({ ...l, defaultMark: l.isDefault ? '✔' : '' }));
      this.showPage(this.dtLinks.pageSize, 1);
    } catch (err) {
      this.showInfo(WiseI18n.t('ERROR_KONEKSI_BACKEND'), err.message, 'error');
    }
  }

  showPage(pageSize, page) {
    const size = pageSize || PAGE_SIZE;
    const current = page || 1;
    this.dtLinks.pageSize = size;
    this.dtLinks.currentPage = current;
    this.dtLinks.setData(this.rows.slice((current - 1) * size, current * size), this.rows.length);
  }

  // row from the context menu, otherwise the table's selected row
  pickRow(row) {
    const target = (row && row.id) ? row : this.dtLinks.getSelectedRow();
    if (!target || !target.id) {
      this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('UT_MSG_SELECT_LINK'), 'warning');
      return null;
    }
    return target;
  }

  async onAddClick() {
    await this.openWindow(WinUtilityLinkEdit, { linkId: null, linkType: this.linkType });
  }

  async onEditClick(row) {
    const target = this.pickRow(row);
    if (!target) return;
    await this.openWindow(WinUtilityLinkEdit, { linkId: target.id, linkType: this.linkType });
  }

  async onDeleteClick(row) {
    const target = this.pickRow(row);
    if (!target) return;
    const confirmed = await this.confirm(
      WiseI18n.t('KONFIRMASI_HAPUS'),
      `${WiseI18n.t('APAKAH_ANDA_YAKIN_INGIN_MENGHAPUS')} "${target.name}"?`,
      { type: 'danger', confirmText: WiseI18n.t('YA_HAPUS') }
    );
    if (!confirmed) return;
    try {
      await api.deleteLink(target.id);
      this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('UT_MSG_DELETED'), 'success');
      await this.loadInitialData();
    } catch (err) {
      this.showInfo(WiseI18n.t('GAGAL_MENGHAPUS'), err.message, 'error');
    }
  }

  // Opens the clicked/selected link; with nothing selected falls back to the
  // default link (or the first link when none is marked default).
  async onOpenClick(row) {
    let target = (row && row.id) ? row : this.dtLinks.getSelectedRow();
    if (!target || !target.id) {
      target = this.rows.find((l) => l.isDefault) || this.rows[0];
    }
    if (!target) {
      this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('UT_MSG_NO_LINKS'), 'warning');
      return;
    }
    await this.openWindow(WinWebViewer, {
      linkType: this.linkType,
      titleKey: this.titleKey,
      linkId: target.id,
      linkName: target.name,
      url: target.url
    });
  }
}

export default WinUtilityLinks;
