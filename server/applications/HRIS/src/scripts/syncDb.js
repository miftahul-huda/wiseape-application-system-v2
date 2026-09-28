const { sequelize } = require('../models');

async function syncDatabase() {
  try {
    console.log('[HRIS DB] Authenticating connection to PostgreSQL...');
    await sequelize.authenticate();
    console.log('[HRIS DB] Connection has been established successfully.');

    console.log('[HRIS DB] Synchronizing models with PostgreSQL database...');
    await sequelize.sync({ alter: true });
    console.log('[HRIS DB] All tables synchronized successfully!');

    process.exit(0);
  } catch (error) {
    console.error('[HRIS DB] Error synchronizing database:', error);
    process.exit(1);
  }
}

syncDatabase();
