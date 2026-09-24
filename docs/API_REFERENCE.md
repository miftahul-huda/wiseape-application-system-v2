# WAS API Reference

> Companion to `docs/ARCHITECTURE.md` (concepts) and `docs/DEVELOPMENT_GUIDE.md`
> (tutorial). This document is a systematic reference of every class,
> property, and method in the system. "Isomorphic" below means the file
> runs both in Node and in the browser from the same source (see
> ARCHITECTURE.md §2). Every control file listed under "Control subclasses"
> is also wrapped in an IIFE (`(function () { ... })();`) — see
> ARCHITECTURE.md §2 point 2 for why that's load-bearing.

---

## `system/WiseApplicationSystem.js` — isomorphic

The orchestrator. There is exactly **one** instance in the client process
(created once at boot in `client/app.js`, shared by every browser tab/user —
see ARCHITECTURE.md §9) and one instance per browser tab, created in
`public/script.js` after login. The server-side instance owns the
`Api*Repository` clients and every running app; the browser instance holds
no repositories at all and talks to the client's own routes exclusively via
`fetch`.

### Constructor

`new WiseApplicationSystem(options = {})`

| Option | Where used | Meaning |
|---|---|---|
| `options.api` | server | passed through as the `config` object to every `Api*Repository` constructor (each repository reads `config.baseUrl`, defaulting to `process.env.API_BASE_URL`) |
| `options.root` | browser | the DOM element `WiseDesktop` renders into |

There is **no** `options.user` / `options.token` read by this constructor.
Per-request user context is a `session` object (`{user, token}`) passed as a
parameter into `runApplication`/`dispatchControlEvent`, not stored on
construction — see ARCHITECTURE.md §8.

### Properties

| Property | Type | Meaning |
|---|---|---|
| `apps` | `WiseApplication[]` (server) / plain JSON array (browser) | every installed app |
| `menus` | tree of menu nodes (`group`/`item`, see §11 of ARCHITECTURE.md) | already built server-side by the REST API; relayed as-is |
| `themes` | array | available desktop themes |
| `activeThemeId` | string/null | the shared, process-wide fallback theme id — used when no per-user session theme applies |
| `backgroundImage` | string/null | the shared, process-wide fallback background — same caveat |
| `systemConfig` | `{name, version, theme}` | static metadata, not user-configurable |
| `runningApplications` | `Map<appId, WiseApplication instance>` | server only. **One entry per appId, process-wide** — see ARCHITECTURE.md §9 for the concurrency caveat |
| `repository` / `themeRepository` / `menuRepository` | server only | the `Api*Repository` clients (there is **no** `authRepository`, and **no** `employeeRepository`, on this class — see the `Api*Repository classes` section below) |
| `root` | browser only | the DOM element passed via `options.root` |
| `desktop` | `WiseDesktop` instance | created inside `run()` |
| `currentSession` | `{user, token}` or `null` | server only. Set immediately before a handler runs, by `runApplication`/`dispatchControlEvent` — see ARCHITECTURE.md §5/§8/§9 |

**No `authRepository`, no `currentUser`, no `authToken` on this class.**
Auth is handled entirely by `client/app.js`'s own module-level
`ApiAuthRepository` instance and its `/api/auth/*` routes — see the
"Express routes" table below and the `Api*Repository classes` section.

### Methods

- **`async run(user = null)`** — loads apps, themes, menus (in that order);
  creates the `WiseDesktop` (server: `new WiseDesktop()`, no root; browser:
  `new WiseDesktop(this.root)`); on the browser only, wires
  `this.desktop.onIconClick = (menuItem) => this.runApplication(menuItem.appId)`;
  applies the current theme/background to the desktop; computes
  `filterMenusForUser(this.menus, user)` and calls `this.desktop.run(visibleMenus)`
  with the *filtered* tree (the full, unfiltered `this.apps`/`this.menus`
  are left untouched — `/api/apps` and `runApplication` still need every
  app, admin included). Returns `{ system: this.systemConfig, apps: this.apps, menus: this.menus, desktop: desktopResult }`.
- **`filterMenusForUser(menus, user)`** — recursively drops the `admin`
  menu item (and any `group` left with no children as a result) unless
  `user && user.role === 'admin'`. Pure display filter — `AppAdmin.run()`
  independently enforces the role check server-side.
- **`async loadThemes()`** — server: `this.themeRepository.listThemes()`,
  and if `this.activeThemeId` isn't already set, defaults it to the first
  theme's id. Browser: `GET /api/themes`, reading `themes`, `activeThemeId`,
  `backgroundImage` off the JSON response.
- **`async loadMenus()`** — server: `this.menuRepository.listMenus()`
  (already a built tree — no client-side tree-building step exists on this
  class). Browser: `GET /api/menus`.
- **`async loadApplications()`** — server: `this.repository.listApplications()`,
  wrapping each row in `new WiseApplication({...})`. Browser: `GET /api/apps`
  (plain JSON, not wrapped in a class).
- **`getActiveTheme()`** — returns the theme matching `this.activeThemeId`,
  or `this.themes[0]`, or `null`.
- **`setActiveTheme(themeId)`** — throws if unknown; sets
  `this.activeThemeId` and calls `this.desktop.applyTheme(theme)` if a
  desktop exists. Returns the theme.
- **`setBackgroundImage(url)`** — sets `this.backgroundImage = url || null`,
  calls `this.desktop.applyBackgroundImage(...)` if a desktop exists.
- **`resolveApplicationClass(app)`** — server only. Splits
  `app.appStartPoint` on `:` into `[relativePath, className]`; if either is
  missing, returns the base `WiseApplication` class. Otherwise
  `require()`s `path.resolve(process.cwd(), relativePath)` and returns
  `loadedModule[className] || loadedModule || WiseApplication`.
