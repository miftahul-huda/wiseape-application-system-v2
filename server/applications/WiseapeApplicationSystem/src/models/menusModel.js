const db = require('../../config/db');

const FALLBACK_MENUS = [
  { id: 1, parentId: null, type: 'group', label: 'Demos', icon: null, appId: null, sortOrder: 0 },
  { id: 2, parentId: 1, type: 'item', label: 'HelloWorld', icon: null, appId: 'helloWorld', sortOrder: 0 },
  { id: 3, parentId: 1, type: 'item', label: 'Controls', icon: null, appId: 'controls', sortOrder: 1 },
  { id: 4, parentId: null, type: 'item', label: 'Settings', icon: null, appId: 'settings', sortOrder: 1 },
  { id: 5, parentId: null, type: 'group', label: 'Wise HRIS', icon: '🏢', appId: null, sortOrder: 3 },
  { id: 6, parentId: 5, type: 'item', label: 'Wise HRIS', icon: '🏢', appId: 'hris', sortOrder: 0 },
  { id: 7, parentId: 5, type: 'item', label: 'Employee Management', icon: '👤', appId: 'employeeManagement', sortOrder: 1 },
  { id: 8, parentId: 5, type: 'item', label: 'Organization Management', icon: '🏛️', appId: 'organizationManagement', sortOrder: 2 },
  { id: 9, parentId: 5, type: 'item', label: 'Master Data Management', icon: '🗂️', appId: 'masterDataManagement', sortOrder: 3 },
  { id: 10, parentId: 5, type: 'item', label: 'Recruitment', icon: '🎯', appId: 'recruitment', sortOrder: 4 },
  { id: 11, parentId: null, type: 'group', label: 'Report', icon: '📊', appId: null, sortOrder: 4 },
  { id: 12, parentId: 11, type: 'item', label: 'Report Designer', icon: '📊', appId: 'reportDesigner', sortOrder: 0, showInTaskbar: false },
  { id: 13, parentId: 11, type: 'item', label: 'Report Viewer', icon: '📈', appId: 'reportViewer', sortOrder: 1, showInTaskbar: false },
  { id: 14, parentId: null, type: 'group', label: 'Utilities', icon: '🧰', appId: null, sortOrder: 5 },
  { id: 15, parentId: 14, type: 'item', label: 'Kong Manager', icon: '🦍', appId: 'kongManager', sortOrder: 0, showInTaskbar: false },
  { id: 16, parentId: 14, type: 'item', label: 'Kafka Manager', icon: '📨', appId: 'kafkaManager', sortOrder: 1, showInTaskbar: false },
  { id: 17, parentId: 14, type: 'item', label: 'Event Message Manager', icon: '📬', appId: 'eventMessageManager', sortOrder: 2, showInTaskbar: false },
];

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS wiseape_menus (
      menu_id SERIAL PRIMARY KEY,
      parent_id INTEGER REFERENCES wiseape_menus(menu_id) ON DELETE CASCADE,
      menu_type TEXT NOT NULL DEFAULT 'item',
      label TEXT NOT NULL,
      icon TEXT,
      app_id TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      show_in_taskbar BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);

  // show_in_taskbar was added later: migrate existing tables once. Only on that first run are the
  // helper apps hidden from the desktop taskbar (they stay reachable from the Launchpad); after that
  // the flag is whatever is stored, so later manual changes are never overwritten.
  const taskbarColumn = await db.query(
    "SELECT 1 FROM information_schema.columns WHERE table_name = 'wiseape_menus' AND column_name = 'show_in_taskbar'"
  );
  if (taskbarColumn.rowCount === 0) {
    await db.query('ALTER TABLE wiseape_menus ADD COLUMN show_in_taskbar BOOLEAN NOT NULL DEFAULT TRUE');
    await db.query(
      "UPDATE wiseape_menus SET show_in_taskbar = FALSE WHERE app_id IN ('reportViewer', 'reportDesigner', 'kongManager', 'kafkaManager')"
    );
  }

  const countResult = await db.query('SELECT COUNT(*)::int AS count FROM wiseape_menus');
  if (countResult.rows[0].count === 0) {
    const groupResult = await db.query(
      `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
       VALUES (NULL, 'group', 'Demos', NULL, NULL, 0) RETURNING menu_id`
    );
    const groupId = groupResult.rows[0].menu_id;

    await db.query(
      `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order) VALUES
       ($1, 'item', 'HelloWorld', NULL, 'helloWorld', 0),
       ($1, 'item', 'Controls', NULL, 'controls', 1)`,
      [groupId]
    );

    await db.query(
      `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
       VALUES (NULL, 'item', 'Settings', NULL, 'settings', 1)`
    );
  }

  schemaReady = true;
}

