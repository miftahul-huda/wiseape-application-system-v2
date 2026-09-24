const db = require('../../config/db');

const FALLBACK_THEMES = [
  { id: 'macos-light', name: 'macOS Light', bg1: '#a4bfd5', bg2: '#d9e9f7', accent: '#3b82f6', accentDark: '#1d4ed8', defaultBackground: null },
  { id: 'light-blue', name: 'Light Blue', bg1: '#bfe3ff', bg2: '#eaf6ff', accent: '#0ea5e9', accentDark: '#0284c7', defaultBackground: null },
  { id: 'midnight', name: 'Midnight', bg1: '#1e293b', bg2: '#0f172a', accent: '#8b5cf6', accentDark: '#6d28d9', defaultBackground: null },
  { id: 'sunset', name: 'Sunset', bg1: '#fb923c', bg2: '#db2777', accent: '#f97316', accentDark: '#c2410c', defaultBackground: null },
  { id: 'forest', name: 'Forest', bg1: '#4ade80', bg2: '#064e3b', accent: '#16a34a', accentDark: '#166534', defaultBackground: null },
];

let schemaReady = false;

// wiseape_themes itself is assumed to already exist (this codebase has
// never owned its creation -- it's curated, out-of-band data), but
// default_background is new: add it if it's missing, so an existing
// deployment picks it up automatically instead of needing a manual
// migration. If the table doesn't exist at all, this throws and is caught
// by listThemes()'s own try/catch below, same as any other DB error.
async function ensureSchema() {
  if (schemaReady) return;
  await db.query('ALTER TABLE wiseape_themes ADD COLUMN IF NOT EXISTS default_background TEXT;');
  schemaReady = true;
}

async function listThemes() {
  try {
    await ensureSchema();
    const result = await db.query(`
      SELECT theme_id AS id, theme_name AS name, bg1, bg2, accent, accent_dark AS "accentDark", default_background AS "defaultBackground"
      FROM wiseape_themes
      ORDER BY theme_name ASC
    `);
    if (result.rowCount === 0) return FALLBACK_THEMES.map((theme) => ({ ...theme }));
    return result.rows;
  } catch (error) {
    console.warn('[WAS API] wiseape_themes unavailable, using fallback list:', error.message);
    return FALLBACK_THEMES.map((theme) => ({ ...theme }));
  }
}

module.exports = { listThemes };
