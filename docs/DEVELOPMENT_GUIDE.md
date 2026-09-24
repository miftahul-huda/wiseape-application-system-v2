# Building an Application for Wiseape Application System (WAS)

> Read `docs/ARCHITECTURE.md` first if you haven't — this guide assumes you
> already know *why* the system is shaped the way it is (isomorphic files,
> the generic control-event round trip, per-user context propagation). This
> document is the *how*: a step-by-step tutorial with working code, plus a
> reference table of every built-in control.

## 0. Running the dev server

WAS is two separate processes — the REST API (owns Postgres) and the client
(the desktop UI, where application code you write actually runs). Building
a new *application* only ever requires touching the **client** process:

```bash
cd client
npm run dev     # node --watch --env-file=.env app.js
```

The REST API also needs to be running (`cd server/applications/WiseapeApplicationSystem
&& npm run dev`) for apps/menus/themes/auth to resolve — see
`docs/RUNNING.md` for the full two-process setup, env vars, and
troubleshooting. All paths in this guide (`applications/...`,
`system/...`) are relative to the **`client/` directory**, since that's
where `node app.js` actually runs from.

`--watch` restarts the client process whenever a server-side file changes.
Anything served straight to the browser (`system/**/*.js`, `public/**`) is
re-read from disk on every request, so a browser refresh alone is enough
for pure front-end-rendering changes — but if you touched anything that
runs *inside* the Node process (an application's `App*.js`/`Win*.js`, an
`Api*Repository`, `WiseApplicationSystem.js`, `app.js` itself), the process
needs to restart, which `--watch` does automatically. `client/.env` holds
`PORT` and `API_BASE_URL` (gitignored; copy `client/.env.example`) — it
does **not** hold database credentials; the client never touches Postgres.

## 1. Anatomy of an application

```
client/applications/
  MyApp/
    AppMyApp.js              <- extends WiseApplication; entry point
    forms/
      WinMyApp.js             <- extends WiseWindow; builds the UI
    assets/
      icons/
        icon.svg              <- optional; a colorful 128x128 app icon
```

An application is **two classes**:

- `AppMyApp` (`WiseApplication` subclass) — its only real job is
  `run(appConfig, appParameter)`, which creates the app's main window via
  `this.createWindow(WinMyApp, {...})` and calls `.show()` on it.
- `WinMyApp` (`WiseWindow` subclass) — everything the user actually sees:
  controls, layout, event handlers.

Nothing needs to be registered in code to "install" the app — it's data in
the REST API's database (see §7). `WiseApplicationSystem.resolveApplicationClass`
`require()`s whatever file the `wiseape_apps.app_start_point` column points
to (e.g. `applications/MyApp/AppMyApp.js:AppMyApp`, resolved relative to the
client process's working directory — so this path is written exactly as it
appears under `client/`, without a `client/` prefix).

## 2. The smallest possible app

This is `applications/HelloWorld` verbatim — read it as the minimal
reference before building something more complex.

`applications/HelloWorld/AppHelloWorld.js`:

```js
const WiseApplication = require('../../system/WiseApplication');
const WinHello = require('./forms/WinHello');

class AppHelloWorld extends WiseApplication {
  run(appConfig = {}, appParameter = {}) {
    const helloWindow = this.createWindow(WinHello);
    helloWindow.show(appParameter);

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      status: 'started',
      window: helloWindow.toJSON(),
    };
  }
}

module.exports = AppHelloWorld;
```

`applications/HelloWorld/forms/WinHello.js`:

```js
const WiseWindow = require('../../../system/WiseWindow');
const WiseLabel = require('../../../system/controls/WiseLabel');
const WiseTextBox = require('../../../system/controls/WiseTextBox');
const WiseButton = require('../../../system/controls/WiseButton');

class WinHello extends WiseWindow {
  constructor(options = {}) {
    super(options);
    this.title = 'Hello World';
    this.appTitle = options.appTitle || 'HelloWorld';
    this.appIcon = options.appIcon || '✦';
    this.width = '900';
    this.height = '700';
  }

  // Called synchronously right after the window is constructed (by
  // createWindow()). Build every control here and register it with
  // addControl() -- that's what makes `this.txtName` etc. resolve later.
  onWindowInit() {
    this.controls = [];
    this.addControl(new WiseLabel('Hello World', { id: 'lblHello', style: { fontSize: 32 } }));
    this.addControl(new WiseTextBox('Enter your name', { id: 'txtName' }));
    this.addControl(new WiseButton('Say Hello', { id: 'btnSay', onClick: this.sayHelloAgain.bind(this) }));
    return this;
  }

  // A plain method. `.bind(this)` above is what makes `this` resolve to
  // the window here, regardless of how the framework invokes it later.
  sayHelloAgain() {
    this.lblHello.text('Hello, ' + this.txtName.value);
  }

  show(param = null) {
    this.visible = true;
    this.params = param;
    return super.show(param);
  }
}

module.exports = WinHello;
```

