const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbHost = process.env.DB_HOST || '34.101.207.44';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbName = process.env.DB_NAME || 'wiseape-hris';
const dbUser = process.env.DB_USER || 'nodeuser';
// No fallback password in source: it must come from .env (see .env.example).
const dbPassword = process.env.DB_PASSWORD;
if (!dbPassword) {
  throw new Error('DB_PASSWORD is not set. Copy .env.example to .env and fill in the database credentials.');
}
const isLogging = process.env.DB_LOGGING === 'true';

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: isLogging ? console.log : false,
  pool: {
    max: 15,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true, // Soft-delete support via deleted_at
    freezeTableName: true
  }
});

module.exports = sequelize;
