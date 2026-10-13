import { defineConfig } from 'vite';

// The Express app (app.js, port 3000) stays the backend for the desktop shell:
// /api/*, the classic framework scripts (WiseDesktop, WiseApplicationSystem,
// WiseI18n, controls) and app icon assets. Vite only adds the ES-module layer
// (src/main.js and the browser-run applications) and, in dev, serves
// index.html + public/ itself.
const EXPRESS = process.env.WAS_SERVER_URL || 'http://localhost:3000';

const proxied = ['/api', '/controls', '/WiseI18n.js', '/WiseDesktop.js', '/WiseApplicationSystem.js', '/app-assets'];

export default defineConfig({
  server: {
    port: 5173,
    proxy: Object.fromEntries(proxied.map((path) => [path, { target: EXPRESS, changeOrigin: true }])),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Express keeps serving public/ (user uploads included) directly.
    copyPublicDir: false,
  },
});
