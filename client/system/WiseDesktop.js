class WiseDesktop {
  constructor(root = null) {
    this.root = root;
    this.menus = [];

    let displayName = 'User';
    try {
      const userData = localStorage.getItem('was_user');
      if (userData) {
        const parsed = JSON.parse(userData);
        displayName = parsed.name || parsed.username || 'User';
      }
    } catch (e) {
      // fallback
    }

    this.topBar = {
      left: [displayName],
      // The clock isn't a static string here -- it's rendered and kept
      // live separately (see renderDesktop/startClock), since a fixed
      // string obviously never changes. The Windows menu, theme toggle,
      // and logout button are likewise built directly in renderDesktop.
      right: [],
    };
    this.theme = 'macos';
    this.windowStack = [];
    this.onIconClick = null;
    this.clockInterval = null;
  }

  // Builds the desktop snapshot and, in the browser (when a DOM `root` is
  // attached), renders it. Server-side callers only ever use the snapshot.
  // `menus` is the (already role-filtered) menu tree: a mix of `group`
  // nodes (folders, with `children`) and `item` nodes (link to an app via
  // `appId`).
  run(menus = []) {
    this.menus = menus;
    this.windowStack = [];

    const snapshot = this.buildSnapshot(menus);

    if (this.root) {
      this.renderDesktop();
    }

    return snapshot;
  }

  buildSnapshot(menus = []) {
    const leafItems = this.flattenMenuItems(menus);
    return {
      theme: this.theme,
      menus,
      topBar: this.topBar,
      dock: leafItems.map((item) => ({
        id: item.appId,
        title: item.label,
        icon: this.getAppIcon(item),
      })),
    };
  }

  // Recursively collects every `item` (leaf) node across a menu tree,
  // depth-first, skipping `group` nodes themselves -- used for the dock
  // (which never shows folders) and the top-level Launchpad view.
  flattenMenuItems(nodes = []) {
    const result = [];
    nodes.forEach((node) => {
      if (node.type === 'group') {
        result.push(...this.flattenMenuItems(node.children || []));
      } else {
        result.push(node);
      }
    });
    return result;
  }

  // Calls onIconClick (which kicks off runApplication's fetch round trip)
  // and, for as long as that's in flight, bounces `glyphEl` -- macOS-dock-
  // style feedback that a launch is happening even before the window
  // actually shows up. Since it's tied to the real launch promise rather
  // than a fixed timer, it can't outlast (or undershoot) how long the
  // round trip actually takes -- a slow app load just bounces longer.
  launchApp(node, glyphEl) {
    if (typeof this.onIconClick !== 'function') return;

    if (glyphEl) glyphEl.classList.add('icon-launching');
    const result = this.onIconClick(node);
    if (glyphEl && result && typeof result.finally === 'function') {
      result.finally(() => glyphEl.classList.remove('icon-launching'));
    }
  }

  onApplicationIconClick(app) {
    return {
      event: 'onApplicationIconClick',
      app,
      timestamp: new Date().toISOString(),
    };
  }

  // Accepts either a menu node ({icon, label}) or a running application
  // object ({appIcon, appTitle}, used by renderWindow/minimize) so callers
  // don't need to normalize shapes before calling in.
  getAppIcon(entity) {
    const icon = entity.icon || entity.appIcon;
    if (icon) return icon;
    const label = entity.label || entity.appTitle || '';
    return label.charAt(0).toUpperCase() || '◫';
  }

  // Renders a crisp, consistent SVG glyph for known app icon keys, falling
  // back to the raw character (e.g. a letter) for anything unmapped.
  getIconMarkup(entity) {
    const icons = {
      '▣': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"></rect><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"></rect><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"></rect><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"></rect></svg>',
      '📁': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"></path></svg>',
      '✦': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.1 6.9 6.9 2.1-6.9 2.1L12 20.5l-2.1-6.9-6.9-2.1 6.9-2.1L12 2.5z"></path></svg>',
      '⚙': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"></circle><rect x="10.7" y="1" width="2.6" height="3.4" rx="1" fill="currentColor"></rect><rect x="10.7" y="19.6" width="2.6" height="3.4" rx="1" fill="currentColor"></rect><rect x="1" y="10.7" width="3.4" height="2.6" rx="1" fill="currentColor"></rect><rect x="19.6" y="10.7" width="3.4" height="2.6" rx="1" fill="currentColor"></rect><rect x="10.7" y="1" width="2.6" height="3.4" rx="1" fill="currentColor" transform="rotate(45 12 12)"></rect><rect x="10.7" y="19.6" width="2.6" height="3.4" rx="1" fill="currentColor" transform="rotate(45 12 12)"></rect><rect x="1" y="10.7" width="3.4" height="2.6" rx="1" fill="currentColor" transform="rotate(45 12 12)"></rect><rect x="19.6" y="10.7" width="3.4" height="2.6" rx="1" fill="currentColor" transform="rotate(45 12 12)"></rect></svg>',
      '🎛': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="5" x2="4" y2="19"></line><circle cx="4" cy="10" r="2" fill="currentColor" stroke="none"></circle><line x1="12" y1="5" x2="12" y2="19"></line><circle cx="12" cy="15" r="2" fill="currentColor" stroke="none"></circle><line x1="20" y1="5" x2="20" y2="19"></line><circle cx="20" cy="8" r="2" fill="currentColor" stroke="none"></circle></svg>',
    };

    const key = this.getAppIcon(entity);
    return icons[key] || `<span>${key}</span>`;
  }

  // Icons are meant to live as files (applications/<App>/assets/icons/
  // icon.svg, served by /app-assets/:appId/icon.svg -- see app.js), not in
  // the database: getIconMarkup() above always renders the DB/menu-table
  // glyph first (so there's never a blank icon), and this probes for a real
  // file in the background, swapping it in only once it's confirmed to
  // actually load. `container` is the already-rendered glyph/dock-item
  // element holding that fallback markup.
  upgradeIcon(container, entity) {
    if (!container || !entity) return;
    const appId = entity.appId || entity.appID;
    if (!appId) return;

    const probe = new Image();
    probe.onload = () => {
      const img = document.createElement('img');
      img.src = probe.src;
      img.alt = '';
      img.className = 'wise-app-icon-img';
      container.innerHTML = '';
      container.appendChild(img);
    };
    probe.src = `/app-assets/${appId}/icon.svg`;
  }

  applyTheme(theme) {
    if (!theme) return;

    this.theme = theme.id;
    this.themeColors = theme;

    if (this.root && typeof document !== 'undefined') {
      const target = document.documentElement;
      target.style.setProperty('--bg1', theme.bg1);
      target.style.setProperty('--bg2', theme.bg2);
      target.style.setProperty('--accent', theme.accent);
      target.style.setProperty('--accent-dark', theme.accentDark);
    }
  }

  applyBackgroundImage(url) {
    this.backgroundImage = url || null;

    if (this.root && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--desktop-image', this.backgroundImage ? `url("${this.backgroundImage}")` : 'none');
    }
  }

  // Keeps `clockEl` showing the actual current date/time, ticking every
  // second. Clears any previous interval first so calling renderDesktop()
  // more than once (a fresh DOM tree each time) can't leak timers updating
  // an element that's no longer on the page.
  startClock(clockEl) {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }

    const update = () => {
      clockEl.textContent = this.formatClock(new Date());
    };

    update();
    this.clockInterval = setInterval(update, 1000);
  }

  formatClock(date) {
    const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
    const day = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    hours %= 12;
    if (hours === 0) hours = 12;
    return `${weekday} ${day} ${hours}:${minutes} ${period}`;
  }

  // ---- Browser-only rendering below (requires `root` and `document`) ----

  // Topbar "Windows" menu: lists every currently open window (queried live
  // off the DOM, not from any tracked list, so it's always accurate even
  // as windows open/close/minimize) and activates whichever one is picked
  // via the same win.__wiseActivate hook renderWindow() wires up for its
  // own click handler and taskbar minimize-restore icon.
  buildWindowsMenu(root) {
    const item = document.createElement('div');
    item.className = 'windows-menu-item';

    const label = document.createElement('span');
    label.className = 'windows-menu-label';
    label.textContent = '🗔 Windows';
    item.appendChild(label);

    // Appended to document.body (not `item`) rather than nested inside the
    // topbar: .topbar has its own transform + backdrop-filter, which makes
    // it a stacking context of its own -- so a z-index on a descendant only
    // wins against *other topbar content*, not against .window (z-index 3),
    // since the whole topbar subtree stacks as one unit at the topbar's own
    // z-index (2), below every window. Same fix WiseIconMenu's floating
    // tooltip already uses for the same reason.
    const dropdown = document.createElement('div');
    dropdown.className = 'windows-menu-dropdown';

    const positionDropdown = () => {
      const rect = label.getBoundingClientRect();
      dropdown.style.top = `${Math.round(rect.bottom + 8)}px`;
      // Clamp so a long window title list doesn't overflow past the right
      // edge of the viewport when the label sits near it.
      const maxLeft = window.innerWidth - 320 - 12;
      dropdown.style.left = `${Math.round(Math.min(rect.left, Math.max(maxLeft, 12)))}px`;
    };

    const closeDropdown = () => {
      item.classList.remove('open');
      dropdown.remove();
      document.removeEventListener('mousedown', onOutsideClick, true);
      window.removeEventListener('resize', positionDropdown);
    };

    const onOutsideClick = (event) => {
      if (!item.contains(event.target) && !dropdown.contains(event.target)) closeDropdown();
    };

    const buildList = () => {
      dropdown.innerHTML = '';
      const openWindows = Array.from(root.querySelectorAll('.window'));

      if (openWindows.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'windows-menu-empty';
        empty.textContent = 'No windows open';
        dropdown.appendChild(empty);
        return;
      }

      openWindows.forEach((winEl) => {
        const entry = document.createElement('div');
        entry.className = 'windows-menu-entry';

        const isMinimized = winEl.style.display === 'none';
        const isActive = !isMinimized && !winEl.classList.contains('window-inactive');
        if (isActive) entry.classList.add('active');

        // .window-title already holds the icon markup + title text together
        // (see renderWindow) -- reuse it verbatim rather than trying to pick
        // it back apart into separate icon/label pieces.
        const titleEl = winEl.querySelector('.window-title');
        const entryLabel = document.createElement('div');
        entryLabel.className = 'windows-menu-entry-label';
        entryLabel.innerHTML = titleEl ? titleEl.innerHTML : (winEl.dataset.appId || 'Window');
        entry.appendChild(entryLabel);

        if (isMinimized) {
          const badge = document.createElement('div');
          badge.className = 'windows-menu-entry-badge';
          badge.textContent = 'Minimized';
          entry.appendChild(badge);
        }

        entry.addEventListener('click', (event) => {
          event.stopPropagation();
          if (typeof winEl.__wiseActivate === 'function') {
            winEl.__wiseActivate();
          }
          closeDropdown();
        });

        dropdown.appendChild(entry);
      });
    };

    label.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = item.classList.contains('open');
      if (isOpen) {
        closeDropdown();
        return;
      }
      buildList();
      positionDropdown();
      document.body.appendChild(dropdown);
      item.classList.add('open');
      document.addEventListener('mousedown', onOutsideClick, true);
      window.addEventListener('resize', positionDropdown);
    });

    return item;
  }

  renderDesktop() {
    const root = document.createElement('div');
    root.className = 'desktop';

    const leftItems = this.topBar.left.map((item) => `<span>${item}</span>`).join('');
    const rightItems = this.topBar.right.map((item) => `<span>${item}</span>`).join('');

    root.innerHTML = `
      <div class="desktop-wallpaper"></div>
      <div class="topbar">
        <div class="left">${leftItems}</div>
        <div class="right">${rightItems}</div>
      </div>
      <div class="app-grid"></div>
      <div class="taskbar"></div>
    `;

    const grid = root.querySelector('.app-grid');
    const dock = root.querySelector('.taskbar');
    const rightBar = root.querySelector('.topbar .right');

    if (rightBar) {
      rightBar.appendChild(this.buildWindowsMenu(root));

      const themeToggle = document.createElement('span');
      themeToggle.className = 'theme-toggle-item';
      themeToggle.title = 'Toggle Dark/Light Theme';
      themeToggle.style.cursor = 'pointer';

      const isDark = document.body.classList.contains('dark-theme') || localStorage.getItem('wise_theme') === 'dark';
      if (isDark) {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '🌙 Dark';
      } else {
        themeToggle.textContent = '☀️ Light';
      }

      themeToggle.addEventListener('click', () => {
        const nowDark = document.body.classList.toggle('dark-theme');
        if (nowDark) {
          localStorage.setItem('wise_theme', 'dark');
          themeToggle.textContent = '🌙 Dark';
        } else {
          localStorage.setItem('wise_theme', 'light');
          themeToggle.textContent = '☀️ Light';
        }
      });
      rightBar.appendChild(themeToggle);

      const clock = document.createElement('span');
      clock.className = 'topbar-clock';
      rightBar.appendChild(clock);
      this.startClock(clock);

      const logout = document.createElement('span');
      logout.className = 'logout-item';
      logout.textContent = 'Logout';
      logout.addEventListener('click', () => {
        const token = localStorage.getItem('was_token');
        localStorage.removeItem('was_token');
        localStorage.removeItem('was_user');
        if (token) {
          fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
            .catch(() => { })
            .finally(() => location.reload());
        } else {
          location.reload();
        }
      });
      rightBar.appendChild(logout);
    }

    const launchpadTrigger = document.createElement('div');
    launchpadTrigger.className = 'dock-item launchpad-trigger';
    launchpadTrigger.dataset.label = 'Launchpad';
    launchpadTrigger.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="5" height="5" rx="1.2"></rect><rect x="9.5" y="3" width="5" height="5" rx="1.2"></rect><rect x="16" y="3" width="5" height="5" rx="1.2"></rect><rect x="3" y="9.5" width="5" height="5" rx="1.2"></rect><rect x="9.5" y="9.5" width="5" height="5" rx="1.2"></rect><rect x="16" y="9.5" width="5" height="5" rx="1.2"></rect><rect x="3" y="16" width="5" height="5" rx="1.2"></rect><rect x="9.5" y="16" width="5" height="5" rx="1.2"></rect><rect x="16" y="16" width="5" height="5" rx="1.2"></rect></svg>';
    launchpadTrigger.addEventListener('click', () => this.openMenuOverlay(root, this.menus, 'Launchpad'));
    dock.appendChild(launchpadTrigger);

    const separator = document.createElement('div');
    separator.className = 'dock-separator';
    dock.appendChild(separator);

    // Desktop grid: the top-level menu tree as-is (folders and items mixed).
    // Removed per user request to remove shortcut menu on desktop.

    // Dock: every item (leaf) across the whole tree, flattened -- folders
    // don't appear here, matching how a real dock has no concept of them.
    // data-app-id lets openMenuOverlay's own click handler find the
    // matching dock icon to bounce, since a Launchpad item disappears
    // (the overlay closes) the instant it's clicked.
    this.flattenMenuItems(this.menus).forEach((item) => {
      const handleClick = () => {
        this.onApplicationIconClick(item);
        this.launchApp(item, dockItem);
      };

      const dockItem = document.createElement('div');
      dockItem.className = 'dock-item';
      dockItem.dataset.appId = item.appId;
      dockItem.innerHTML = this.getIconMarkup(item);
      dockItem.dataset.label = item.label;
      dockItem.addEventListener('click', handleClick);
      dock.appendChild(dockItem);
      this.upgradeIcon(dockItem, item);
    });

    this.attachDockMagnify(dock);

    this.root.innerHTML = '';
    this.root.appendChild(root);
  }

  // macOS-style dock magnification: icons grow the closer the pointer gets
  // to their center. Growing real width/height (not a transform: scale)
  // makes the flex layout push neighbors apart instead of overlapping them,
  // and `align-items: flex-start` on .taskbar keeps everything left-anchored
  // so icons push outward as they grow, exactly like a vertical macOS dock.
  attachDockMagnify(dock) {
    const BASE_SIZE = 50;
    const MAX_SIZE = 78;
    const RADIUS = 110;

    dock.addEventListener('mousemove', (event) => {
      dock.querySelectorAll('.dock-item').forEach((item) => {
        const rect = item.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(event.clientY - center);
        const size = distance < RADIUS
          ? BASE_SIZE + (MAX_SIZE - BASE_SIZE) * (1 - distance / RADIUS)
          : BASE_SIZE;
        item.style.width = `${size}px`;
        item.style.height = `${size}px`;
      });
    });

    dock.addEventListener('mouseleave', () => {
      dock.querySelectorAll('.dock-item').forEach((item) => {
        item.style.width = '';
        item.style.height = '';
      });
    });
  }

  // Fullscreen overlay listing a set of menu nodes -- used both for the
  // Launchpad (the whole top-level tree) and for a folder's contents (opened
  // from the desktop grid or from within another overlay, which stacks a
  // new overlay on top of the one already showing). Clicking a nested
  // folder opens another overlay on top; clicking the backdrop, pressing
  // Escape, or the Back button (`showBack: true`) all close just the top
  // overlay, revealing whatever's underneath (the desktop, or the parent
  // folder). Clicking an actual app, however, closes the WHOLE stack --
  // `closers` is the shared array of every currently-open level's own
  // closeOverlay, threaded through the recursive openMenuOverlay() calls so
  // a launch from three folders deep still dismisses everything above the
  // desktop, not just the folder it happened in.
  openMenuOverlay(root, items, title, { showBack = false, closers = [] } = {}) {
    const overlay = document.createElement('div');
    overlay.className = 'launchpad-overlay';

    const closeOverlay = () => {
      overlay.style.opacity = '0';
      gridWrap.style.transform = 'scale(0.94)';
      let overlayRemoved = false;
      const doRemoveOverlay = () => { if (!overlayRemoved) { overlayRemoved = true; overlay.remove(); } };
      overlay.addEventListener('transitionend', doRemoveOverlay, { once: true });
      setTimeout(doRemoveOverlay, 350);
      document.removeEventListener('keydown', onKeydown);
      const index = closers.indexOf(closeOverlay);
      if (index !== -1) closers.splice(index, 1);
    };
    closers.push(closeOverlay);

    const closeAll = () => {
      [...closers].forEach((close) => close());
    };

    const onKeydown = (event) => {
      if (event.key === 'Escape') closeOverlay();
    };

    if (showBack) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'launchpad-back';
      back.textContent = '← Back';
      back.addEventListener('click', (event) => {
        event.stopPropagation();
        closeOverlay();
      });
      overlay.appendChild(back);
    }

    if (title) {
      const heading = document.createElement('div');
      heading.className = 'launchpad-title';
      heading.textContent = title;
      overlay.appendChild(heading);
    }

    const gridWrap = document.createElement('div');
    gridWrap.className = 'launchpad-grid';

    (items || []).forEach((node) => {
      const item = document.createElement('div');
      item.className = 'launchpad-app';
      item.innerHTML = `
        <div class="glyph">${this.getIconMarkup(node)}</div>
        <div class="label">${node.label}</div>
      `;
      this.upgradeIcon(item.querySelector('.glyph'), node);
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        if (node.type === 'group') {
          this.openMenuOverlay(root, node.children || [], node.label, { showBack: true, closers });
          return;
        }
        this.onApplicationIconClick(node);
        // This overlay item is about to be removed (closeAll below), so
        // bounce the matching dock icon instead -- it's the one thing that
        // stays on screen for the whole wait.
        const dockEl = root.querySelector(`.taskbar .dock-item[data-app-id="${node.appId}"]`);
        this.launchApp(node, dockEl || item.querySelector('.glyph'));
        closeAll();
      });
      gridWrap.appendChild(item);
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeOverlay();
    });

    overlay.appendChild(gridWrap);
    root.appendChild(overlay);
    document.addEventListener('keydown', onKeydown);

    void overlay.offsetWidth;
    overlay.style.opacity = '1';
    gridWrap.style.transform = 'scale(1)';
  }

  // Modal alert (icon + title + message + OK) queued by WiseWindow.showInfo
  // / WiseApplication.showInfo and delivered once via a window's `info`
  // field -- either right when the window first appears (renderWindow) or
  // as the result of a later control event (sendControlEvent). It's a
  // desktop-wide overlay like openMenuOverlay, not scoped to one window,
  // since alerts read fine centered on screen regardless of where the
  // triggering window happens to be.
  showInfoDialog(info) {
    const desktop = this.root.querySelector('.desktop');
    if (!desktop) return;

    const icons = {
      information: { glyph: '<circle cx="12" cy="12" r="9"></circle><line x1="12" y1="11" x2="12" y2="16"></line><circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none"></circle>', className: 'info-dialog-icon-information' },
      success: { glyph: '<circle cx="12" cy="12" r="9"></circle><polyline points="8 12.5 10.5 15 16 9"></polyline>', className: 'info-dialog-icon-success' },
      warning: { glyph: '<path d="M12 3.5 2.5 20h19L12 3.5z"></path><line x1="12" y1="9.5" x2="12" y2="14"></line><circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none"></circle>', className: 'info-dialog-icon-warning' },
      error: { glyph: '<circle cx="12" cy="12" r="9"></circle><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line>', className: 'info-dialog-icon-error' },
    };
    const icon = icons[info.type] || icons.information;

    const overlay = document.createElement('div');
    overlay.className = 'info-dialog-overlay';

    const card = document.createElement('div');
    card.className = 'info-dialog-card';

    const closeDialog = () => {
      overlay.style.opacity = '0';
      card.style.transform = 'scale(0.94)';
      let dialogRemoved = false;
      const doRemoveDialog = () => { if (!dialogRemoved) { dialogRemoved = true; overlay.remove(); } };
      overlay.addEventListener('transitionend', doRemoveDialog, { once: true });
      setTimeout(doRemoveDialog, 350);
      document.removeEventListener('keydown', onKeydown);
    };

    const onKeydown = (event) => {
      if (event.key === 'Escape') closeDialog();
    };

    card.innerHTML = `
      <div class="info-dialog-icon ${icon.className}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.glyph}</svg>
      </div>
      <div class="info-dialog-title"></div>
      <div class="info-dialog-message"></div>
      <button type="button" class="info-dialog-ok">OK</button>
    `;
    card.querySelector('.info-dialog-title').textContent = info.title || '';
    card.querySelector('.info-dialog-message').textContent = info.message || '';
    card.querySelector('.info-dialog-ok').addEventListener('click', closeDialog);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeDialog();
    });

    overlay.appendChild(card);
    desktop.appendChild(overlay);
    document.addEventListener('keydown', onKeydown);

    void overlay.offsetWidth;
    overlay.style.opacity = '1';
    card.style.transform = 'scale(1)';
  }

  renderWindow(application, startupResult = null) {
    const desktop = this.root.querySelector('.desktop');
    if (!desktop) return;

    const dock = desktop.querySelector('.taskbar');

    const windowData = startupResult && startupResult.window;

    const formatDimension = (val, defaultPx) => {
      if (val === undefined || val === null || val === '') return `${defaultPx}px`;
      if (typeof val === 'number') return `${val}px`;
      const trimmed = String(val).trim();
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
      return trimmed;
    };

    const widthVal = windowData?.width ?? 640;
    const heightVal = windowData?.height ?? 420;
    let positionXVal = windowData?.positionX ?? 330;
    let positionYVal = windowData?.positionY ?? 110;
    // These may be overridden to resolved pixel values when centering is active.
    let resolvedWidth  = widthVal;
    let resolvedHeight = heightVal;

    // Center the window when explicitly requested (centered: true) OR when a
    // percentage size is used -- both cases mean "fill a fraction of the
    // desktop and sit in the middle".
    const wantsCentered = windowData?.centered
      || (typeof widthVal === 'string' && widthVal.endsWith('%'))
      || (typeof heightVal === 'string' && heightVal.endsWith('%'));

    if (wantsCentered) {
      // The taskbar is a vertical sidebar on the left:
      //   left: 14px, width: 68px  →  usable area starts at ~82px from the left.
      const TASKBAR_LEFT = 82;
      const desktopRect = desktop.getBoundingClientRect();
      const usableWidth  = desktopRect.width  - TASKBAR_LEFT;
      const usableHeight = desktopRect.height;

      // Resolve window width/height to pixels so we can compute the offset.
      // We also use these resolved values for the actual CSS dimensions so that
      // a "90%" window doesn't accidentally overflow by being 90% of 100vw
      // instead of 90% of the usable (taskbar-excluded) area.
      const winW = typeof widthVal === 'string' && widthVal.endsWith('%')
        ? Math.round(usableWidth  * parseFloat(widthVal)  / 100)
        : (parseFloat(widthVal) || 640);
      const winH = typeof heightVal === 'string' && heightVal.endsWith('%')
        ? Math.round(usableHeight * parseFloat(heightVal) / 100)
        : (parseFloat(heightVal) || 420);

      resolvedWidth  = winW;
      resolvedHeight = winH;
      positionXVal = Math.round(TASKBAR_LEFT + (usableWidth  - winW)  / 2);
      positionYVal = Math.round((usableHeight - winH) / 2);
    }

    const title = (windowData && windowData.title) || application.appTitle;

    const win = document.createElement('div');
    win.className = 'window';
    win.dataset.appId = application.appID;
    win.dataset.windowId = windowData ? windowData.windowId : '';
    win.style.left = formatDimension(positionXVal, 330);
    win.style.top = formatDimension(positionYVal, 110);
    win.style.width = formatDimension(resolvedWidth, 640);
    win.style.height = formatDimension(resolvedHeight, 420);
    win.style.opacity = '0';
    win.style.transform = 'scale(0.92)';


    win.innerHTML = `
      <div class="window-header">
        <div class="window-controls">
          <button type="button" class="window-action close" aria-label="Close window">&times;</button>
          <button type="button" class="window-action minimize" aria-label="Minimize window">&minus;</button>
          <button type="button" class="window-action maximize" aria-label="Maximize window">&plus;</button>
        </div>
        <div class="window-title">${this.getIconMarkup(application)} ${title}</div>
        <div></div>
      </div>
      <div class="window-body">
        <div class="app-shell"></div>
      </div>
      <div class="resize-handle" aria-hidden="true"></div>
    `;

    const body = win.querySelector('.app-shell');
    const controls = windowData && Array.isArray(windowData.controls) ? windowData.controls : [];

    if (controls.length > 0) {
      controls.forEach((control) => body.appendChild(this.wrapControl(control, application.appID, win.dataset.windowId)));
    } else {
      const empty = document.createElement('p');
      empty.textContent = `"${application.appTitle}" did not return any window content.`;
      body.appendChild(empty);
    }

    const header = win.querySelector('.window-header');
    const closeBtn = win.querySelector('.close');
    const minimizeBtn = win.querySelector('.minimize');
    const maximizeBtn = win.querySelector('.maximize');
    const resizeHandle = win.querySelector('.resize-handle');

    // Marks `win` as the active window and dims all other windows.
    const setActiveWindow = () => {
      desktop.querySelectorAll('.window').forEach((w) => w.classList.add('window-inactive'));
      win.classList.remove('window-inactive');
    };

    let minimizedItem = null;

    const removeMinimizedItem = () => {
      if (minimizedItem) {
        minimizedItem.remove();
        minimizedItem = null;
      }
    };

    // Single entry point for "make this the frontmost, visible, active
    // window" -- restoring it first if it was minimized. Used by this
    // window's own click handler below, by its taskbar minimized-icon
    // restore handler, AND (via the __wiseActivate hook) by the topbar's
    // Windows menu, so all three ways of switching to a window share one
    // implementation instead of drifting out of sync.
    const activateWindow = () => {
      if (win.style.display === 'none') {
        removeMinimizedItem();
        win.style.display = 'block';
        void win.offsetWidth;
        win.style.opacity = '1';
        win.style.transform = 'scale(1) translateY(0)';
      }
      // appendChild() detaches and reinserts win even when it's already the
      // last child (a no-op reorder) -- and that reattachment resets the
      // scrollTop of every scrollable descendant (e.g. .window-body), even
      // though its on-screen position never actually changes. Skipping the
      // call when win is already frontmost avoids that side effect, which
      // otherwise reset the window's scroll position on every single click.
      if (desktop.lastElementChild !== win) {
        desktop.appendChild(win);
      }
      setActiveWindow();
    };
    win.__wiseActivate = activateWindow;

    // Bring to front + activate whenever the user clicks anywhere on the window.
    // Moving win's DOM node while a mousedown→mouseup press is in flight makes
    // the browser cancel the click event that would otherwise follow -- not
    // just for native <button>/<input> elements, but for any custom control
    // that reacts to 'click' on a plain element (WiseDataTable rows,
    // WiseCardGroup cards, ...). A setTimeout(0) still fires within a few
    // milliseconds -- comfortably before a real mouseup (tens to hundreds of
    // milliseconds after mousedown for an actual person), so it does NOT
    // avoid the cancellation; it only happened to look fixed against
    // Playwright's near-instant synthetic clicks. Listening on 'click'
    // instead sidesteps the problem entirely: by the time 'click' fires, the
    // browser has already committed to it (and any control's own click
    // handler -- sendControlEvent etc. -- has already run, since bubbling
    // reaches this outer listener last), so reparenting here can no longer
    // cancel anything.
    win.addEventListener('mousedown', () => {
      setActiveWindow();
    });
    win.addEventListener('click', () => {
      if (desktop.lastElementChild !== win) {
        desktop.appendChild(win);
      }
    });

    closeBtn.addEventListener('click', () => {
      removeMinimizedItem();
      win.style.opacity = '0';
      win.style.transform = 'scale(0.92)';
      // Fallback: if transitionend never fires (e.g. transition was blocked or
      // the window was already at these values), force-remove after the
      // transition duration + a small buffer.
      let removed = false;
      const doRemove = () => {
        if (!removed) { removed = true; win.remove(); }
      };
      win.addEventListener('transitionend', doRemove, { once: true });
      setTimeout(doRemove, 350);
    });

    minimizeBtn.addEventListener('click', () => {
      win.style.opacity = '0';
      win.style.transform = 'scale(0.92) translateY(40px)';
      let hidden = false;
      const doHide = () => {
        if (!hidden) { hidden = true; win.style.display = 'none'; }
      };
      win.addEventListener('transitionend', doHide, { once: true });
      setTimeout(doHide, 350);

      if (!minimizedItem && dock) {
        minimizedItem = document.createElement('div');
        minimizedItem.className = 'dock-item';
        minimizedItem.innerHTML = this.getIconMarkup(application);
        minimizedItem.title = title;
        this.upgradeIcon(minimizedItem, application);
        minimizedItem.addEventListener('click', () => {
          activateWindow();
        });
        dock.appendChild(minimizedItem);
      }
    });

    maximizeBtn.addEventListener('click', () => {
      win.style.transition = 'opacity 0.22s var(--spring), transform 0.22s var(--spring), left 0.28s var(--spring), top 0.28s var(--spring), width 0.28s var(--spring), height 0.28s var(--spring)';
      win.addEventListener('transitionend', () => {
        win.style.transition = '';
      }, { once: true });

      const isMax = win.dataset.maximized === 'true';
      if (isMax) {
        win.dataset.maximized = 'false';
        win.style.left = win.dataset.preMaxLeft;
        win.style.top = win.dataset.preMaxTop;
        win.style.width = win.dataset.preMaxWidth;
        win.style.height = win.dataset.preMaxHeight;
        return;
      }

      win.dataset.preMaxLeft = win.style.left;
      win.dataset.preMaxTop = win.style.top;
      win.dataset.preMaxWidth = win.style.width;
      win.dataset.preMaxHeight = win.style.height;

      win.dataset.maximized = 'true';
      win.style.left = '0';
      win.style.top = '30px';
      win.style.width = '100vw';
      win.style.height = 'calc(100vh - 110px)';
    });

    header.addEventListener('mousedown', (event) => {
      if (win.dataset.maximized === 'true') return;
      if (event.target.closest('.window-action')) return;
      event.preventDefault();

      desktop.appendChild(win);
      setActiveWindow();

      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = win.offsetLeft;
      const startTop = win.offsetTop;

      const onMouseMove = (moveEvent) => {
        win.style.left = `${startLeft + (moveEvent.clientX - startX)}px`;
        win.style.top = `${startTop + (moveEvent.clientY - startY)}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    resizeHandle.addEventListener('mousedown', (event) => {
      if (win.dataset.maximized === 'true') return;
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = parseFloat(win.style.width) || win.offsetWidth;
      const startHeight = parseFloat(win.style.height) || win.offsetHeight;

      const onMouseMove = (moveEvent) => {
        win.style.width = `${Math.max(240, startWidth + (moveEvent.clientX - startX))}px`;
        win.style.height = `${Math.max(160, startHeight + (moveEvent.clientY - startY))}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    desktop.appendChild(win);
    setActiveWindow();
    void win.offsetWidth;
    win.style.opacity = '1';
    win.style.transform = 'scale(1)';

    if (windowData && windowData.info) {
      this.showInfoDialog(windowData.info);
    }
  }

  // Each control class owns its own DOM rendering (a static renderElement
  // method), so WiseDesktop just looks it up by type and calls it. See
  // WiseControlRegistry, populated by system/controls/*.js when loaded in
  // the browser.
  // `windowId` lets a control scope anything that must be unique per native
  // DOM element across the whole page -- e.g. a radio input's `name` --
  // rather than just per control id, which collides when the same app is
  // opened in two windows at once (see WiseRadioGroup).
  renderControl(control, appId, windowId) {
    const registry = window.WiseControlRegistry;
    const ControlClass = registry[control.type] || registry.WiseControl;
    return ControlClass.renderElement(control, { appId, windowId, desktop: this });
  }

  // Wraps a control's own markup in a container keyed by control id. The
  // wrapper -- not the control's internal DOM shape, which varies by type
  // (e.g. WiseCheckboxGroup has no single root carrying the id) -- is what
  // lets patchWindowControls add/remove whole controls generically later.
  wrapControl(control, appId, windowId) {
    const wrapper = document.createElement('div');
    if (control.id) wrapper.dataset.controlWrapper = control.id;
    wrapper.appendChild(this.renderControl(control, appId, windowId));
    return wrapper;
  }

  // Collects the current value of every control in a window, keyed by
  // control id, by asking each control's own class how to read itself back
  // out of the DOM (see gatherValue on each system/controls/*.js class).
  gatherControlValues(winEl) {
    const registry = window.WiseControlRegistry;
    const values = {};
    const seen = new Set();

    winEl.querySelectorAll('[data-control-id]').forEach((node) => {
      const id = node.dataset.controlId;
      if (seen.has(id)) return;
      seen.add(id);

      const ControlClass = registry[node.dataset.controlType] || registry.WiseControl;
      if (typeof ControlClass.gatherValue !== 'function') return;

      const value = ControlClass.gatherValue(winEl, id);
      if (value !== undefined) {
        values[id] = value;
      }
    });

    return values;
  }

  // Runs the control's real handler on the server, against the same live
  // window instance, then patches the DOM with whatever changed. This is
  // what lets an app author attach any function as a control's event
  // handler without also teaching the browser how to simulate it.
  async sendControlEvent(appId, controlId, sourceEl, eventName = 'click', overrideValues = {}) {
    const winEl = sourceEl.closest('.window');
    if (!winEl) return;

    const values = this.gatherControlValues(winEl);
    Object.assign(values, overrideValues);

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('was_token') : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    let result;
    try {
      const response = await fetch(`/api/applications/${appId}/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ controlId, event: eventName, values }),
      });

      result = await response.json();

      if (!response.ok) {
        console.error(`[WAS] Control event error (${response.status}):`, result);
        return;
      }
    } catch (err) {
      console.error('[WAS] sendControlEvent fetch failed:', err);
      return;
    }

    if (result.window && Array.isArray(result.window.controls)) {
      this.patchWindowControls(winEl, result.window.controls);
    }

    if (result.theme) {
      this.applyTheme(result.theme);
    }

    if (result.backgroundImage !== undefined) {
      this.applyBackgroundImage(result.backgroundImage);
    }

    if (result.window && result.window.info) {
      this.showInfoDialog(result.window.info);
    }

    if (result.window && result.window.launchAppId) {
      const targetAppId = result.window.launchAppId;
      const launchAppParam = result.window.launchAppParam || null;
      console.log('[WAS] Launching app from control event:', targetAppId, launchAppParam);
      if (typeof this.onIconClick === 'function') {
        this.onIconClick({ appId: targetAppId, appParameter: launchAppParam });
      } else {
        console.warn('[WAS] onIconClick is not set on desktop — cannot launch', targetAppId);
      }
    }
  }

  // Diffs the window's controls against what's currently in the DOM, keyed
  // by the wrapper divs from wrapControl(): existing ids are patched in
  // place (see patchElement on each system/controls/*.js class), new ids
  // are rendered and appended, and ids no longer present are removed. This
  // lets an app's control list grow or shrink between events (e.g. a row
  // disappearing once its item is handled), not just change value.
  patchWindowControls(winEl, controls) {
    const registry = window.WiseControlRegistry;
    const body = winEl.querySelector('.app-shell');
    const appId = winEl.dataset.appId;
    const windowId = winEl.dataset.windowId;
    const seen = new Set();

    controls.forEach((control) => {
      if (control.id) seen.add(control.id);

      const wrapper = control.id ? winEl.querySelector(`[data-control-wrapper="${control.id}"]`) : null;
      if (wrapper) {
        const ControlClass = registry[control.type] || registry.WiseControl;
        if (typeof ControlClass.patchElement === 'function') {
          // Third arg is new: a control whose patch needs to fully rebuild
          // itself (e.g. WiseDataTable re-rendering rows/pager) can call
          // back into renderControl() via context.desktop. Existing
          // patchElement(winEl, data) overrides just ignore the extra arg.
          ControlClass.patchElement(winEl, control, { appId, windowId, desktop: this });

          const el = winEl.querySelector(`[data-control-id="${control.id}"]`);
          if (el) {
            if (control.visible === false) {
              el.style.display = 'none';
            } else {
              el.style.display = '';
            }
            if (control.disabled) {
              el.disabled = true;
              el.classList.add('wise-disabled');
              el.style.pointerEvents = 'none';
              el.style.opacity = '0.5';
            } else {
              el.disabled = false;
              el.classList.remove('wise-disabled');
              el.style.pointerEvents = '';
              el.style.opacity = '';
            }
          }
        }
      } else if (body) {
        body.appendChild(this.wrapControl(control, appId, windowId));
      }
    });

    winEl.querySelectorAll('[data-control-wrapper]').forEach((node) => {
      if (!seen.has(node.dataset.controlWrapper)) {
        node.remove();
      }
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WiseDesktop;
}
