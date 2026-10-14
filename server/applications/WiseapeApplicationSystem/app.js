const express = require('express');
const cors = require('cors');
const routes = require('./src/routes');
const { UPLOAD_DIR } = require('./src/services/uploadsService');

const port = process.env.PORT || 4000;

// GET / -> basic information about this API server (handy as a gateway/health probe).
const pkg = require('./package.json');
const startedAt = new Date();
function serverInfo(req, res) {
  res.json({
    service: 'Wiseape Application System (WAS) API',
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    port: Number(port),
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    endpoints: ['/api/apps', '/api/menus', '/api/themes', '/api/employees', '/api/background-images', '/api/auth', '/api/uploads'],
  });
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));
app.get('/', serverInfo);
app.use('/', routes);

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[WAS API] Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Wiseape Application System REST API running on http://localhost:${port}`);
});
