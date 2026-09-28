const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./src/models');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const { UPLOAD_ROOT } = require('./src/middleware/upload');

const port = process.env.PORT || 4001;

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static uploads serving
app.use('/uploads', express.static(UPLOAD_ROOT));

// Mount REST API routes
app.use('/api', routes);
// Root redirect to API info
app.get('/', (req, res) => {
  res.redirect('/api');
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint '${req.method} ${req.originalUrl}' tidak ditemukan`
  });
});

// Central error handler
app.use(errorHandler);

// Start server and check database connection
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('[HRIS DB] PostgreSQL connection has been established successfully.');

    // Auto-sync in non-production if required
    await sequelize.sync({ alter: true });
    console.log('[HRIS DB] Models synchronized with PostgreSQL database.');

    const server = app.listen(port, () => {
      console.log(`[HRIS Service] Wiseape HRIS REST API Microservice running on port ${port}`);
      console.log(`[HRIS Service] API Documentation: http://localhost:${port}/api`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n[HRIS Service] Gracefully shutting down...');
      server.close(async () => {
        await sequelize.close();
        console.log('[HRIS DB] Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[HRIS Service] Failed to start server:', error);
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
