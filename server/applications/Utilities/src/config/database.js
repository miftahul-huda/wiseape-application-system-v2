const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbName = process.env.DB_NAME || 'wise-utilities';
const dbUser = process.env.DB_USER || 'postgres';
// No fallback password in source: it must come from .env (see .env.example).
const dbPassword = process.env.DB_PASSWORD;
if (!dbPassword) {
  throw new Error('DB_PASSWORD is not set. Copy .env.example to .env and fill in the database credentials.');
}
const logging = process.env.DB_LOGGING === 'true' ? console.log : false;

function build(database) {
  return new Sequelize(database, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    logging,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { timestamps: true, underscored: true, freezeTableName: true },
  });
}

const sequelize = build(dbName);

// Make sure the target database exists (creates it via the "postgres" maintenance DB if allowed).
async function ensureDatabase() {
  try {
    await sequelize.authenticate();
    return false;
  } catch (err) {
    const code = err.original && err.original.code;
    if (code !== '3D000') throw err;
  }
  console.log(`[Utilities DB] Database "${dbName}" does not exist; trying to create it...`);
  const admin = build('postgres');
  try {
    await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.log(`[Utilities DB] Database "${dbName}" created.`);
    return true;
  } catch (err) {
    const msg = err.original && err.original.code === '42501'
      ? `User "${dbUser}" is not allowed to create databases.`
      : `Could not create the database: ${err.message}`;
    throw new Error(`${msg} Please create the database "${dbName}" manually (e.g. CREATE DATABASE "${dbName}";) and restart.`);
  } finally {
    await admin.close();
  }
}

module.exports = sequelize;
module.exports.ensureDatabase = ensureDatabase;
