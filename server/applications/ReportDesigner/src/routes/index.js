const router = require('express').Router();
const { query } = require('../db/pool');

router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'Wiseape Report Designer API',
    endpoints: {
      databaseTypes: 'GET /api/database-types',
      connections: 'GET|POST /api/connections, GET|PUT|DELETE /api/connections/:id, POST /api/connections/test, GET /api/connections/:id/tables, GET /api/connections/:id/columns?table=schema.name, POST /api/connections/:id/query-columns',
      reportGroups: 'GET|POST /api/report-groups, GET|PUT|DELETE /api/report-groups/:id (?force=true), GET /api/report-groups/:id/reports',
      reports: 'GET|POST /api/reports, GET|PUT|DELETE /api/reports/:id, GET /api/reports/:id/data, POST /api/reports/preview',
    },
  });
});

router.get('/database-types', async (req, res) => {
  const r = await query('SELECT * FROM rd_database_types ORDER BY id');
  res.json({ success: true, data: r.rows.map((t) => ({ id: t.id, code: t.code, name: t.name, driver: t.driver, defaultPort: t.default_port, isActive: t.is_active })) });
});

router.use('/connections', require('./connections'));
router.use('/report-groups', require('./reportGroups'));
router.use('/reports', require('./reports'));

module.exports = router;
