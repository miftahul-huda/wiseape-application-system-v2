const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config({ quiet: true });

const { sequelize } = require('./src/models');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const kafkaService = require('./src/services/kafkaService');
const consumer = require('./src/services/consumer');

const port = process.env.PORT || 4004;

// GET / -> basic information about this API server (handy as a gateway/health probe).
const pkg = require('./package.json');
const startedAt = new Date();
function serverInfo(req, res) {
  res.json({
    service: 'Wiseape Event Messaging API',
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
    await sequelize.authenticate();
    console.log('[EventMessaging DB] PostgreSQL connection has been established successfully.');
    await sequelize.sync();
    console.log('[EventMessaging DB] Models synchronized.');
    await require('./src/models').WebhookDelivery.prune();

    const server = app.listen(port, () => {
      console.log(`[EventMessaging Service] Event Messaging API running on port ${port}`);
      console.log(`[EventMessaging Service] API index: http://localhost:${port}/api`);
    });

    // Kafka is optional at startup: connect/subscribe in the background and keep retrying.
    kafkaService.start();
    consumer.start();

    let closing = false;
    const shutdown = () => {
      if (closing) return;
      closing = true;
      console.log('\n[EventMessaging Service] Gracefully shutting down...');
      server.close(async () => {
        await consumer.stop();
        await kafkaService.stop();
        await sequelize.close();
        console.log('[EventMessaging DB] Database connection closed.');
        process.exit(0);
      });
      server.closeAllConnections();
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[EventMessaging Service] Failed to start server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) startServer();

module.exports = { app, startServer };
