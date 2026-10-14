const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize, seedLinks } = require('./src/models');
const { ensureDatabase } = require('./src/config/database');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');

const port = process.env.PORT || 4003;

// GET / -> basic information about this API server (handy as a gateway/health probe).
const pkg = require('./package.json');
const startedAt = new Date();
function serverInfo(req, res) {
  res.json({
    service: 'Wiseape Utilities API',
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    port: Number(port),
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    endpoints: '/api',
  });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api', routes);
app.get('/', serverInfo);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Endpoint '${req.method} ${req.originalUrl}' not found` });
});
app.use(errorHandler);

async function startServer() {
  try {
    await ensureDatabase();
    await sequelize.authenticate();
    console.log('[Utilities DB] PostgreSQL connection has been established successfully.');
    await sequelize.sync();
    console.log('[Utilities DB] Models synchronized.');
    await seedLinks();

    const server = app.listen(port, () => {
      console.log(`[Utilities Service] Utilities API running on port ${port}`);
      console.log(`[Utilities Service] API index: http://localhost:${port}/api`);
    });

    const shutdown = () => {
      console.log('\n[Utilities Service] Gracefully shutting down...');
      server.close(async () => {
        await sequelize.close();
        console.log('[Utilities DB] Database connection closed.');
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Utilities Service] Failed to start server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) startServer();

module.exports = { app, startServer };
