const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config({ quiet: true });

const { pool } = require('./src/db/pool');
const { initSchema } = require('./src/db/schema');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');

const port = process.env.PORT || 4002;

// GET / -> basic information about this API server (handy as a gateway/health probe).
const pkg = require('./package.json');
const startedAt = new Date();
function serverInfo(req, res) {
  res.json({
    service: 'Wiseape Report Designer API',
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
// Root: server information (the endpoint index is at /api)
app.get('/', serverInfo);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Endpoint '${req.method} ${req.originalUrl}' not found` });
});
app.use(errorHandler);

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('[RD DB] PostgreSQL metadata connection established.');
    await initSchema();
    console.log('[RD DB] Schema ensured and seed data applied.');

    const server = app.listen(port, () => {
      console.log(`[RD Service] Report Designer API running on port ${port}`);
      console.log(`[RD Service] API index: http://localhost:${port}/api`);
    });

    const shutdown = () => {
      console.log('\n[RD Service] Gracefully shutting down...');
      server.close(async () => {
        await pool.end();
        console.log('[RD DB] Pool closed.');
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[RD Service] Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
