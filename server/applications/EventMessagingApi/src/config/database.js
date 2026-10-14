const { Sequelize } = require('sequelize');
require('dotenv').config({ quiet: true });

const dbPassword = process.env.DB_PASSWORD;
if (!dbPassword) {
  throw new Error('DB_PASSWORD is not set. Copy .env.example to .env and fill in the database credentials.');
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'wise-utilities',
  process.env.DB_USER || 'postgres',
  dbPassword,
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { timestamps: true, underscored: true, freezeTableName: true },
  },
);

module.exports = sequelize;