- **`async runApplication(appId, session = null)`**
  - Browser branch: reads `localStorage.was_token` (note: this literal key
    — not `wiseape_token`), sends
    `POST /api/applications/run` with `{appId}` and an `Authorization: Bearer`
    header if a token is present; if the response has `result.application`
    and `this.desktop` exists, calls
    `this.desktop.renderWindow(result.application, result.startupResult)`.
    Returns the raw response JSON.
  - Server branch: finds the app in `this.apps` (matching `appID` loosely
    against string or `Number(appId)`), throws if not found; sets
    `this.currentSession = session || null`; computes
    `this.desktop?.onApplicationIconClick(app)` (falls back to a synthetic
    `{event:'onApplicationIconClick', app}` if there's no desktop);
    resolves the app class, constructs `new AppClass(app.toJSON())`, sets
    `instance.system = this`, `await`s `instance.run(app.appConfig, app.appParameter)`,
    stores the instance in `runningApplications` keyed by
    `instance.appID || app.appID` (**overwriting** any previous instance
    for that id — see ARCHITECTURE.md §9). Returns
    `{ event, application: instance.toJSON ? instance.toJSON() : app.toJSON(), startupResult }`.
- **`async dispatchControlEvent(appId, controlId, eventName, values = {}, session = null)`**
  — server only; the heart of the control-event round trip (full sequence
  diagram in ARCHITECTURE.md §5). No `args` parameter of any kind.
  - Looks up the running instance for `appId` (string or `Number(appId)`
    match); throws if there's no instance or no `instance.window`.
  - Sets `this.currentSession = session || null`.
  - For every `[id, value]` in `values`, if `win[id]` exists, sets
    `win[id].value = value` (this is how a control's own dataset syncs
    *and* how internal controls like `WiseDataTable`/`WiseFileUpload`
    deliver an out-of-band payload — see their entries below).
  - Resolves `` control[`on${Capitalize(eventName)}`] `` on the target
    control (looked up as `win[controlId]`; throws if the control doesn't
    exist) — note `Capitalize` only uppercases the event name's *first*
    character.
  - **For `keypress` events**: the key metadata fields (`key`, `code`,
    `ctrlKey`, `shiftKey`, `altKey`) are excluded from the `values` sync
    step (so they don't overwrite a control named `key`) and are instead
    collected into a `keyMeta` object passed as the **first argument** to
    the handler: `await handler.call(win, keyMeta)`. For all other events,
    the handler is called with no arguments as before.
  - If the resolved handler is a function, `await handler.call(win)` (or
    `handler.call(win, keyMeta)` for keypress) — `this` inside a plain
    `.bind(this)`'d app-author handler is the window either way; a handler
    defined as an arrow function in a control's own constructor
    (`WiseDataTable`) keeps `this` as that control instance instead, since
    arrow functions ignore `.call()`'s override.
  - Builds the response: `theme` is looked up from `session.user.themeId`
    against `this.themes` if a session with a user is present, else
    `this.getActiveTheme()`; `backgroundImage` is `session.user.backgroundImage`
    if a session/user is present, else `this.backgroundImage`. The local
    `session` parameter (not `this.currentSession`) is used specifically so
    a concurrent request re-stashing `this.currentSession` during the
    `await` above can't leak into this response — see ARCHITECTURE.md §8/§9.
  - Returns `{ window: win.toJSON(), theme, backgroundImage }`. **No
    `newWindows` field** — there is no multi-window-per-app mechanism (see
    `WiseWindow` below).
- **`getSystemSnapshot()`** — returns
  `{ system: this.systemConfig, apps: this.apps.map(app => app.toJSON()), desktop: this.desktop ? this.desktop.run(this.apps) : null }`.
  Backs the `GET /api/system` route, which the client itself doesn't
  actually consume for anything (the desktop boots off `/api/apps`,
  `/api/menus`, `/api/themes` instead).

---

## `system/WiseDesktop.js` — isomorphic

Renders the desktop shell: top bar, dock, desktop icon grid, windows,
Launchpad/folder overlays. Contains **no per-control-type rendering
logic** — it delegates to whatever class is registered under a control's
`type` in `window.WiseControlRegistry`.

### Constructor

`new WiseDesktop(root = null)` — `root` is the DOM element to render into
(browser only; omitted server-side, where only `run()`'s returned snapshot
matters).

### Properties

`root`, `menus` (set by `run()`), `topBar` (`{left: [displayName], right: ['Battery 100%', 'Wi‑Fi']}` — `displayName` is read from `localStorage.was_user` at construction time (falling back to `'User'`), the clock and Logout item are appended live by `renderDesktop()`, not part of this static list), `theme` (defaults `'macos'`, becomes the active theme's `id` after `applyTheme`), `themeColors` (the full theme object, set by `applyTheme`), `backgroundImage` (set by `applyBackgroundImage`), `windowStack` (reset to `[]` by every `run()` call — not actually used to track open windows elsewhere in this file), `onIconClick` (callback wired externally by `WiseApplicationSystem`), `clockInterval`.

There is **no `currentUser` property anywhere on this class** and **no
`escapeHtml` method** — user-controlled text (menu labels, etc.) is set via
`textContent`, not spliced into `innerHTML`, everywhere in this file.

### Methods

- **`run(menus = [])`** — stores `menus`, resets `windowStack = []`, builds
  the snapshot via `buildSnapshot(menus)`, and (if `this.root` is set) calls
  `renderDesktop()`. Returns the snapshot. Note the parameter is the
  **already role-filtered** menu tree (`WiseApplicationSystem.run()` passes
  `filterMenusForUser(...)`'s result), not the raw app list.
- **`buildSnapshot(menus)`** — returns
  `{ theme: this.theme, menus, topBar: this.topBar, dock: <flattened leaf items as {id, title, icon}> }`.
  The `dock` array is built via `flattenMenuItems(menus)` — folders never
  appear in it.
- **`flattenMenuItems(nodes = [])`** — recursively collects every `item`
  (leaf) node across a menu tree, depth-first, skipping `group` nodes
  themselves. Used for the dock snapshot and, in the browser, the actual
  dock DOM.
- **`launchApp(node, glyphEl)`** — calls `this.onIconClick(node)` (a no-op if
  it isn't a function); if `glyphEl` is given, adds an `icon-launching`
  class (bounce animation) for as long as the returned promise is pending,
  removing it in `.finally(...)`.
- **`onApplicationIconClick(app)`** — returns
  `{ event: 'onApplicationIconClick', app, timestamp: new Date().toISOString() }`.
- **`getAppIcon(entity)`** — accepts either a menu node (`{icon, label}`) or
  a running-application-shaped object (`{appIcon, appTitle}`); returns
  `entity.icon || entity.appIcon`, falling back to the first character of
  `entity.label || entity.appTitle` uppercased, or `'◫'`.
- **`getIconMarkup(entity)`** — looks up a small built-in table of
  hand-drawn monochrome SVG glyphs keyed by icon character (`▣ 📁 ✦ ⚙ 🎛`),
  falling back to `<span>${key}</span>` for anything unmapped.
- **`upgradeIcon(container, entity)`** — resolves `entity.appId || entity.appID`;
  if present, probes `/app-assets/<id>/icon.svg` in the background via a
  bare `new Image()` and, only once it fires `onload`, clears `container`
  and appends an `<img class="wise-app-icon-img">` — never shows a broken
  image if the file doesn't exist (there's no `onerror` fallback needed
  because the glyph markup from `getIconMarkup` is never removed until the
  real image has already proven it loads). No-op if there's no app id
  (menu group/folder icons stay on the glyph path forever).
- **`applyTheme(theme)`** — no-op if `theme` is falsy; otherwise sets
  `this.theme = theme.id`, `this.themeColors = theme`, and (browser only,
  when `this.root` is set) writes `--bg1 --bg2 --accent --accent-dark` as
  CSS custom properties on `document.documentElement`.
- **`applyBackgroundImage(url)`** — sets `this.backgroundImage = url || null`
  and (browser only) sets `--desktop-image` to `url("...")` or `'none'`.
- **`startClock(clockEl)`** — clears any previous `this.clockInterval`,
  writes the formatted time immediately, then every 1000ms.
- **`formatClock(date)`** — `"<Weekday> <Mon Day> <h>:<mm> <AM|PM>"` using
  `toLocaleDateString`, 12-hour wraparound.
- **`renderDesktop()`** *(browser only)* — builds the whole `.desktop` DOM
  tree: wallpaper layer, top bar (left/right spans — left shows the logged-in
  user's display name read from `localStorage.was_user`, a live clock span,
  and — unconditionally — a Logout span that clears `was_token`/`was_user`
  from `localStorage`, POSTs `/api/auth/logout` if a token existed, then
  reloads). Desktop shortcut icons on the grid have been removed — apps are
  accessed exclusively via the Launchpad or taskbar. The **taskbar is
  vertical, positioned on the left edge** of the desktop: a Launchpad trigger
  at the top, a horizontal separator, then one `.dock-item` per flattened
  leaf item. Each dock item stores its label in `data-label` (not the browser
  `title` attribute) so a custom CSS tooltip (`::after` pseudo-element) can
  appear to the right on hover. Calls `upgradeIcon` for every rendered icon
  and `attachDockMagnify(dock)` at the end.
- **`attachDockMagnify(dock)`** — macOS-style dock icon magnification:
  on `mousemove`, grows each `.dock-item`'s real `width`/`height` (not
  `transform: scale`) the closer the pointer is to its **vertical** center
  (within a 110px radius, up to 78px from a 50px base), so flex layout
  pushes neighbors apart instead of overlapping; resets on `mouseleave`.
  The dock is rendered **vertically on the left edge** of the desktop
  (not at the bottom), so magnification tracks `clientY` instead of `clientX`.
- **`openMenuOverlay(root, items, title, { showBack = false, closers = [] } = {})`**
  *(browser only)* — fullscreen overlay listing `items`. Used for both the
  Launchpad (`items = this.menus`) and a folder's contents. Clicking a
  nested `group` item **stacks** another `openMenuOverlay` call on top
  (passing the same shared `closers` array through), rather than replacing
  the current overlay. `closers` is that shared array of every currently
  open level's own `closeOverlay` function; clicking an actual app calls
  `closeAll()` (invokes every closer in the array), dismissing the whole
  stack at once, not just the level the click happened in. Escape or a
  click on the backdrop closes just the top overlay via `closeOverlay()`;
  `showBack: true` adds a "← Back" button that does the same. There is
  **no `openMenuFolder` method** — folder browsing and the Launchpad are
  both just calls to this one method.
- **`showInfoDialog(info)`** *(browser only)* — modal alert overlay (icon +
  title + message + OK button), icon/color picked from `info.type`
  (`'information'` default, `'success'`, `'warning'`, `'error'`). Appended
  to `.desktop`; dismissed by the OK button, Escape, or a backdrop click.
- **`renderWindow(application, startupResult = null)`** *(browser only)* —
  builds one `.window` DOM element from `startupResult.window` (a
  `WiseWindow.toJSON()` payload) and `application` (a `WiseApplication.toJSON()`
  payload): header (icon via `getIconMarkup`, title, close/minimize/maximize
  buttons), body (`wrapControl(...)` for each of `windowData.controls`, or a
  placeholder paragraph if there are none), a resize handle. Wires up
  close (fade + remove)/minimize (fade + dock item that restores it)/maximize
  (toggles between stored pre-maximize geometry and a near-fullscreen
  layout)/drag (via `mousedown` on the header, skipped if a `.window-action`
  button was the target, or the window is maximized)/resize (via
  `mousedown` on `.resize-handle`, min 240×160) — all pure client-side DOM,
  no server round trip. If `windowData.info` is present, calls
  `showInfoDialog(windowData.info)` once the window is in the DOM.
- **`renderControl(control, appId, windowId)`** — looks up
  `window.WiseControlRegistry[control.type] || registry.WiseControl` and
  calls its `static renderElement(control, { appId, windowId, desktop: this })`.
- **`wrapControl(control, appId, windowId)`** — wraps `renderControl(...)`'s
  returned node in a `<div data-control-wrapper="<control.id>">` (only set
  if `control.id` is truthy). This wrapper — not the control's own internal
  DOM shape, which varies by type — is what lets `patchWindowControls` add
  or remove a whole control by id later.
- **`gatherControlValues(winEl)`** — walks every `[data-control-id]` node
  under `winEl` (deduped by id via a `Set`), asks each one's registered
  class's `static gatherValue(winEl, id)`, and collects `{controlId: value}`
  for every non-`undefined` result.
- **`async sendControlEvent(appId, controlId, sourceEl, eventName = 'click', overrideValues = {})`**
  — the client half of the control-event round trip (ARCHITECTURE.md §5).
  Finds the closest `.window` ancestor of `sourceEl` (returns early if
  none); gathers sibling values via `gatherControlValues`, merges
  `overrideValues` on top (`Object.assign`); reads the Bearer token from
  `localStorage.was_token`; `POST`s
  `{controlId, event: eventName, values}` (note: **no `args` field**) to
  `/api/applications/${appId}/events`; then, from the JSON response: if
  `result.window.controls` is an array, calls `patchWindowControls`; if
  `result.theme` is present, calls `this.applyTheme(result.theme)`; if
  `result.backgroundImage !== undefined`, calls
  `this.applyBackgroundImage(result.backgroundImage)`; if
  `result.window.info` is present, calls `this.showInfoDialog(...)`. There
  is **no `newWindows` handling** — the response only ever carries one
  window.
- **`patchWindowControls(winEl, controls)`** — for each control in the
  fresh server list: if a `[data-control-wrapper="<id>"]` already exists,
  calls its registered class's
  `static patchElement(winEl, control, { appId, windowId, desktop: this })`
  (the third `context` argument is new relative to a plain 2-arg
  `patchElement(winEl, data)` signature — most controls ignore it, but a
  control whose patch needs to fully rebuild itself, e.g. `WiseDataTable`,
  uses it to call back into `renderControl`); if no wrapper exists yet,
  appends a freshly `wrapControl`'d node to `.app-shell`. Afterward, removes
  any `[data-control-wrapper]` whose id wasn't in the fresh `controls` list
  — this is what lets an app's control list grow or shrink between events.

---

## `system/WiseApplication.js` — isomorphic (used server-side only in practice)

Base class every `App*.js` extends. One instance = one running "app" (which
in turn owns at most one `WiseWindow`).

### Constructor

`new WiseApplication(appMetadata = {})` — reads `appID` (falling back to
`appMetadata.appId`, then `'unknown-app'`), `appTitle` (default
`'Untitled Application'`), `appVersion` (default `'1.0.0'`), `appDeveloper`
(default `'Wiseape'`), `appIcon` (falls back through `appIconUrl`, `icon`,
then `'◫'`), `appLibraries` (array, default `[]`), `appConfig` (default
`{}`), `appStartPoint` (default `''`), `appParameter` (default `{}`). Sets
`this.window = null`, `this.controls = []`, `this.system = null`. **No
`currentUser` property is set here** — user context reaches a running app
only through `this.system.currentSession` at dispatch time (see above), not
through a property on the app instance itself.

### Methods

- **`run(appConfig = {}, appParameter = {})`** — **override this.** The
  base implementation merges `appConfig`/`appParameter` onto the existing
  ones and returns
  `{ appID, appTitle, appVersion, appDeveloper, appIcon, appConfig, appParameter, status: 'started' }`.
  A real app overrides this to call `this.createWindow(...)` and
  `.show(...)`. May be `async` — `WiseApplicationSystem.runApplication`
  always `await`s it.
- **`createWindow(WindowClass, options = {})`** — builds
  `{ appId: this.appID, appTitle: this.appTitle, appIcon: this.appIcon, system: this.system, ...options }`
  (note: **no `currentUser` is propagated** — there is none to propagate),
  constructs `new WindowClass(windowOptions)`, calls its `onWindowInit()` if
  it's a function, stores the result as `this.window`, and returns it. This
  is the **only** way to create a window — one main window per app, no
  multi-window/dialog support (see `WiseWindow` below).
- **`showInfo(title, message, type = 'information')`** — throws
  `'showInfo() requires a window -- call createWindow() first'` if
  `this.window` isn't set yet; otherwise delegates to
  `this.window.showInfo(title, message, type)`. Lets an app queue a modal
  alert during `run()`, right after `createWindow()`, before the window has
  even been shown.
- **`toJSON()`** — the shape sent to the browser as `application` in
  responses:
  `{ appID, appTitle, appVersion, appDeveloper, appIcon, appLibraries, appConfig, appStartPoint, appParameter, controls }`,
  where `controls` maps `this.controls` (this base class's own array,
  present only if it was populated directly — real apps don't do this,
  they use a window's controls instead) through `control.render()`.

---

## `system/WiseWindow.js` — isomorphic (used server-side only in practice)

Base class every `Win*.js` extends. One instance = one on-screen window.

**There is no `createWindow()` method, no `childWindows` property, and no
`currentUser` property on this class.** A window cannot open another window
mid-session — see ARCHITECTURE.md §5 for what to use instead
(`showInfo`/`showDialog` modal-style helpers, not a second window).

### Constructor

`new WiseWindow(options = {})` —

| Property set | Default | Notes |
|---|---|---|
| `windowId` | random | `window-<Date.now()>-<random hex>` |
| `title` | `'Untitled Window'` | |
| `appId` | `options.appId \|\| null` | |
| `appTitle` | `options.appTitle \|\| 'Application'` | |
| `appIcon` | `options.appIcon \|\| '◫'` | |
| `width`, `height` | `options.width \|\| 640`, `options.height \|\| 420` | |
| `positionX`, `positionY` | `options.positionX \|\| 220`, `options.positionY \|\| 120` | |
| `visible`, `minimized`, `maximized` | `false` | |
| `params` | `null` | whatever was last passed to `.show(param)`/`.showDialog(param)` |
| `controls` | `[]` | populated by `addControl` |
| `onShow`, `onShowDialog` | `null` | optional callbacks invoked by `show()`/`showDialog()` |
| `system` | `options.system \|\| null` | the shared `WiseApplicationSystem` |
| `pendingInfo` | `null` | queued one-shot modal alert — see `showInfo` |

### Methods

- **`showInfo(title, message, type = 'information')`** — sets
  `this.pendingInfo = { title, message, type }` and returns it. Queues a
  one-shot modal alert delivered through the window's `info` field the
  *next* time `toJSON()` runs — either as part of `run()`'s startup result
  or a later control-event response. `type` is `'information'` (default),
  `'success'`, `'warning'`, or `'error'` — `WiseDesktop.showInfoDialog`
  picks the icon/color from it.
- **`addControl(control)`** — pushes onto `this.controls`, calls
  `this.registerControl(control)`, returns `this` (chainable).
- **`removeControl(id)`** — removes the control with the given `id` from
  `this.controls` (by `findIndex`/`splice`) and `delete`s `this[id]`. For
  container controls (`getChildControls` exists), also recursively
  unregisters every nested child's `this[childId]` shorthand. Returns
  `this` (chainable). After calling this, the control no longer renders on
  the next round trip.
- **`registerControl(control)`** — if `control.id`, sets
  `this[control.id] = control`; if `control.getChildControls` is a function
  (a container control), also calls `registerControl` on every control it
  returns, recursively. This is what makes `this.txtName` resolve for a
  control added directly *or* nested inside a `WiseTableLayout`/
  `WiseTabControl`/`WiseFrame` that was itself passed to `addControl`.
- **`onWindowInit()`** — **override this.** Base implementation just
  returns `this`. Called synchronously right after construction (by
  `WiseApplication.createWindow`). Build `this.controls = []` and call
  `addControl` for each control here; must stay synchronous.
- **`getValues()`** — collects `{ [control.dataField || control.id]: control.value }`
  for every control whose `.name` is in a fixed internal set
  (`WiseTextBox, WiseNumericBox, WiseTextArea, WiseComboBox, WiseRadioGroup,
  WiseCheckboxGroup, WiseDate, WiseDateRange, WiseHtmlEditor, WiseFileUpload`
  — display/action-only controls like `WiseLabel`/`WiseButton` are excluded
  by not being in this set). **There is no `isInput` property anywhere in
  the codebase** — this membership check against the control's `name` is
  the actual mechanism, not a per-instance flag. A container control (one
  with a `getChildControls` function) is walked recursively via its
  `getChildControls()` return value instead of contributing a value of its
  own.
- **`show(param = null)`** — sets `visible = true, minimized = false`,
  stores `params = param`, calls `this.onShow(param)` if set, returns
  `{ status: 'shown', window: this.toJSON(), param }`. Several `Win*.js`
  subclasses override this just to also explicitly set `this.visible = true`
  before calling `super.show(param)` — check an existing app for the exact
  pattern (e.g. `WinControls`).
- **`showDialog(param = null)`** — same shape, calls `onShowDialog` instead
  of `onShow`, returns `{ status: 'dialog', ... }`.
- **`close()`** — sets `visible = minimized = maximized = false`, returns
  `{ status: 'closed', window: this.toJSON() }`.
- **`maximize()`** / **`minimize()`** — toggle the corresponding flag,
  return `{ status, [maximized|minimized]: <bool>, window: this.toJSON() }`.
  In practice, minimize/maximize/close animation and state are handled
  purely client-side in `WiseDesktop.renderWindow` (see above); these
  server-side methods exist for completeness/programmatic use but aren't
  wired into the default UI flow.
- **`toJSON()`** — reads and **clears** `this.pendingInfo` (so a queued
  alert shows exactly once), then returns
  `{ windowId, title, appId, appTitle, appIcon, width, height, positionX, positionY, visible, minimized, maximized, params, info, controls }`,
  where `controls` maps `this.controls` through `control.render()`.

---

## `system/controls/WiseControl.js` — isomorphic, base class for every control

### The control contract

Every control subclass follows this shape. Only override what you need —
the base class provides sane generic defaults for simple single-element
controls.

| Member | Kind | Required? | Purpose |
|---|---|---|---|
| `constructor(value, options)` | instance | yes | set `this.name` (must match the class name, used as the wire `type`) and any control-specific fields |
| `render()` | instance | yes | server → JSON sent to the browser (must include at least `type`, `id`, `value`, `visible`) |
| `static renderElement(data, context)` | static | yes | JSON → a DOM `Node`. `context = { appId, windowId, desktop }` |
| `static gatherValue(winEl, id)` | static | only if the base default (reads an `<input>/<select>/<textarea>`/contenteditable by `data-control-id`) doesn't fit | DOM → current value |
| `static patchElement(winEl, data, context)` | static | **required for any container control** | fresh server JSON → update DOM in place |
| `getChildControls()` | instance | only for containers | array of this container's own nested controls (see individual entries below for exactly how deep each one goes) |

There is **no `isInput` field set anywhere** in the base class or any
subclass — see `WiseWindow.getValues()` above for the actual mechanism.

### Constructor

`new WiseControl(value = '', options = {})` sets:

- `this.value = value`
- `this.name = 'WiseControl'` (every subclass overrides this)
- `this.id = options.id || null`
- `this.dataField = options.dataField || options.id || null`
- `this.visible = options.visible !== undefined ? options.visible : true`
- `this.disabled = options.disabled !== undefined ? options.disabled : false`

### `render()` (base)

Returns `{ type: this.name, id: this.id, value: this.value, visible: this.visible, disabled: this.disabled }`
— note **no `dataField`** at this level; subclasses that include it in
their own `render()` add it themselves.

### Instance methods (inherited by every control)

- **`getValue()`** — returns `this.value`.
- **`setValue(value)`** — sets `this.value = value`, returns `this` (chainable).
- **`getDisabled()`** — returns `this.disabled` (`true` or `false`).
- **`setDisabled(value)`** — sets `this.disabled = !!value`, returns `this` (chainable). When `true`, `applyCommon` also sets `el.disabled = true`, adds class `wise-disabled`, and sets `pointerEvents: none` / `opacity: 0.5` on the DOM element so the control is visually and functionally inert. When `false`, all of those are reversed.
- **`getVisibility()`** — returns `this.visible` (`true` or `false`).
- **`setVisibility(value)`** — sets `this.visible = !!value`, returns `this` (chainable). Reflected into the DOM by `applyCommon` (`display: none` when `false`).
- **`setEvent(eventName, handler)`** — dynamically assigns an event handler by property name (e.g. `'onChange'`, `'onClick'`, `'onKeyPress'`). `handler` must be a function — throws if it isn't. Returns `this` (chainable). Because each control's `render()` reads live handler references (e.g. `hasHandler: !!this.onChange`), this takes effect on the very next round trip with no re-construction needed.
- **`removeEvent(eventName)`** — sets `this[eventName] = null`, effectively removing the handler. The corresponding `has*Handler` flag in `render()` will be `false` on the next round trip, so no DOM listener is wired for that event. Returns `this` (chainable).

### Every control's `onClick`/`onHover` (generic, opt-in)

Every control subclass — not just this base class — now accepts
`onClick`/`onHover` constructor options, stored as `this.onClick`/
`this.onHover` and emitted in `render()` as `hasClickHandler`/
`hasHoverHandler`. Unlike `onChange` (which stays per-control, since what
DOM event actually means "changed" varies by control), the click/hover
wiring itself is written **once**, in `WiseControl.applyCommon` (below) —
a subclass only has to emit the two boolean flags, not write its own
listener code. `WiseButton` is the one exception worth noting: it already
had its own `onClick`/`hasHandler` pair predating this feature (unchanged,
still its own primary click event, wired directly in its own
`renderElement`, not through `applyCommon`'s generic path) but picked up
the new generic `onHover`/`hasHoverHandler` like every other control. See
ARCHITECTURE.md §2 point 7 for the conceptual framing.

### Static helpers (inherited, rarely overridden)

- **`static applyCommon(el, data, context)`** — sets `el.dataset.controlId`/
  `el.dataset.controlType` if `data.id` is truthy, applies `data.style`
  entries onto `el.style` (numbers → `${value}px`, everything else as-is),
  sets `el.style.display = 'none'` if `data.visible === false`, and applies
  the disabled state if `data.disabled === true` (`el.disabled = true`,
  adds class `wise-disabled`, sets `pointerEvents: none` / `opacity: 0.5`);
  reversed when `data.disabled` is falsy. Call this from every custom
  `renderElement` on whichever element should carry the control's identity.
  **`context` is optional but every shipped control now passes it**
  (`context = { appId, windowId, desktop }`, the same object `renderElement`
  itself receives): when `context.desktop` and `data.id` are present, this
  is also where the generic click/hover listeners get wired —
  `data.hasClickHandler` adds a `click` listener calling
  `context.desktop.sendControlEvent(context.appId, data.id, el, 'click')`,
  `data.hasHoverHandler` adds a `mouseenter` listener the same way with
  `'hover'`. Both are opt-in per control instance, driven by whether that
  instance's `onClick`/`onHover` option was supplied (see above).
- **`static renderElement(data)`** *(default)* — renders unhandled data as
  a `<pre>` JSON dump; effectively unused by any real control, since every
  shipped control overrides this.
- **`static gatherValue(winEl, id)`** *(default)* — finds
  `[data-control-id="id"]`; if it's contenteditable returns `.innerHTML`;
  if it's `INPUT`/`SELECT`/`TEXTAREA` returns `.value`; else `undefined`.
- **`static patchElement(winEl, data)`** *(default)* — same element
  resolution; writes `data.value` back the same way (contenteditable →
  `innerHTML`, input-like → `.value`, else → `.textContent`).

---

## Control subclasses (`system/controls/*.js`)

Each entry: constructor signature, `render()` payload fields beyond the
base (`type, id, value, visible`), and any DOM/behavior notes worth
knowing.

### `WiseLabel`

`new WiseLabel(value = '', options)`. Options: `icon`, `style`, `onClick`, `onHover`.

**Methods**
- **`getValue()`** / **`setValue(value)`** — inherited from `WiseControl`;
  read/write the label's text (equivalent to `.text()` below, minus the
  chaining/getter dual behavior).
- **`text(value)`** — getter if called with no args (returns the current
  text), setter otherwise (sets it and returns the new value). This is the
  idiomatic way a handler updates a label on screen, e.g.
  `this.lblResult.text('Hello!')`.
- **`getIcon()`** — returns `this.icon`.
- **`setIcon(icon)`** — sets `this.icon = icon`, returns `this` (chainable). Accepts emojis (`'🎨'`), SVG markup (`'<svg ...>'`), font icon classes (`'fa fa-user'`), or image URLs (`'https://...'`).

**Events**
- **`onClick`** — generic (see `WiseControl.applyCommon` above); fires a
  `click` server event when the label is clicked. Opt-in — no listener is
  wired unless supplied.
- **`onHover`** — generic; fires a `hover` server event on `mouseenter`.
  Opt-in.

There is no `onChange` — a label isn't user-editable, so nothing ever
changes it from the browser side. `render()` adds
`dataField, icon, style, hasClickHandler, hasHoverHandler`. `renderElement`: a
`<div>` carrying `data-control-id`. If `icon` is set, displays an inline-flex wrapper containing the icon before the text. Includes custom `patchElement` to handle dynamic icon/text updates.

### `WiseTextBox`

`new WiseTextBox(placeholder = '', options)` — the value itself comes from
`options.value` (default `''`), *not* the first positional argument, which
is only ever the placeholder. Options: `value`, `minLength`, `maxLength`,
`onChange`, `onClick`, `onHover`, `style`.

**Methods**
- **`getValue()`** / **`setValue(value)`** — inherited; read/write the
  current text.

**Events**
- **`onChange`** — fires when the input's native `change` event fires (on
  blur after editing, or Enter).
- **`onClick`** — generic; fires on click.
- **`onHover`** — generic; fires on `mouseenter`.
- **`onKeyPress({ key, code, ctrlKey, shiftKey, altKey })`** — fires on
  every `keydown` inside the input. The handler receives a key-metadata
  object. Opt-in — no listener is wired unless supplied.

`render()` adds
`dataField, placeholder, minLength, maxLength, hasHandler, hasClickHandler, hasHoverHandler, hasKeyPressHandler, style, disabled`.
`renderElement`: plain `<input type="text">`; if `data.minLength`/`data.maxLength`
are set (not `undefined`/`null`), assigns `el.minLength`/`el.maxLength`
directly — `maxLength` is actively enforced by the browser (typing past it
is blocked), `minLength` isn't enforced the same way but drives `:invalid`
once there's a value shorter than it. No custom `gatherValue`/`patchElement`.

### `WiseNumericBox`

`new WiseNumericBox(placeholder = '', options)`. Options: `value`, `min`,
`max`, `step` (default `'any'`), `prefix`, `suffix`, `onChange`, `onClick`,
`onHover`, `style`.

**Methods**
- **`getValue()`** / **`setValue(value)`** — inherited; read/write the
  numeric value (a plain JS `number`, or `null` if the field is empty/
  unparseable — see `parseValue` below).

**Events**
- **`onChange`** — fires on `blur`, after the typed value has been parsed
  and clamped to `min`/`max` (if set).
- **`onClick`** — generic.
- **`onHover`** — generic.

`render()` adds
`dataField, placeholder, min, max, step, prefix, suffix, hasHandler, hasClickHandler, hasHoverHandler, style`.

`renderElement` builds an "input group": a wrapper `<div>` (this is the
element `applyCommon`/`data-control-id` is applied to, *not* the inner
`<input>`) with an optional prefix `<span>`, the `<input type="text" inputmode="decimal">`
itself, and an optional suffix `<span>`. The input's locale decimal/grouping
separators (e.g. `.`/`,` for en-US, `,`/`.` for id-ID) are detected once via
`Intl.NumberFormat(...).formatToParts(1234.5)` and stashed as
`el.dataset.decimal`/`el.dataset.group`.

**Live digit grouping**: on every `input` event, the field's current text is
stripped of the group separator and any non-digit/non-decimal/non-minus
character, reformatted with fresh grouping via `toDisplay`, and the cursor
is restored to "after the same digit" (tracked by counting digits before the
old cursor position, separately for the integer part — which shifts as
grouping separators are inserted/removed — and the fraction part, which
never gets grouping and so is tracked by a stable offset from the decimal
point instead).

Static helpers: `toRaw(value, decimal)` (JS number → locale-decimal text, no
grouping), `parseValue(text, decimal, group)` (raw or grouped text → JS
number or `null`), `toDisplay(raw, decimal, group)` (raw text → grouped
display text).

`gatherValue(winEl, id)` — finds the wrapper by `data-control-id`, then its
inner `<input>`, and parses its value using the separators stashed in that
input's own `dataset`. `patchElement(winEl, data)` — same lookup, writes a
freshly grouped display value back.

### `WiseTextArea`

`new WiseTextArea(value = '', options)`. Options: `placeholder`, `rows`
(default `4`), `onChange`, `onClick`, `onHover`, `style`.

**Methods**
- **`getValue()`** / **`setValue(value)`** — inherited; read/write the
  current text.

**Events**
- **`onChange`** — fires on the textarea's native `change` event (blur
  after editing).
- **`onClick`** — generic.
- **`onHover`** — generic.
- **`onKeyPress({ key, code, ctrlKey, shiftKey, altKey })`** — fires on
  every `keydown`. Opt-in — no listener is wired unless supplied.

`render()` adds
`dataField, placeholder, rows, hasHandler, hasClickHandler, hasHoverHandler, hasKeyPressHandler, style, disabled`.
`renderElement`: plain `<textarea>`. No custom `gatherValue`/`patchElement`.

### `WiseButton`

`new WiseButton(label = '', options)`. Options: `onClick`, `onHover`, `style`.

**Methods**
- **`getValue()`** / **`setValue(value)`** — inherited; reads/writes the
  button's label text (`this.value`). Rarely used this way in practice —
  app code almost always sets the label once, at construction, and cares
  about `onClick` instead.

**Events**
- **`onClick`** — the button's primary event; fires when clicked. This
  predates the generic mechanism and is still wired directly in
  `WiseButton`'s own `renderElement` (its own `hasHandler` flag), not
  through `applyCommon`'s shared path — behaviorally identical to an app
  author either way.
- **`onHover`** — generic (wired via `applyCommon`, like every other
  control) — new alongside this feature.

`render()` adds `dataField, hasHandler, hasHoverHandler, style` (the
functions themselves never cross the JSON boundary — only whether one
exists). `renderElement`: `<button type="button">`. No `gatherValue`/
`patchElement` override needed — a `<button>` matches none of the base
`gatherValue`'s element-type checks, so it naturally contributes no value.

### `WiseComboBox`

`new WiseComboBox(items = [], options)` — `items: [{value, label}]`. Value
defaults to `options.value ?? items[0]?.value ?? ''`. Options: `onChange`,
`onItemChanged`, `onClick`, `onHover`, `style`.

**Methods**
- **`getValue()`** / **`setValue(value)`** — inherited; read/write the
  currently selected item's `value`.
- **`getItems()`** — returns `this.items`.
- **`setItems(items)`** — replaces `this.items` (`|| []`); returns `this`
  (chainable). Use this after the choice list loads from a database, for
  example.

**Events**
- **`onChange`** — fires with **no arguments** when the selection changes;
  read the new value via `this.cmbX.value` (or `this.cmbX.getValue()`)
  inside the handler. Unchanged, pre-existing behavior.
- **`onItemChanged(previousItem, currentItem)`** — an additive, richer
  event on top of the plain `onChange` above (both can be supplied
  together — the plain one still fires with no arguments). Called with the
  full `{value, label}` item objects (or `null`), one for the item selected
  *before* this change and one for the item selected *now*.
- **`onClick`** — generic.
- **`onHover`** — generic.

`render()` adds
`dataField, items, hasHandler, hasClickHandler, hasHoverHandler, style`.
`renderElement`: a wrapper `<div>` containing a `<select>` (this select is
what `applyCommon` targets — it carries `data-control-id`) plus a decorative
chevron SVG positioned over it. No custom `gatherValue`/`patchElement` (the
base default already handles a `<select>`).

**Implementation note for `onItemChanged`** (same pattern `WiseRadioGroup`
and `WiseCheckboxGroup` use, and the one `WiseDataTable` already
established for its own internal events — see ARCHITECTURE.md §2 point 8):
by the time any handler runs, `dispatchControlEvent` has already
overwritten `this.value` with the *new* value, so the constructor wraps the
control's internal `onChange` in an arrow function that reads the item
matching the value *before* the overwrite from an internally tracked
`this._lastItem` (updated on every change), computes `currentItem` from the
post-overwrite `this.value`, calls `onItemChanged(previousItem, currentItem)`
if supplied, then also calls the plain public `onChange` if *that* was
supplied. This internal wrapper (and so `hasHandler`) is only installed at
all if either `onItemChanged` or a plain `onChange` was actually passed in.

### `WiseRadioGroup`

`new WiseRadioGroup(items = [], options)` — same `items` shape as combo
box, same value-default logic. Options: `onChange`, `onItemChanged`,
`layout` (`'vertical'` or `'horizontal'`, default `'horizontal'`),
`onClick`, `onHover`, `style`.

**Methods** and **Events**: identical to `WiseComboBox` above —
`getValue()`/`setValue(value)`, `getItems()`/`setItems(items)`, `onChange`,
`onItemChanged(previousItem, currentItem)` (same `this._lastItem`-tracking
mechanism), `onClick`, `onHover`. See that entry for the full explanation.

`render()` adds
`dataField, items, hasHandler, hasClickHandler, hasHoverHandler, layout, style`.

`renderElement`: wrapper `<div>` (flex row/wrap for horizontal, flex column
for vertical), one `<label>` per item wrapping an `<input type="radio">`.
`applyCommon` is called on the wrapper (so it carries `data-control-id`
too, purely for the generic click/hover wiring) — but each radio `<input>`
still gets its own `data-control-id`/`data-control-type` set directly, not
via `applyCommon`, since `gatherValue`/`patchElement` target the inputs,
not the wrapper. **Important:** each radio's `name` attribute is scoped as
`` `${windowId}-${controlId}` `` when `context.windowId` is present (falls
back to just `controlId` otherwise) — native radio inputs sharing a `name`
are mutually exclusive across the *entire document*, not just within one
window, so without this two open windows of the same app would fight over
each other's selection. `gatherValue(winEl, id)`: the checked input's
`value`, or `''` if none. `patchElement(winEl, data)`: checks whichever
input's `value === data.value`.

### `WiseCheckboxGroup`

`new WiseCheckboxGroup(items = [], options)` — `value` (constructor arg via
`options.value`) is coerced to an array (`Array.isArray(options.value) ? options.value : []`).
Options: `onChange`, `onItemChecked`, `layout` (same as `WiseRadioGroup`),
`onClick`, `onHover`, `style`.

**Methods**
- **`getValue()`** / **`setValue(value)`** — inherited; read/write the
  array of currently checked values.
- **`getItems()`** / **`setItems(items)`** — same as `WiseComboBox`.

**Events**
- **`onChange`** — fires with no arguments whenever any checkbox toggles;
  read the new array via `this.checkX.value`. Unchanged, pre-existing
  behavior.
- **`onItemChecked(item)`** — called with the single item whose checked
  state just changed, as `{value, label, checked: true|false}`, or `null`
  if no diff could be found. Additive on top of `onChange` — both can be
  supplied together.
- **`onClick`** — generic.
- **`onHover`** — generic.

`render()` adds
`dataField, items, hasHandler, hasClickHandler, hasHoverHandler, layout, style`.
`renderElement`: same wrapper/label structure as `WiseRadioGroup` (wrapper
gets `applyCommon` for click/hover wiring), but `<input type="checkbox">`
per item, each carrying `data-control-id`/`data-control-type` directly.
`gatherValue(winEl, id)`: array of every checked input's `value`.
`patchElement(winEl, data)`: checks/unchecks each input based on array
membership in `data.value`.

**Implementation note for `onItemChecked`**: computed the same way as
`onItemChanged` elsewhere (see `WiseComboBox` above and ARCHITECTURE.md §2
point 8) but diffing *arrays* instead of a single previous item: the
constructor tracks the previous checked-values array in `this._lastValues`;
on change, the internal `onChange` wrapper compares it against the new
`this.value` array to find either a newly-present value (`checked: true`)
or a newly-absent one (`checked: false`), looks up the matching item from
`this.items`, calls `onItemChecked(...)` if supplied, then also calls the
plain public `onChange` if that was supplied too. Same opt-in gating as
`onItemChanged`: the internal wrapper (and so `hasHandler`) is only
installed if `onItemChecked` or a plain `onChange` was actually passed in.

### `WiseDate`

`new WiseDate(value = '', options)`. Options: `onChange`, `onClick`,
`onHover`, `style`.

**Methods**
- **`getValue()`** / **`setValue(value)`** — inherited; read/write the
  selected date as an `'YYYY-MM-DD'` string.

**Events**
- **`onChange`** — fires on the native date input's `change` event.
- **`onClick`** — generic.
- **`onHover`** — generic.

`render()` adds `dataField, hasHandler, hasClickHandler, hasHoverHandler, style`.
`renderElement`: plain `<input type="date">`. No custom `gatherValue`/
`patchElement`.

### `WiseDateRange`

`new WiseDateRange(value = {}, options)` — normalized in the constructor to
`{ start: value.start || '', end: value.end || '' }`. Options: `onChange`,
`onClick`, `onHover`, `style`.

**Methods**
- **`getValue()`** / **`setValue(value)`** — inherited; read/write the
  range as `{start, end}`.

**Events**
- **`onChange`** — fires on either date input's native `change` event.
- **`onClick`** — generic.
- **`onHover`** — generic.

`render()` adds `dataField, hasHandler, hasClickHandler, hasHoverHandler, style`.
`renderElement`: wrapper `<div>` with two `<input type="date">`
(`data-range="start"`/`"end"`) separated by a "to" pill. Both `gatherValue`/
`patchElement` are overridden to read/write both dates as one `{start, end}`
object, resolved off the wrapper's own `data-control-id`.

### `WiseHtmlEditor`

`new WiseHtmlEditor(value = '', options)`. Options: `onChange`, `onClick`,
`onHover`, `style`.

**Methods**
- **`getValue()`** / **`setValue(value)`** — inherited; read/write the
  editor's content as an HTML string.

**Events**
- **`onChange`** — fires on `blur`, not on every keystroke.
- **`onClick`** — generic.
- **`onHover`** — generic.
- **`onKeyPress({ key, code, ctrlKey, shiftKey, altKey })`** — fires on
  every `keydown` inside the editable region. Opt-in — no listener is
  wired unless supplied.

`render()` adds `dataField, hasHandler, hasClickHandler, hasHoverHandler, hasKeyPressHandler, style, disabled`.
`renderElement`: a wrapper `<div>` (`wise-htmleditor-wrapper`) containing a full WYSIWYG & HTML Source toolbar above a `contenteditable="true"` `<div>` (`wise-htmleditor-editable`) and a hidden `<textarea>` (`wise-htmleditor-source`).
Features include:
- **View Source** toggle mode (`</> Source`) switching between WYSIWYG visual editor and raw HTML `<textarea>`.
- **Undo / Redo / Clear Formatting** (`removeFormat`).
- **Font Family & Font Size** dropdown selects.
- **Format Block / Headings** dropdown (`<p>`, `<h1>`–`<h4>`, `<blockquote>`, `<pre>`).
- **Inline Text Styling**: Bold, Italic, Underline, Strikethrough, Subscript, Superscript.
- **Text & Background Colors**: custom color pickers (`foreColor`, `hiliteColor`).
- **Alignment**: Left, Center, Right, Justify.
- **Lists & Indents**: Unordered Bullet List, Ordered Numbered List, Outdent, Indent.
- **Insert Options**:
  - **Add Link**: modal prompt for URL and display text (`<a href="..." target="_blank">`).
  - **Add Image**: modal prompt for Image URL, Alt text, and Width (`<img src="...">`).
  - **Add Table**: modal prompt for Rows, Columns, and Header option (`<table>`).
  - **Horizontal Line**: inserts `<hr>`.
- **Custom `gatherValue` & `patchElement`**: syncs content between visual and HTML source views automatically when gathering values or patching updates.

### `WiseFileUpload`

`new WiseFileUpload(label = 'Choose file', options)`. Options: `value`,
`accept` (default `'image/*'`), `onChange`, `onClick`, `onHover`, `style`.

**Methods**
- **`getValue()`** / **`setValue(value)`** — inherited; read/write the
  uploaded file's URL.

**Events**
- **`onChange`** — fires once the async upload to `/api/uploads` completes
  (see below), delivering the new URL — never fires synchronously off a
  plain DOM event the way other controls' `onChange` does.
- **`onClick`** — generic.
- **`onHover`** — generic.

`render()` adds
`dataField, label, accept, hasHandler, hasClickHandler, hasHoverHandler, style`.
`renderElement`: a wrapper `<div>` (carries `data-control-id`) with a hidden
`<input type="file">` plus a styled `<label>` showing a thumbnail preview
(`.wise-upload-preview`, background-image driven) and helper text. On file
selection: the preview updates immediately from a local
`URL.createObjectURL(file)`; the raw file is then `POST`ed directly to
`/api/uploads` (`Content-Type: file.type`, an `X-Filename` header carrying
the encoded original name); once that resolves,
`context.desktop.sendControlEvent(appId, id, wrapper, 'change', { [id]: uploadResult.url })`
is called — **note the override value**: since the real value is only
known after the async upload, `static gatherValue()` intentionally always
returns `undefined`, and the real value is delivered via `overrideValues`,
never read back synchronously from the DOM. `static patchElement` updates
the preview's background image (and hides the placeholder icon) when
`data.value` is set.

### `WiseTableLayout` — container

`new WiseTableLayout(options)` — `options.rows` (default `1`),
`options.columns` (default `1`), `options.onClick`/`options.onHover`,
`cells = []` internally.

**Methods**
- **`setCell(row, col, control, { colSpan = 1, rowSpan = 1 } = {})`** —
  **pushes** a `{row, col, colSpan, rowSpan, control}` entry onto
  `this.cells`. Calling it twice for the same `(row, col)` does **not**
  remove the earlier entry from the array — both stay in `this.cells` — but
  `renderElement` builds a `Map` keyed by `"row:col"` by iterating `cells`
  in order, so the *last* `setCell` call for a given position is the one
  that actually renders (a `Map.set` on an existing key overwrites).
  Returns `this` (chainable).
- **`getChildControls()`** — returns `this.cells.map(cell => cell.control)`
  — the **immediate** per-cell controls only, *not* recursively flattened
  into any further-nested container's own children. (Recursion into a
  container-within-a-container is handled by the *caller* —
  `WiseWindow.registerControl`/`getValues` both recurse by calling
  `getChildControls()` again on whatever comes back, if it's itself a
  container.) Framework-internal — not typically called directly by app
  code.
- **`getValue()`** / **`setValue(value)`** — inherited, but not meaningful
  here; a table layout has no scalar value of its own (its *cells'*
  controls carry the real values). Listed for completeness only.

**Events**
- **`onClick`** — generic, wired on the layout's own root `<table>` element.
- **`onHover`** — generic, same element.

`render()`:
`{ type, id, dataField, rows, columns, cells: [{row, col, colSpan, rowSpan, control: control.render()}], hasClickHandler, hasHoverHandler, style, visible }`.
`renderElement`: a `<table>`; walks `rows × columns`, skipping cells
already marked "occupied" by an earlier cell's `colSpan`/`rowSpan`,
rendering each real cell's control via `context.desktop.renderControl(...)`.
`patchElement(winEl, data, context)` — delegates to each cell control's own
registered `patchElement` (required for any container control — see
ARCHITECTURE.md §2 point 5).

### `WiseTabControl` — container

`new WiseTabControl(options)` — `options.activeIndex` (default `0`),
`options.onTabChanged`, `options.onClick`/`options.onHover`, `options.style`.

**The active tab index is real, server-tracked state**, unlike most other
containers on this page: it's stored as `this.value` (via the base class'
`super(options.activeIndex || 0, options)`).