That's a complete, working app. Three things to internalize from this
example:

- **`onWindowInit()` is synchronous** and is where you build `this.controls`.
  If you need data from the database before the window can render properly,
  do *not* make `onWindowInit` async — see §6 for the correct pattern.
- **`addControl(control)`** both pushes the control into `this.controls`
  (which becomes the JSON sent to the browser) *and* registers it as
  `this[control.id]` — that's the only reason `this.lblHello` and
  `this.txtName` work inside `sayHelloAgain`.
- **Every event handler is `this.methodName.bind(this)`.** This is the
  entire "event handling" story — there is no separate registration step.

## 3. The control catalog

Import path for all of these: `require('../../../system/controls/<Name>')`
(adjust `../` depth to your file's location).

Every control's `options` object accepts, in addition to what's listed
below: `id` (string — required if you want to read/reference it later),
`dataField` (string — key used by `WiseWindow.getValues()`, defaults to
`id`), `visible` (bool, default `true`), `style` (plain object of CSS
properties, e.g. `{ fontSize: 15, marginTop: '8px' }`).

| Control | Constructor | Key options | `isInput`? |
|---|---|---|---|
| `WiseLabel` | `new WiseLabel(text, options)` | — | no |
| `WiseTextBox` | `new WiseTextBox(placeholder, options)` | `value`, `minLength`, `maxLength`, `onChange` | yes |
| `WiseNumericBox` | `new WiseNumericBox(placeholder, options)` | `value`, `min`, `max`, `step`, `prefix`, `suffix` (see note below) | yes |
| `WiseTextArea` | `new WiseTextArea(value, options)` | `placeholder`, `rows`, `onChange` | yes |
| `WiseButton` | `new WiseButton(label, options)` | `onClick` | no |
| `WiseComboBox` | `new WiseComboBox(items, options)` | `items: [{value,label}]`, `value`, `onChange`, `onItemChanged` | yes |
| `WiseRadioGroup` | `new WiseRadioGroup(items, options)` | same as combo box | yes |
| `WiseCheckboxGroup` | `new WiseCheckboxGroup(items, options)` | `value: string[]`, `onChange`, `onItemChecked` | yes |
| `WiseDate` | `new WiseDate(value, options)` | `onChange` | yes |
| `WiseDateRange` | `new WiseDateRange(value, options)` | `value: {start,end}`, `onChange` | yes |
| `WiseHtmlEditor` | `new WiseHtmlEditor(html, options)` | `onChange` (fires on blur) | yes |
| `WiseFileUpload` | `new WiseFileUpload(label, options)` | `accept`, `onChange` | yes |
| `WiseTableLayout` | `new WiseTableLayout(options)` | `rows`, `columns` | container |
| `WiseTabControl` | `new WiseTabControl(options)` | `activeIndex`, `onTabChanged` | container |
| `WiseFrame` | `new WiseFrame(title, options)` | `title` | container |
| `WiseDataTable` | `new WiseDataTable(options)` | see §5 | container |

`WiseNumericBox` renders as a text input with **live digit-grouping** as you
type (grouping/decimal separators auto-detected from the browser's locale
via `Intl.NumberFormat`, e.g. `1,234.56` in en-US vs `1.234,56` in id-ID) —
it is not a bare `<input type="number">`. `prefix`/`suffix` (e.g. `'Rp'`,
`'kg'`) render inline inside the control's own box. See
`docs/API_REFERENCE.md` for the full behavior.

`isInput: yes` means the control's value is included in
`WiseWindow.getValues()` (see §4). `WiseLabel`/`WiseButton` are display/
action-only and excluded. Container controls (`WiseTableLayout`,
`WiseTabControl`, `WiseDataTable`) don't have a value of their own — their
*nested* controls contribute instead (`WiseTabControl` is a partial
exception — see below).

### Every control's built-in accessors and events

Every control, regardless of type, inherits from `WiseControl` and so
always has:

- **`getValue()`** / **`setValue(value)`** — read/write `this.value`
  without touching the property directly. (`WiseDataTable` is the one
  exception — it has `getData()`/`setData(rows, totalCount)` instead,
  since a page of table rows isn't a single scalar value; see §5.)
- **`onClick`** / **`onHover`** options — fire a `click`/`hover` server
  event exactly like `onChange` does elsewhere, wired generically for
  every control by the base class. Both are opt-in: leave them unset and
  nothing extra is wired into the DOM. `WiseButton`'s own `onClick`
  already covers the button case (unchanged); every other control gets
  `onClick` as an additional, independent handler.

Three controls that manage a list of choices or a list of tabs also get a
**richer, item-aware event** layered on top of their plain `onChange`
(both can be supplied together — the plain one still fires with no
arguments, exactly as before):

```js
this.addControl(new WiseComboBox(
  [{ value: 'eng', label: 'Engineering' }, { value: 'sales', label: 'Sales' }],
  {
    id: 'cmbDept',
    onItemChanged: (previousItem, currentItem) => {
      // both are the full {value, label} item, or null
    },
  }
));

this.addControl(new WiseCheckboxGroup(
  [{ value: 'a', label: 'Option A' }],
  {
    id: 'checkOptions',
    onItemChecked: (item) => {
      // { value, label, checked: true|false } for whichever box just toggled
    },
  }
));

const tabs = new WiseTabControl({
  id: 'tabsDemo',
  onTabChanged: (previousTab, currentTab) => {
    // { label, controls } for the tab being left/entered
  },
});
```

`WiseComboBox`/`WiseRadioGroup` also get `setItems(items)`/`getItems()`,
and `WiseCheckboxGroup` gets the same pair, for changing the choice list
after construction (e.g. once a database-backed option list loads).

`onTabChanged` is the one case where this adds a real server round trip
where there wasn't one before — switching tabs itself is still instant and
purely client-side (the visible panel changes immediately either way); the
round trip only happens at all if `onTabChanged` is actually supplied.

### Example: most of the catalog in one window

```js
this.addControl(new WiseLabel('Favorite Color', { id: 'lblColor', style: { fontWeight: 700 } }));
this.addControl(new WiseRadioGroup(
  [{ value: 'red', label: 'Red' }, { value: 'blue', label: 'Blue' }],
  { id: 'radioColor', value: 'blue', dataField: 'color' }
));

this.addControl(new WiseComboBox(
  [{ value: 'eng', label: 'Engineering' }, { value: 'sales', label: 'Sales' }],
  { id: 'cmbDept', dataField: 'department', onChange: this.onDeptChange.bind(this) }
));

this.addControl(new WiseCheckboxGroup(
  [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }],
  { id: 'checkOptions', value: ['a'], dataField: 'options' }
));

this.addControl(new WiseDate('', { id: 'dateBirthday', dataField: 'birthday' }));
this.addControl(new WiseTextArea('', { id: 'txtBio', placeholder: 'Tell us...', rows: 3, dataField: 'bio' }));
this.addControl(new WiseFileUpload('Choose Avatar...', { id: 'uploadAvatar', dataField: 'avatar' }));
```

### Layout containers

`WiseTableLayout` places controls into an HTML-table-like grid, with
`colSpan`/`rowSpan` support:

```js
const table = new WiseTableLayout({ id: 'tableContact', rows: 2, columns: 2 });
table.setCell(0, 0, new WiseLabel('Name', { style: { fontWeight: 600 } }));
table.setCell(0, 1, new WiseTextBox('', { id: 'txtName', dataField: 'name' }));
table.setCell(1, 0, new WiseLabel('This spans both columns', {}), { colSpan: 2 });
this.addControl(table); // registers txtName as this.txtName automatically
```

`WiseTabControl` groups controls into tabs:

```js
const tabs = new WiseTabControl({ id: 'tabsDemo' });
tabs.addTab('Profile', [new WiseTextBox('', { id: 'txtNickname', dataField: 'nickname' })]);
tabs.addTab('Preferences', [new WiseCheckboxGroup([...], { id: 'checkPrefs', dataField: 'prefs' })]);
this.addControl(tabs);
```

**Rule:** any control you build that holds other controls *must* implement
`getChildControls()` (returns a flat array of every nested control, so
`WiseWindow.addControl` can auto-register their ids) **and** a
`static patchElement()` that delegates to each child's own `patchElement`
— see `docs/ARCHITECTURE.md` §2 point 5 for why skipping this corrupts the
DOM on the next unrelated event.

## 4. Reading form values

Don't hand-write `{ name: this.txtName.value, ... }` for every field —
`WiseWindow.getValues()` already does this generically:

```js
onSubmit() {
  const values = this.getValues();
  // { name: '...', department: 'eng', options: ['a'], birthday: '2024-01-01', ... }
  // keyed by each control's dataField (defaults to its id), only for
  // isInput controls (labels/buttons excluded), including nested controls
  // inside WiseTableLayout/WiseTabControl.
}
```

## 5. `WiseDataTable` — displaying and editing tabular data

This is the control to reach for whenever an app needs to show rows from
the database with paging, sorting, and inline editing. Full walkthrough
using `applications/Controls/forms/WinControls.js` (real, working code) as
the reference.

```js
const WiseDataTable = require('../../../system/controls/WiseDataTable');

// 1. Create it with paging config and the two top-level events:
const dtEmployees = new WiseDataTable({
  id: 'dtEmployees',
  pageSize: 5,
  pageSizeOptions: [5, 10, 20],
  onDataFilterChanged: this.onEmployeesFilterChanged.bind(this), // (pageSize, currentPage)
  onRowSelect: this.onEmployeeRowSelect.bind(this),               // (rowData)
});

// 2. Define columns. type defaults to 'text'; other types render an
//    interactive control per cell and fire their own handler:
dtEmployees.setColumns([
  { dataField: 'name', header: 'Name', width: 170 },
  {
    dataField: 'department', header: 'Department', width: 160, type: 'combobox',
    items: ['Engineering', 'Sales'], onChange: this.onDeptChange.bind(this), // (row, newValue, rowIndex)
  },
  {
    dataField: 'active', header: 'Active', width: 80, sortable: false, type: 'checkbox',
    onChange: this.onActiveChange.bind(this),
  },
  {
    dataField: 'actions', header: '', width: 100, sortable: false, type: 'button',
    label: 'Edit', onClick: this.onEditRow.bind(this), // (row, rowIndex)
  },
]);
this.addControl(dtEmployees);
```

```js
// 3. Feed it exactly one page of data at a time -- it never holds the
//    whole dataset. You decide how "a page" is computed (usually: a DB
//    query with LIMIT/OFFSET).
async applyEmployeesPage(pageSize, page) {
  const offset = (page - 1) * pageSize;
  const { rows, totalCount } = await this.system.employeeRepository.listEmployees({ limit: pageSize, offset });
  this.dtEmployees.pageSize = pageSize;
  this.dtEmployees.currentPage = page;
  this.dtEmployees.setData(rows, totalCount);
}

// 4. onDataFilterChanged fires whenever the user changes page or page size
//    -- just re-run the same query with the new numbers.
async onEmployeesFilterChanged(pageSize, page) {
  await this.applyEmployeesPage(pageSize, page);
}

async onDeptChange(row, newValue) {
  await this.system.employeeRepository.updateEmployee(row.id, { department: newValue });
}
```

`type: 'radiobutton'` works the same way as `checkbox`/`combobox` (an
`items` array, an `onChange(row, newValue, rowIndex)`). Column types
available: `'text'` (default, read-only), `'button'`, `'checkbox'`,
`'combobox'`, `'radiobutton'`, `'image'` (read-only thumbnail -- the cell
value is a URL, e.g. one produced by `WiseFileUpload`'s upload; a neutral
placeholder shows when it's empty).

Since `onWindowInit()` must stay synchronous but the first page of data
needs a database round trip, the standard pattern is:

```js
// WinMyApp.js
onWindowInit() {
  this.controls = [];
  // ... build dtEmployees as above, with EMPTY data ...
  return this;
}

async loadInitialData() {
  await this.applyEmployeesPage(this.dtEmployees.pageSize, this.dtEmployees.currentPage);
}
```

```js
// AppMyApp.js
async run(appConfig, appParameter) {
  const win = this.createWindow(WinMyApp, { /* ... */ });
  await win.loadInitialData(); // <-- awaited here, before show()
  win.show(appParameter);
  return { appID: this.appID, appTitle: this.appTitle, status: 'started', window: win.toJSON() };
}
```

## 6. Talking to the database from an application

There are **two different repository patterns** in this codebase — don't
mix them up:

- **Client-side (`client/system/Api*Repository.js`)** — what an
  application author almost always wants. A thin `fetch` wrapper that talks
  to the REST API server (`server/applications/WiseapeApplicationSystem/`)
  over HTTP. The client process has **no direct Postgres access at all**.
- **REST API-side (`server/applications/WiseapeApplicationSystem/src/models/*Model.js`)**
  — the ones that actually run SQL against Postgres, via a shared `pg` pool.
  You only touch this layer if you're adding a genuinely new
  database-backed resource (a new table), not just consuming one that
  already has a REST endpoint.

For a new app that needs its own data (e.g. "Notes"), the usual path is:
add a small resource to the REST API (routes/controller/service/model,
mirroring the existing `employees` resource as a template), then add a
matching client-side repository:

```js
// client/system/ApiNoteRepository.js
class ApiNoteRepository {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || process.env.API_BASE_URL || 'http://localhost:4000';
  }

  async listNotes(token) {
    const response = await fetch(`${this.baseUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    return response.json();
  }

  async addNote(token, body) {
    const response = await fetch(`${this.baseUrl}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body }),
    });
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    return response.json();
  }
}

module.exports = ApiNoteRepository;
```

Wire it into the system once, in `client/system/WiseApplicationSystem.js`'s
constructor (alongside `ApiAppRepository`/`ApiThemeRepository`/etc — inside
the `if (isServer)` branch):

```js
const ApiNoteRepository = require('./ApiNoteRepository');
// ...
if (isServer) {
  // ...
  this.noteRepository = new ApiNoteRepository(options.api || {});
}
```

Now any window can reach it via `this.system.noteRepository` (see §8 for
why `this.system` is always available, and how to get the caller's token to
pass into a repository method that needs auth).

If you're instead building the REST API side of a new resource, follow the
existing `src/models/*Model.js` pattern (a `pool` from `config/db.js`, an
idempotent `ensureSchema()` memoized with a flag so it only runs once) —
copy `employeesModel.js` as the template rather than starting from scratch.

## 7. Registering the app and adding it to a menu

Apps and menus live in the REST API's database, not in code —
`wiseape_apps` and `wiseape_menus`, owned by
`server/applications/WiseapeApplicationSystem/src/models/appsModel.js` and
`menusModel.js` respectively (both auto-seed a couple of demo rows on first
boot). For a new app you insert directly into that database:

```sql
INSERT INTO wiseape_apps (app_id, app_title, app_version, app_developer, app_icon, app_start_point, app_config, app_parameter)
VALUES ('notes', 'Notes', '1.0.0', 'Wiseape', '📝',
        'applications/Notes/AppNotes.js:AppNotes', '{}', '{}');

-- Add it to the desktop as a top-level menu item (or nest it into a group
-- by setting parent_id to an existing group's menu_id):
INSERT INTO wiseape_menus (parent_id, menu_type, label, app_id, sort_order)
VALUES (NULL, 'item', 'Notes', 'notes', 2);
```

`app_icon` is the *fallback glyph* (used only if `assets/icons/icon.svg`
doesn't exist, or hasn't loaded yet) — see §10 for the real per-app icon
file. `app_start_point` is `<path relative to the client/ directory>:<exported
class name>` — exactly how `resolveApplicationClass` `require()`s it (see §1).

## 8. Per-user context inside a window

There is **one shared `WiseApplicationSystem` instance** for the whole
client process (see `docs/ARCHITECTURE.md` §2 point 6) — a window does not
get its own private "current user" property. Instead, every `WiseWindow`
reaches the caller of the *current* event through `this.system.currentSession`
— `{ user: {id, name, email, role, themeId, backgroundImage}, token }`, or
`null` if nobody is logged in for this request. It's re-resolved from the
Bearer token on **every single request** by `client/app.js#resolveSession`,
not cached on the window or the app instance:

```js
onWindowInit() {
  this.controls = [];
  const user = this.system && this.system.currentSession && this.system.currentSession.user;
  if (user) {
    this.addControl(new WiseLabel(`Logged in as ${user.name}`, { id: 'lblUser' }));
  }
  if (user && user.role === 'admin') {
    // build an admin-only section
  }
  return this;
}

async onAddNote() {
  const session = this.system.currentSession;
  if (!session) return;
  await this.system.noteRepository.addNote(session.token, this.txtNewNote.value);
}
```

**Gotcha:** if a handler saves a change to the user's own record (a
preference, e.g. theme/background), it must **also** mutate
`this.system.currentSession.user` in memory immediately, synchronously,
*before* the handler returns — not just fire off the database save. This is
because `dispatchControlEvent` builds its response (which is what echoes
the new theme/background to the browser) from that same in-memory
`session.user` object right after the handler resolves, and it does not
re-fetch from the database. See
`applications/Settings/forms/WinSettings.js#persistPreferences` for the
reference implementation, and `docs/ARCHITECTURE.md` §8 for the full
mechanism (including its one narrow, deliberately-accepted race window).

## 9. In-window alerts (there is no multi-window dialog system)

A `WiseWindow` **cannot** open a second window — only `WiseApplication` can
(its one main window, via `createWindow()`, normally called once from
`run()`). There is no `createWindow()` on `WiseWindow`, and a control
event's response only ever carries exactly one window back to the browser
— see `docs/ARCHITECTURE.md` §5.

For a notification/alert/confirmation, use `showInfo()` instead — a modal
overlay (not a second draggable window), available on both `WiseWindow` and
`WiseApplication`:

```js
async onSave() {
  try {
    await this.system.noteRepository.addNote(this.system.currentSession.token, this.txtNewNote.value);
    this.showInfo('Saved', 'Your note was saved.', 'success');
  } catch (error) {
    this.showInfo('Error', error.message, 'error');
  }
}
```

`type` is one of `'information'` (default), `'success'`, `'warning'`,
`'error'` — each renders with a different icon. Internally this just queues
`this.pendingInfo`, which `WiseWindow.toJSON()` reads and clears into an
`info` field on the next response; `WiseDesktop` shows it as a centered
modal card (`showInfoDialog`) whenever a window response or a control-event
response carries one. You don't need to know any of that to use it — just
call `this.showInfo(...)`.

## 10. Giving your app a colorful icon

Drop a `128×128` SVG at `applications/<AppName>/assets/icons/icon.svg`. Make
the background rect span the full canvas edge-to-edge (no inset margin —
the container it's placed in has no border once a real icon loads):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="128" height="128" rx="28" fill="url(#bg)"/>
  <g transform="translate(32,32) scale(2.6667)" fill="#ffffff">
    <!-- your glyph, drawn on a 24x24 grid, translate/scale already centers it -->
  </g>
</svg>
```

No route registration needed — `GET /app-assets/:appId/icon.svg` in `app.js`
already resolves any app's icon from its `appStartPoint` automatically. If
the file doesn't exist, the desktop/dock/Launchpad silently fall back to
the `app_icon` glyph from the database.

## 11. Testing checklist before calling a feature done

1. `node --check <every file you touched>` — syntax errors fail loudly and
   instantly, cheaper than finding them via the browser.
2. Restart the client dev server (`cd client && npm run dev` — kill any
   stale `node app.js`/`node --watch` processes first; they accumulate
   across long sessions and will fight over the port). Confirm the REST API
   process is also still running — most app breakage during development is
   actually "the REST API isn't up," not a bug in your new code.
3. Actually open the app in a browser (or drive it headlessly with
   Playwright) — a syntax check proves the file parses, not that the
   feature works. Click the actual control, confirm the actual DOM update,
   check the browser console for errors.
4. If you added a database-backed feature, verify the write actually
   persisted — re-fetch from a *fresh* app/window instance (or a fresh
   login) rather than trusting the just-mutated in-memory object.

## 12. Common pitfalls (from real bugs hit during development)

- **Forgetting `patchElement` on a container control** silently wipes its
  children on the next unrelated event in the same window. Always pair
  `getChildControls()` with a delegating `patchElement`.
- **Two control files declaring the same top-level `const` name** without
  the IIFE wrapper breaks every control file loaded after it, silently (no
  error visible unless you check the browser console). Always wrap a new
  control file's entire body in `(function () { ... })();`.
- **Radio buttons across two windows of the same app** need their `name`
  attribute scoped per window instance (`${windowId}-${controlId}`), not
  just per control id — otherwise the browser treats them as one native
  radio group across the whole page and selecting one un-checks the other
  window's. `WiseRadioGroup` already does this; keep the pattern if you
  build a new control with native radio inputs.
- **An unhandled `pg` pool `'error'` event crashes the whole REST API
  process**, not just the one request — this only applies if you're adding
  a new table/model on the REST API side (§6); `config/db.js`'s shared
  `pool.on('error', ...)` already covers every model that reuses it, so you
  only need to worry about this if you create a *separate* pool/client.
- **`onWindowInit()` must stay synchronous.** If you need async setup data,
  add a separate `async loadInitialData()` method and `await` it from the
  app's `run()`, after `createWindow()` and before `.show()`.
- **A handler that changes the current user's theme/background must mutate
  `this.system.currentSession.user` in memory too**, not just save it to
  the database — see §8. Skipping this makes the change appear to silently
  not take effect until the next login.
