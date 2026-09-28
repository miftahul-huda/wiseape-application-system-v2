const db = require('../../config/db');

async function seedHris() {
  try {
    console.log('[WAS Seeder] Seeding HRIS and Employee Management applications...');

    // 1. Insert or update HRIS into wiseape_apps
    const existingHris = await db.query('SELECT 1 FROM wiseape_apps WHERE app_id = $1', ['hris']);
    if (existingHris.rowCount === 0) {
      await db.query(
        `INSERT INTO wiseape_apps (app_id, app_title, app_version, app_developer, app_icon, app_libraries, app_config, app_start_point, app_parameter)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          'hris',
          'Wise HRIS',
          '1.0.0',
          'Wiseape',
          '🏢',
          JSON.stringify(['Wiseape WAS']),
          JSON.stringify({}),
          'applications/HRIS/AppHRIS.js:AppHRIS',
          JSON.stringify({}),
        ]
      );
      console.log('[WAS Seeder] Inserted app: hris');
    } else {
      await db.query(
        `UPDATE wiseape_apps
         SET app_title = $2, app_start_point = $3, app_icon = $4
         WHERE app_id = $1`,
        ['hris', 'Wise HRIS', 'applications/HRIS/AppHRIS.js:AppHRIS', '🏢']
      );
      console.log('[WAS Seeder] Updated app: hris');
    }

    // 2. Insert or update Employee Management into wiseape_apps
    const existingEmp = await db.query('SELECT 1 FROM wiseape_apps WHERE app_id = $1', ['employeeManagement']);
    if (existingEmp.rowCount === 0) {
      await db.query(
        `INSERT INTO wiseape_apps (app_id, app_title, app_version, app_developer, app_icon, app_libraries, app_config, app_start_point, app_parameter)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          'employeeManagement',
          'Employee Management',
          '1.0.0',
          'Wiseape',
          '👤',
          JSON.stringify(['Wiseape WAS']),
          JSON.stringify({}),
          'applications/HRIS/EmployeeManagement/AppEmployeeManagement.js:AppEmployeeManagement',
          JSON.stringify({}),
        ]
      );
      console.log('[WAS Seeder] Inserted app: employeeManagement');
    } else {
      await db.query(
        `UPDATE wiseape_apps
         SET app_title = $2, app_start_point = $3, app_icon = $4
         WHERE app_id = $1`,
        ['employeeManagement', 'Employee Management', 'applications/HRIS/EmployeeManagement/AppEmployeeManagement.js:AppEmployeeManagement', '👤']
      );
      console.log('[WAS Seeder] Updated app: employeeManagement');
    }

    // 3. Ensure 'Wise HRIS' group exists in wiseape_menus
    let hrisGroupId = null;
    const existingGroup = await db.query(
      "SELECT menu_id FROM wiseape_menus WHERE menu_type = 'group' AND label = 'Wise HRIS'"
    );
    if (existingGroup.rowCount > 0) {
      hrisGroupId = existingGroup.rows[0].menu_id;
      console.log(`[WAS Seeder] Found existing menu group 'Wise HRIS' (id: ${hrisGroupId})`);
    } else {
      const res = await db.query(
        `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
         VALUES (NULL, 'group', 'Wise HRIS', '🏢', NULL, 3) RETURNING menu_id`
      );
      hrisGroupId = res.rows[0].menu_id;
      console.log(`[WAS Seeder] Created menu group 'Wise HRIS' (id: ${hrisGroupId})`);
    }

    // 4. Ensure menu items inside 'Wise HRIS' group
    const existingHrisMenu = await db.query(
      'SELECT menu_id FROM wiseape_menus WHERE parent_id = $1 AND app_id = $2',
      [hrisGroupId, 'hris']
    );
    if (existingHrisMenu.rowCount === 0) {
      await db.query(
        `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
         VALUES ($1, 'item', 'Wise HRIS', '🏢', 'hris', 0)`,
        [hrisGroupId]
      );
      console.log('[WAS Seeder] Inserted menu item: Wise HRIS');
    }

    const existingEmpMenu = await db.query(
      'SELECT menu_id FROM wiseape_menus WHERE parent_id = $1 AND app_id = $2',
      [hrisGroupId, 'employeeManagement']
    );
    if (existingEmpMenu.rowCount === 0) {
      await db.query(
        `INSERT INTO wiseape_menus (parent_id, menu_type, label, icon, app_id, sort_order)
         VALUES ($1, 'item', 'Employee Management', '👤', 'employeeManagement', 1)`,
        [hrisGroupId]
      );
      console.log('[WAS Seeder] Inserted menu item: Employee Management');
    }

    console.log('[WAS Seeder] Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[WAS Seeder] Error seeding HRIS apps:', error);
    process.exit(1);
  }
}

seedHris();