let adminMenuSeeded = false;

async function ensureAdminMenuSeeded() {
  if (adminMenuSeeded) return;

  const existing = await db.query('SELECT 1 FROM wiseape_menus WHERE app_id = $1', ['admin']);
  if (existing.rowCount === 0) {
    await db.query(
      `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
       VALUES (NULL, 'item', 'Admin', NULL, 'admin', 2)`
    );
  }

  // Ensure 'Wise HRIS' group exists in database
  let hrisGroupId = null;
  const existingGroup = await db.query(
    "SELECT menu_id FROM wiseape_menus WHERE menu_type = 'group' AND label = 'Wise HRIS'"
  );
  if (existingGroup.rowCount > 0) {
    hrisGroupId = existingGroup.rows[0].menu_id;
  } else {
    const res = await db.query(
      `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
       VALUES (NULL, 'group', 'Wise HRIS', '🏢', NULL, 3) RETURNING menu_id`
    );
    hrisGroupId = res.rows[0].menu_id;
  }

  // Ensure child menu item 'hris'
  const existingHris = await db.query(
    'SELECT 1 FROM wiseape_menus WHERE parent_id = $1 AND app_id = $2',
    [hrisGroupId, 'hris']
  );
  if (existingHris.rowCount === 0) {
    await db.query(
      `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
       VALUES ($1, 'item', 'Wise HRIS', '🏢', 'hris', 0)`,
      [hrisGroupId]
    );
  }

  // Ensure child menu item 'employeeManagement'
  const existingEmp = await db.query(
    'SELECT 1 FROM wiseape_menus WHERE parent_id = $1 AND app_id = $2',
    [hrisGroupId, 'employeeManagement']
  );
  if (existingEmp.rowCount === 0) {
    await db.query(
      `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
       VALUES ($1, 'item', 'Employee Management', '👤', 'employeeManagement', 1)`,
      [hrisGroupId]
    );
  }

  // Ensure child menu item 'organizationManagement'
  const existingOrg = await db.query(
    'SELECT 1 FROM wiseape_menus WHERE parent_id = $1 AND app_id = $2',
    [hrisGroupId, 'organizationManagement']
  );
  if (existingOrg.rowCount === 0) {
    await db.query(
      `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
       VALUES ($1, 'item', 'Organization Management', '🏛️', 'organizationManagement', 2)`,
      [hrisGroupId]
    );
  }

  // Ensure child menu item 'masterDataManagement'
  const existingMaster = await db.query(
    'SELECT 1 FROM wiseape_menus WHERE parent_id = $1 AND app_id = $2',
    [hrisGroupId, 'masterDataManagement']
  );
  if (existingMaster.rowCount === 0) {
    await db.query(
      `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
       VALUES ($1, 'item', 'Master Data Management', '🗂️', 'masterDataManagement', 3)`,
      [hrisGroupId]
    );
  }

  // Ensure child menu item 'recruitment'
  const existingRecruitment = await db.query(
    'SELECT 1 FROM wiseape_menus WHERE parent_id = $1 AND app_id = $2',
    [hrisGroupId, 'recruitment']
  );
  if (existingRecruitment.rowCount === 0) {
    await db.query(
      `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
       VALUES ($1, 'item', 'Recruitment', '🎯', 'recruitment', 4)`,
      [hrisGroupId]
    );
  }

  // 'Report' group: Report Designer + Report Viewer
  let reportGroupId = null;
  const existingReportGroup = await db.query(
    "SELECT menu_id FROM wiseape_menus WHERE menu_type = 'group' AND label = 'Report'"
  );
  if (existingReportGroup.rowCount > 0) {
    reportGroupId = existingReportGroup.rows[0].menu_id;
  } else {
    const res = await db.query(
      `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
       VALUES (NULL, 'group', 'Report', '📊', NULL, 4) RETURNING menu_id`
    );
    reportGroupId = res.rows[0].menu_id;
  }
  const reportItems = [
    { label: 'Report Designer', icon: '📊', appId: 'reportDesigner', sortOrder: 0 },
    { label: 'Report Viewer', icon: '📈', appId: 'reportViewer', sortOrder: 1 },
  ];
  for (const item of reportItems) {
    const existingItem = await db.query(
      'SELECT 1 FROM wiseape_menus WHERE parent_id = $1 AND app_id = $2',
      [reportGroupId, item.appId]
    );
    if (existingItem.rowCount === 0) {
      await db.query(
        `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order, show_in_taskbar)
         VALUES ($1, 'item', $2, $3, $4, $5, FALSE)`,
        [reportGroupId, item.label, item.icon, item.appId, item.sortOrder]
      );
    }
  }

  // 'Utilities' group: Kong Manager + Kafka Manager
  let utilitiesGroupId = null;
  const existingUtilitiesGroup = await db.query(
    "SELECT menu_id FROM wiseape_menus WHERE menu_type = 'group' AND label = 'Utilities'"
  );
  if (existingUtilitiesGroup.rowCount > 0) {
    utilitiesGroupId = existingUtilitiesGroup.rows[0].menu_id;
  } else {
    const res = await db.query(
      `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
       VALUES (NULL, 'group', 'Utilities', '🧰', NULL, 5) RETURNING menu_id`
    );
    utilitiesGroupId = res.rows[0].menu_id;
  }
  const utilityItems = [
    { label: 'Kong Manager', icon: '🦍', appId: 'kongManager', sortOrder: 0 },
    { label: 'Kafka Manager', icon: '📨', appId: 'kafkaManager', sortOrder: 1 },
    { label: 'Event Message Manager', icon: '📬', appId: 'eventMessageManager', sortOrder: 2 },
  ];
  for (const item of utilityItems) {
    const existingItem = await db.query(
      'SELECT 1 FROM wiseape_menus WHERE parent_id = $1 AND app_id = $2',
      [utilitiesGroupId, item.appId]
    );
    if (existingItem.rowCount === 0) {
      await db.query(
        `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order, show_in_taskbar)
         VALUES ($1, 'item', $2, $3, $4, $5, FALSE)`,
        [utilitiesGroupId, item.label, item.icon, item.appId, item.sortOrder]
      );
    }
  }

  adminMenuSeeded = true;
}

async function listMenus() {
  try {
    await ensureSchema();
    await ensureAdminMenuSeeded();
    const result = await db.query(
      `SELECT menu_id AS id, parent_id AS "parentId", menu_type AS type, label, icon, app_id AS "appId", sort_order AS "sortOrder", show_in_taskbar AS "showInTaskbar"
       FROM wiseape_menus
       ORDER BY parent_id NULLS FIRST, sort_order ASC, label ASC`
    );
    return result.rows;
  } catch (error) {
    console.warn('[WAS API] wiseape_menus unavailable, using fallback list:', error.message);
    return FALLBACK_MENUS.map((menu) => ({ ...menu }));
  }
}

module.exports = { listMenus };
