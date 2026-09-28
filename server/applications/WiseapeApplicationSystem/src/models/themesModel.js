const db = require('../../config/db');

const FALLBACK_THEMES = [
  { id: 'light-blue', name: 'Light Blue', bg1: '#bfe3ff', bg2: '#eaf6ff', accent: '#0ea5e9', accentDark: '#0284c7', defaultBackground: null },
  { id: 'dark-obsidian', name: 'Dark Obsidian', bg1: '#0f172a', bg2: '#020617', accent: '#64748b', accentDark: '#334155', defaultBackground: null },
  { id: 'midnight', name: 'Midnight', bg1: '#1e293b', bg2: '#0f172a', accent: '#978ab4ff', accentDark: '#5110b3ff', defaultBackground: null },
  { id: 'emerald', name: 'Emerald', bg1: '#064e3b', bg2: '#022c22', accent: '#10b981', accentDark: '#047857', defaultBackground: null },
  { id: 'amber', name: 'Amber', bg1: '#451a03', bg2: '#1a0901', accent: '#ece0caff', accentDark: '#c8b00fff', defaultBackground: null },
  { id: 'sunset', name: 'Sunset Orange', bg1: '#fb923c', bg2: '#db2777', accent: '#f97316', accentDark: '#c2410c', defaultBackground: null },
  { id: 'forest', name: 'Forest Green', bg1: '#4ade80', bg2: '#064e3b', accent: '#22c55e', accentDark: '#15803d', defaultBackground: null },
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
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS wiseape_themes (
        theme_id TEXT PRIMARY KEY,
        theme_name TEXT NOT NULL,
        bg1 TEXT,
        bg2 TEXT,
        accent TEXT,
        accent_dark TEXT,
        default_background TEXT,
        css_content TEXT
      );
    `);
    await db.query('ALTER TABLE wiseape_themes ADD COLUMN IF NOT EXISTS default_background TEXT;');
    await db.query('ALTER TABLE wiseape_themes ADD COLUMN IF NOT EXISTS css_content TEXT;');

    const check = await db.query('SELECT 1 FROM wiseape_themes LIMIT 1;');
    if (check.rowCount === 0) {
      for (const theme of FALLBACK_THEMES) {
        await db.query(
          `INSERT INTO wiseape_themes (theme_id, theme_name, bg1, bg2, accent, accent_dark, default_background, css_content)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (theme_id) DO NOTHING`,
          [theme.id, theme.name, theme.bg1, theme.bg2, theme.accent, theme.accentDark, theme.defaultBackground || null, theme.cssContent || '']
        );
      }
    }
    schemaReady = true;
  } catch (error) {
    console.warn('[WAS API] Error ensuring wiseape_themes schema:', error.message);
  }
}

async function listThemes() {
  try {
    await ensureSchema();
    const result = await db.query(`
      SELECT theme_id AS id, theme_name AS name, bg1, bg2, accent, accent_dark AS "accentDark",
             default_background AS "defaultBackground", css_content AS "cssContent"
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

async function createTheme({ id, name, bg1, bg2, accent, accentDark, defaultBackground, cssContent }) {
  await ensureSchema();
  const themeId = id || `theme-${Date.now()}`;
  const themeName = name || 'New Theme';
  const result = await db.query(
    `INSERT INTO wiseape_themes (theme_id, theme_name, bg1, bg2, accent, accent_dark, default_background, css_content)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING theme_id AS id, theme_name AS name, bg1, bg2, accent, accent_dark AS "accentDark", default_background AS "defaultBackground", css_content AS "cssContent"`,
    [themeId, themeName, bg1 || '#ffffff', bg2 || '#f3f4f6', accent || '#2563eb', accentDark || '#1d4ed8', defaultBackground || null, cssContent || '']
  );
  return result.rows[0];
}

async function updateTheme(id, { name, bg1, bg2, accent, accentDark, defaultBackground, cssContent }) {
  await ensureSchema();
  const result = await db.query(
    `UPDATE wiseape_themes
     SET theme_name = COALESCE($1, theme_name),
         bg1 = COALESCE($2, bg1),
         bg2 = COALESCE($3, bg2),
         accent = COALESCE($4, accent),
         accent_dark = COALESCE($5, accent_dark),
         default_background = COALESCE($6, default_background),
         css_content = COALESCE($7, css_content)
     WHERE theme_id = $8
     RETURNING theme_id AS id, theme_name AS name, bg1, bg2, accent, accent_dark AS "accentDark", default_background AS "defaultBackground", css_content AS "cssContent"`,
    [name, bg1, bg2, accent, accentDark, defaultBackground, cssContent, id]
  );
  return result.rows[0] || null;
}

async function deleteTheme(id) {
  await ensureSchema();
  await db.query('DELETE FROM wiseape_themes WHERE theme_id = $1', [id]);
  return true;
}

module.exports = { listThemes, createTheme, updateTheme, deleteTheme };