**Methods**
- **`addTab(label, controls = [], icon = null)`** — pushes `{label, controls, icon}` onto
  `this.tabs`. `icon` accepts emojis (`'👤'`), SVG markup (`'<svg ...>'`), font icon classes (`'fa fa-user'`), or image URLs (`'https://...'`). Returns `this` (chainable).
- **`getChildControls()`** — `this.tabs.flatMap(tab => tab.controls)` — the
  immediate controls across every tab, flattened one level (same
  non-deep-recursive caveat as `WiseTableLayout` above). Framework-internal.
- **`getValue()`** / **`setValue(value)`** — inherited, and *meaningful*
  here (unlike other containers): reads/writes the active tab **index**.
  `setValue()` is how a handler jumps to a specific tab programmatically,
  from server-side code — see `patchElement` below for how that reaches
  the browser.

**Events**
- **`onTabChanged(previousTab, currentTab)`** — opt-in; only when supplied
  does clicking a tab *also* fire a real `POST .../events` call
  (`event: 'tabchange'`) so server-side app code can react. Called with the
  full `{label, controls, icon}` tab objects (`this.tabs[index]`), or `null` if
  an index is out of range. **Switching tabs itself stays instant/
  client-only either way** — the visible panel always changes immediately,
  with or without this handler; apps that don't supply it see zero
  behavior/performance change from before this feature existed. This is
  the one place in the control catalog where the bridging pattern (see
  ARCHITECTURE.md §2 point 8) turns a previously **pure client-side**
  interaction into an **optional** server round trip, rather than just
  adding a richer event on top of an existing one.
