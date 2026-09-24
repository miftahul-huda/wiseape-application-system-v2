const WiseWindow = require('../../../system/WiseWindow');
const WiseLabel = require('../../../system/controls/WiseLabel');
const WiseComboBox = require('../../../system/controls/WiseComboBox');
const WiseFileUpload = require('../../../system/controls/WiseFileUpload');
const WiseCardGroup = require('../../../system/controls/WiseCardGroup');
const ApiAuthRepository = require('../../../system/ApiAuthRepository');
const ApiBackgroundImageRepository = require('../repositories/ApiBackgroundImageRepository');

const authRepository = new ApiAuthRepository();
const backgroundImageRepository = new ApiBackgroundImageRepository();

function formatUploadedAt(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

class WinSettings extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = 'Settings';
    this.appTitle = options.appTitle || 'Settings';
    this.appIcon = options.appIcon || '⚙';
    this.width = '480';
    this.height = '620';
    this.themes = options.themes || [];
  }

  onWindowInit() {
    this.controls = [];

    this.addControl(new WiseLabel('Desktop Preset', { id: 'lblThemeHeading', icon: '🎨', style: { fontSize: 16, fontWeight: 700, color: '#111827' } }));
    this.addControl(new WiseComboBox(
      this.themes.map((theme) => ({ value: theme.id, label: theme.name })),
      {
        id: 'cmbTheme',
        value: this.system ? this.system.activeThemeId : undefined,
        onChange: this.onThemeChange.bind(this),
      }
    ));

    this.addControl(new WiseLabel('Background Image', { id: 'lblBackgroundHeading', icon: '🖼️', style: { fontSize: 16, fontWeight: 700, marginTop: '12px', color: '#111827' } }));
    this.addControl(new WiseFileUpload('Choose Image...', {
      id: 'uploadBackground',
      value: this.system ? this.system.backgroundImage : undefined,
      onChange: this.onBackgroundChange.bind(this),
    }));

    this.addControl(new WiseLabel('Previously Uploaded', { id: 'lblGalleryHeading', style: { fontSize: 13, fontWeight: 700, marginTop: '14px', color: '#374151' } }));
    this.addControl(new WiseCardGroup({
      id: 'cgBackgroundGallery',
      pageSize: 8,
      pageSizeOptions: [8, 16],
      imageField: 'url',
      textField: 'uploadedLabel',
      onDataFilterChanged: this.onGalleryFilterChanged.bind(this),
      onRowSelect: this.onGallerySelect.bind(this),
    }));

    return this;
  }

  onThemeChange() {
    if (!this.system) return;
    // setActiveTheme() already resets this.system's background to the new
    // theme's own defaultBackground internally -- just keep the preview
    // and the saved preference in sync with whatever it landed on.
    const theme = this.system.setActiveTheme(this.cmbTheme.value);
    this.uploadBackground.value = theme.defaultBackground || '';
    this.persistPreferences({ themeId: this.cmbTheme.value, backgroundImage: theme.defaultBackground || null });
  }

  // Shared by a fresh upload, picking one from the gallery, and (indirectly,
  // via onThemeChange) a theme's own default -- keeps the system background,
  // the file-upload preview, and the saved preference all in sync no matter
  // which of those triggered the change.
  applyBackground(url) {
    if (this.system) {
      this.system.setBackgroundImage(url);
    }
    this.uploadBackground.value = url || '';
    this.persistPreferences({ backgroundImage: url || null });
  }

  async onBackgroundChange() {
    const url = this.uploadBackground.value;
    this.applyBackground(url);

    const session = this.system && this.system.currentSession;
    if (!session || !session.token || !url) return;

    try {
      await backgroundImageRepository.add(session.token, url);
      // Jump to page 1 so the just-added image (newest first) is visible.
      await this.applyGalleryPage(this.cgBackgroundGallery.pageSize, 1);
    } catch (error) {
      console.warn('[WAS] Failed to record uploaded background:', error.message);
    }
  }

  async applyGalleryPage(pageSize, page) {
    const session = this.system && this.system.currentSession;
    if (!session || !session.token) {
      this.cgBackgroundGallery.setData([], 0);
      return;
    }

    const offset = (page - 1) * pageSize;
    const { rows, totalCount } = await backgroundImageRepository.list(session.token, { limit: pageSize, offset });
    this.cgBackgroundGallery.pageSize = pageSize;
    this.cgBackgroundGallery.currentPage = page;
    this.cgBackgroundGallery.setData(
      rows.map((row) => ({ ...row, uploadedLabel: formatUploadedAt(row.createdAt) })),
      totalCount
    );
  }

  async onGalleryFilterChanged(pageSize, page) {
    await this.applyGalleryPage(pageSize, page);
  }

  onGallerySelect(row) {
    this.applyBackground(row.url);
  }

  persistPreferences(prefs) {
    const session = this.system && this.system.currentSession;
    if (!session || !session.token) return;

    // Mutate the in-memory session user immediately (not just after the
    // async save resolves) -- dispatchControlEvent echoes this same object
    // back as `theme`/`backgroundImage` on every event, including this one,
    // so without this the change would appear to "not take" until the
    // request-scoped session is next re-resolved from the DB. See
    // docs/DEVELOPMENT_GUIDE.md §8.
    if (session.user) {
      if (prefs.themeId !== undefined) session.user.themeId = prefs.themeId;
      if (prefs.backgroundImage !== undefined) session.user.backgroundImage = prefs.backgroundImage;
    }

    authRepository.updatePreferences(session.token, prefs)
      .catch((error) => console.warn('[WAS] Failed to save preferences:', error.message));
  }

  async loadInitialData() {
    await this.applyGalleryPage(this.cgBackgroundGallery.pageSize, this.cgBackgroundGallery.currentPage);
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinSettings;