- **`onClick`** — generic, on the control's own root wrapper.
- **`onHover`** — generic, same wrapper.

`render()`:
`{ type, id, dataField, value, tabs: [{label, icon, controls: [control.render()]}], hasTabChangeHandler, hasClickHandler, hasHoverHandler, style, visible }`
— `value` is the active tab index; `hasTabChangeHandler` is
`!!this.onTabChanged`.

`renderElement`: Chrome-style tab buttons (active tab overlaps the panel's
top border via `-mb-px` + `z-10`) above a bordered panel; each tab's
controls render into their own `[data-tab-panel]` div, hidden via
`display: none` for every non-active tab (they remain in the DOM the whole
time so they still gather/patch correctly). `data.value` (not a hardcoded
`0`) picks which tab starts active, for both the initial tab-button styling
and which panel is visible.

**Implementation note for `onTabChanged`**: `dispatchControlEvent` resolves
the DOM event name `'tabchange'` to a handler named `onTabchange` (only the
first letter capitalized, per the framework's
`` `on${Capitalize(eventName)}` `` convention — same as `WiseDataTable`'s
`onFilterchange`/`onRowselect`/`onCellchange`). `onTabchange` is an internal
arrow function (so `this` stays the control instance despite
`dispatchControlEvent`'s `handler.call(win)`) that computes the previous/
current tab index via an internally tracked `this._lastActiveIndex`, and
calls the public `onTabChanged(previousTab, currentTab)` if supplied.

`patchElement(winEl, data, context)` — does two things, not just one:
delegates to each tab's controls' own registered `patchElement` (including
hidden tabs' controls), **and** re-syncs which tab button/panel is showing
based on `data.value` — this second part is what makes a handler's
server-side `setValue()` call (jumping to a specific tab without the user
clicking it) actually take visible effect in the browser on the next patch.

### `WiseFrame` — container

`new WiseFrame(title = '', options)` — a titled box grouping child controls
(the "fieldset with a nicer look" of the catalog). `options.onClick`/
`options.onHover` also accepted.

**Methods**
- **`addControl(control)`** — pushes onto this frame's own `this.controls`
  array (distinct from, and not to be confused with, `WiseWindow.addControl`
  — call this on the frame instance *before* passing the frame itself to
  the window's `addControl`). Returns `this` (chainable).
- **`getChildControls()`** — returns `this.controls` (this frame's
  immediate children; same non-deep-recursive caveat as the other
  containers). Framework-internal.
- **`getValue()`** / **`setValue(value)`** — inherited, but not meaningful
  here (a frame has no scalar value of its own). Listed for completeness.

**Events**
- **`onClick`** — generic, on the frame's own root wrapper.
- **`onHover`** — generic, same wrapper.

`render()`:
`{ type, id, dataField, title, controls: [control.render()], hasClickHandler, hasHoverHandler, style, visible }`.
`renderElement`: a bordered/padded wrapper `<div>` with an optional
uppercase title heading, then a flex-column body rendering each child via
`context.desktop.renderControl(...)`. `patchElement(winEl, data, context)`
— delegates to each child control's own registered `patchElement`.

### `WiseDataTable` — container (partial exception, see below)

`new WiseDataTable(options)`:

| Option | Default | Meaning |
|---|---|---|
| `pageSize` | `10` | |
| `currentPage` | `1` | |
| `pageSizeOptions` | `[]` | **not** `[10,25,50,100]` — populates the page-size `<select>` only if you actually pass a non-empty array |
| `sortField` | `null` | |
| `sortDirection` | `'asc'` | |
| `onDataFilterChanged` | `null` | `(pageSize, currentPage) => ...`, invoked whenever paging/sorting/page-size changes |
| `onRowSelect` | `null` | `(rowData) => ...`, invoked on a row click (only wired up if this is set — see below) |
| `onClick` | `null` | generic — see the shared note above; wired on this control's own outer wrapper element, distinct from `onRowSelect`/cell-level `onClick` |
| `onHover` | `null` | generic, same wrapper |
| `style` | `{}` | |

`columns = []` and `data = []` start empty (set via `setColumns`/`setData`,
not constructor options). `totalCount = 0` similarly. **There is no
`striped` option** — zebra striping (alternating row background) is always
on, unconditionally, with no way to disable it via options.

**There is no `getChildControls()` method and no `addToolbarControl()`
method on this class at all.** A `WiseDataTable` never gets nested into
`WiseWindow.registerControl`'s recursive child-registration, and there is
no toolbar-controls concept.

**Methods**
- **`setColumns(columns)`** — replaces `this.columns`. Returns `this`. See
  "Column shape" below for what each entry accepts.
- **`setData(rows, totalCount)`** — replaces the current page's rows +
  total count. Call this from your `onDataFilterChanged` handler (or once
  up front for a static dataset). This control never holds — or expects —
  the whole dataset at once, only the current page. Returns `this`.
- **`getData()`** — returns `this.data` (the current page's rows only, same
  caveat as above). The counterpart read accessor to `setData`. This is
  the control's version of the generic `getValue()`/`setValue()` pair every
  other control gets from the base class — `WiseDataTable` doesn't have a
  single scalar `value` that fits that shape, so it gets
  `getData()`/`setData()` instead (see `WiseControl`'s "Instance methods"
  section above).

**`client/applications/Controls/repositories/ApiEmployeeRepository.js`**
— the one shipped example of an app-owned repository (see ARCHITECTURE.md
§12): the Controls app's `WinControls.js` feeds this control's demo
"Team Directory" table from it, instantiating it directly
(`new ApiEmployeeRepository()`, module scope) rather than reaching into
`WiseApplicationSystem` for a shared one, since employee records aren't a
system-wide concern — nothing else in WAS touches them. Same `Api*Repository`
shape as the system-level ones: `async listEmployees({limit, offset, sortField, sortDirection})`
(`GET /api/employees?<querystring>`, falls back to `{rows: [], totalCount: 0}`
on failure) and `async updateEmployee(id, fields)` (`PATCH /api/employees/:id`,
throws on failure, returns `data.employee`). See
`docs/DEVELOPMENT_GUIDE.md` §5/§6 for the full worked example.

**Events** (control-level — see "Column-level events" below for the
separate per-cell handlers)
- **`onDataFilterChanged(pageSize, currentPage)`** — fires whenever paging,
  page size, or sorting changes (sort field/direction are read off
  `this.sortField`/`this.sortDirection` inside the handler, not passed as
  arguments). Re-fetch the matching page and call `setData()` in response —
  see `docs/DEVELOPMENT_GUIDE.md` §5 for a worked example.
- **`onRowSelect(rowData)`** — fires when a row is clicked, with the full
  row object. Only wired up in the DOM at all if this option is supplied.
- **`onClick`** — generic; wired on this control's own **outer wrapper**
  element, distinct from `onRowSelect`/the column-level `onClick` below —
  fires for a click anywhere in the table that isn't otherwise claimed by
  a row-select or a cell's own interactive element.
- **`onHover`** — generic, same wrapper.

Column-level events (per-column functions passed into `setColumns`, not
control-level options):
- **`onClick(rowData, rowIndex)`** — for a `'button'`-type column; fires
  when that row's button is clicked.
- **`onChange(rowData, newValue, rowIndex)`** — for `'checkbox'`/
  `'combobox'`/`'radiobutton'`-type columns; fires when that cell's value
  changes.

The constructor also assigns four handlers as **arrow function properties
on the instance** (not prototype methods), specifically so `this` stays the
`WiseDataTable` instance even though `dispatchControlEvent` invokes them via
`handler.call(win)` — arrow functions ignore `.call()`'s `this` override.
These are internal plumbing, not part of the public options above, but
their exact (lowercase-only-first-letter-capitalized) names matter, since
`dispatchControlEvent` looks them up as `` `on${Capitalize(eventName)}` ``:

| Instance property | Dispatched event name | Bridges to |
|---|---|---|
| `onFilterchange` | `'filterchange'` | reads `this.value` (`{pageSize?, currentPage?, sortField?, sortDirection?}`), applies whichever fields are present onto the matching instance property, then calls the public `onDataFilterChanged(this.pageSize, this.currentPage)` if set |
| `onRowselect` | `'rowselect'` | reads `this.value.rowIndex`, looks up `this.data[rowIndex]`, calls the public `onRowSelect(row)` if both exist |
| `onCellchange` | `'cellchange'` | reads `this.value` (`{rowIndex, dataField, newValue}`), finds the matching column + row, calls that column's own `onChange(row, newValue, rowIndex)` if defined |
| `onCellclick` | `'cellclick'` | reads `this.value` (`{rowIndex, dataField}`), finds the matching column + row, calls that column's own `onClick(row, rowIndex)` if defined |

Every browser-side interaction (sorting a header, changing the page/page
size, clicking a row, a cell button/checkbox/combobox/radio change) fires
its corresponding event via `context.desktop.sendControlEvent(appId, data.id, el, '<eventname>', { [data.id]: <payload> })` — this is exactly the same
mechanism `WiseFileUpload` uses to deliver an async result: `dispatchControlEvent`
syncs `values[id]` onto `win[id].value` *before* calling the handler, so
`this.value` inside these arrow functions is always the freshly delivered
payload, never something read passively off the DOM.

Column shape (each entry in the array passed to `setColumns`):
`{ dataField, header, width, sortable (default true, forced off if there's no dataField), type, label, items, onClick, onChange }`.
`type` is one of `'button'`, `'checkbox'`, `'combobox'`, `'radiobutton'`,
`'image'`, or omitted/anything else for plain text. For `'combobox'`/
`'radiobutton'`, `items` entries may be either a plain primitive (used as
both value and label) or `{value, label}` — both shapes are handled. The
`'image'` type is **read-only** — it just renders `<img src="{cellValue}">`
(or a neutral placeholder icon if the cell is empty), there is no built-in
edit affordance for it.

`render()`: `{ type, id, dataField, columns, data, totalCount, pageSize, currentPage, pageSizeOptions, sortField, sortDirection, hasRowSelectHandler, hasClickHandler, hasHoverHandler, style, visible }`.

`renderElement`: a pager, the table itself, and a second identical pager —
**both a top and a bottom pager**, wired to the same `fireFilterChange`
helper, so paging is reachable without scrolling a long table. Header
cells are click-sortable (toggles asc/desc, resets to page 1) whenever
`col.sortable !== false && col.dataField` is truthy, showing a ▲/▼ next to
the active sort column's header text; **sorting/paging are entirely
client-driven round trips** — the table always re-fetches via
`onDataFilterChanged` rather than re-sorting whatever's already loaded
client-side. Rows get a click-to-select handler (firing `'rowselect'`) only
if `data.hasRowSelectHandler` is true; that handler explicitly ignores
clicks that land on any element flagged `[data-cell-interactive]` (a cell's
own button/checkbox/select/radio), so interacting with a cell control
doesn't also select the row.

`static buildPageList(current, total)` — windows the page-number button
list around the current page (showing all pages if `total <= 7`, otherwise
leading/trailing `'…'` as needed) rather than rendering a button per page
when there are many.

`static patchElement(winEl, data, context)` — **the partial exception** to
"a container must delegate `patchElement` to its children" (ARCHITECTURE.md
§2 point 5): rather than patching individual cells, it finds the existing
`[data-control-id]` node and calls `.replaceWith(WiseDataTable.renderElement(data, context))`
— a full re-render of its own subtree from the fresh JSON. This is
necessary because the DOM shape here depends on row count/sort/pager state,
which changes on essentially every interaction, making cell-by-cell
diffing not worth it.

`static gatherValue()` — always returns `undefined`; every interaction
sends its payload explicitly via `overrideValues` (see the handler table
above), so there's nothing meaningful to read passively off this control's
DOM.

---

## `Api*Repository` classes — client-side, HTTP-only

**These are the client-side repositories** — thin `fetch` wrappers around
the REST API server, run inside the client process (or, in principle, the
browser, though in practice only server-side code constructs them). They
never touch PostgreSQL directly. Contrast with
`server/applications/WiseapeApplicationSystem/src/models/*Model.js` — those
are the ones that actually run SQL against Postgres, inside the *other*
process; see ARCHITECTURE.md §12 for the two-repository-pattern overview.
This document intentionally does not detail the server-side models (that's
REST-API-internal); if you're adding a new database-backed feature, it
belongs there, exposed through a new REST route, then wrapped by a
corresponding new `Api*Repository` client-side.

The four below (`system/Api*Repository.js`) are framework-wide
infrastructure, constructed once by the shared `WiseApplicationSystem`
instance — see its "Properties" table above (`ApiAuthRepository` is the
exception: it's *also* used this way by `client/app.js`'s own auth proxy
routes, but is not itself a `WiseApplicationSystem` property; see its own
entry below). A repository that's only relevant to **one specific
application** is **not** listed here — it lives instead in that
application's own `client/applications/<AppName>/repositories/` folder,
instantiated directly by that app's code, not wired into
`WiseApplicationSystem` at all. `Controls/repositories/ApiEmployeeRepository.js`
is the one shipped example (documented alongside `WiseDataTable`'s entry
above, since it exists purely to feed that control's demo data — see
`docs/ARCHITECTURE.md` §12 for the "which folder does a new one belong in"
guidance).

All four below follow the same shape: `constructor(config = {})` reads
`config.baseUrl || process.env.API_BASE_URL || 'http://localhost:4000'`.

### `ApiAppRepository`

- **`getFallbackApps()`** — returns a fresh copy of 3 hardcoded apps
  (`helloWorld`, `settings`, `controls`) used when the REST API is
  unreachable.
- **`async listApplications()`** — `GET {baseUrl}/api/apps`; on a
  non-OK response, empty/non-array result, or thrown error, falls back to
  `getFallbackApps()` (logging a `console.warn`); otherwise maps each row
  to ensure `appIcon` defaults to `'◫'`.

### `ApiThemeRepository`

- **`getFallbackThemes()`** — 5 built-in themes (`macos-light`,
  `light-blue`, `midnight`, `sunset`, `forest`).
- **`async listThemes()`** — `GET {baseUrl}/api/themes`, reading
  `data.themes`; falls back the same way as `ApiAppRepository`.

### `ApiMenuRepository`

- **`getFallbackMenus()`** — a small hardcoded tree (a "Demos" group with
  HelloWorld + Controls, plus a top-level Settings item), deep-cloned via
  `JSON.parse(JSON.stringify(...))` per call.
- **`async listMenus()`** — `GET {baseUrl}/api/menus`; falls back the same
  way.

### `ApiAuthRepository`

The one repository that does **not** silently fall back on failure — auth
errors are meant to be loud. Internal helper
**`request(path, {method = 'GET', token, body} = {})`** attaches
`Authorization: Bearer <token>` when a token is given and
`Content-Type: application/json` when a body is given; on a non-OK
response, throws an `Error` carrying `.status` from the HTTP response.

| Method | Endpoint | Notes |
|---|---|---|
| `register(body)` | `POST /api/auth/register` | |
| `login(body)` | `POST /api/auth/login` | |
| `session(token)` | `GET /api/auth/session` | |
| `logout(token)` | `POST /api/auth/logout` | |
| `updatePreferences(token, prefs)` | `PUT /api/auth/preferences` | |
| `getSettings()` | `GET /api/auth/settings` | |
| `setSettings(token, requiresApproval)` | `PUT /api/auth/settings` with `{requiresApproval}` | |
| `listPendingUsers(token)` | `GET /api/auth/pending-users` | |
| `approveUser(token, id)` | `POST /api/auth/approve/:id` | |

**Every one of these hits the REST API server directly** (`baseUrl`, port
4000) — `client/app.js` only proxies four of them
(`register`/`login`/`session`/`logout`, see the routes table below).
The other five (`updatePreferences`/`getSettings`/`setSettings`/
`listPendingUsers`/`approveUser`) are **not** exposed as client routes at
all; they're called by `Win*.js`/`App*.js` handlers running *inside the
client process* through their **own separate** `ApiAuthRepository`
instances constructed directly in application code — see
`client/applications/Settings/forms/WinSettings.js` and
`client/applications/Admin/AppAdmin.js` / `.../forms/WinAdmin.js`, each of
which does `const authRepository = new ApiAuthRepository();` at module
scope and calls these methods with a token pulled from
`this.system.currentSession.token`.

---

## Express routes (`client/app.js`)

The client process exposes exactly this route list — nothing more:

| Method & path | Auth | Purpose |
|---|---|---|
| static `express.static('public/')` | — | everything under `client/public/` (HTML, CSS, `script.js`, uploaded background images under `/uploads/...`) |
| `GET /WiseDesktop.js` | — | serves `client/system/WiseDesktop.js` |
| `GET /WiseApplicationSystem.js` | — | serves `client/system/WiseApplicationSystem.js` |
| `GET /controls/:file` | — | serves `client/system/controls/<file>`, regex-whitelisted to `^Wise[A-Za-z]+\.js$` (404 otherwise) |
| `GET /app-assets/:appId/icon.svg` | — | resolves `appId` against `system.apps`, derives the folder from its `appStartPoint`, double-checks the resolved path stays inside `applications/`, serves `assets/icons/icon.svg` if readable; 404 otherwise |
| `GET /api/system` | — | `system.getSystemSnapshot()` |
| `GET /api/apps` | — | `system.getSystemSnapshot().apps` |
| `GET /api/menus` | — | `system.menus` (the pre-built tree, as-is) |
| `GET /api/themes` | — | `{ themes: system.themes, activeThemeId: system.activeThemeId, backgroundImage: system.backgroundImage }` |
| `POST /api/uploads` | — | raw image body (`express.raw`, 10mb limit, any content-type accepted at the middleware level); rejects with 400 unless `Content-Type` is exactly PNG/JPEG/GIF/WEBP; writes to `public/uploads/bg-<timestamp>-<random>.<ext>`; returns `{url: '/uploads/<filename>'}` |
| `POST /api/applications/run` | Bearer, optional | body `{appId}` (400 if missing); resolves the caller's session (if any) via `resolveSession(req)`, calls `system.runApplication(appId, session)`, returns its result JSON |
| `POST /api/applications/:appId/events` | Bearer, optional | body `{controlId, event, values}` (400 if `controlId` missing; `event` defaults to `'click'`, `values` to `{}`); resolves session, calls `system.dispatchControlEvent(...)`, returns its result JSON |
| `POST /api/auth/register` | — | proxies `authRepository.register(req.body)` |
| `POST /api/auth/login` | — | proxies `authRepository.login(req.body)` |
| `GET /api/auth/session` | Bearer | proxies `authRepository.session(token)` |
| `POST /api/auth/logout` | Bearer, optional | proxies `authRepository.logout(token)` |
| `GET *` (catch-all) | — | serves `public/index.html` |

**That is the exhaustive list.** There is **no** `/api/auth/settings`,
`/api/auth/pending-users`, or `/api/auth/approve/:id` route on the client —
those `ApiAuthRepository` methods exist and are used, but only by
server-side application code calling the REST API server directly (see
`ApiAuthRepository` above), never proxied through `client/app.js`. There is
also no `requireUser`/`requireAdmin` helper in `client/app.js` — that
enforcement lives entirely on the REST API server's own
`src/middleware/auth.js`.

`resolveSession(req)` (a local helper in `app.js`, not exported) reads the
`Authorization: Bearer <token>` header via `getBearerToken(req)`, and if a
token is present, calls `authRepository.session(token)`; returns
`{user, token}` if a user came back, else `null` — swallowing any thrown
error into `null` rather than propagating it. It never itself writes a 401
— callers that need a request to fail outright do so themselves (in
practice, none of the client's own routes require an authenticated caller;
`runApplication`/`dispatchControlEvent` both work anonymously, just with
`session` staying `null`).

`relayAuthError(res, error)` — the shared error handler for the four
`/api/auth/*` routes: `res.status(error.status || 500).json({ error: error.message || 'Internal server error' })`.

---

## Client bootstrap (`public/*.js`)

`client/public/` holds `index.html`, `styles.css`, `auth.js`, and
`script.js`. Neither file exposes a documented global — see
ARCHITECTURE.md §4 for the full boot sequence diagram.

### `public/script.js`

Plain top-level functions, not attached to `window`:

- **`boot()`** — called unconditionally at the bottom of the file. Reads
  `localStorage.was_token`; if present, calls `GET /api/auth/session` with
  it as a Bearer token. On success, stores the returned user under
  `localStorage.was_user` and calls `startDesktop(user)`. On any failure
  (non-OK response, no user in the body, or a thrown/network error), clears
  both `was_token` and `was_user` from `localStorage` and falls through to
  `renderAuthScreen(appRoot, { onAuthenticated: startDesktop })`.
- **`startDesktop(user)`** — constructs
  `new WiseApplicationSystem({ root: appRoot })` (note: **no `user`/`token`
  constructor option** — see the class's real constructor above) and
  `await system.run(user)`s it; on success, if `user.themeId` matches a
  loaded theme, calls `system.setActiveTheme(user.themeId)`, and if
  `user.backgroundImage !== undefined`, calls
  `system.setBackgroundImage(user.backgroundImage)`. On a thrown error,
  replaces `appRoot`'s content with a plain error message instead of
  throwing further.

### `public/auth.js`

Defines **`renderAuthScreen(root, { onAuthenticated })`** — builds the
entire login/register card into `root`, toggling between `'login'` and
`'register'` mode client-side (a name field and a confirm-password field
only render in `'register'` mode). On submit, `POST`s to
`/api/auth/login` or `/api/auth/register` accordingly; if the response
carries a `token`, stores it under `localStorage.was_token` (and the user
under `was_user`) and calls `onAuthenticated(result.user)`; if it's a
register response with no token (i.e. the account needs admin approval),
switches back to login mode and shows `result.message` inline instead.
There is **no `window.wiseapeLogout()` global** — logout is handled
entirely inline inside `WiseDesktop.renderDesktop()`'s own click listener
(see above), not delegated to `auth.js`.
