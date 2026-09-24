const db = require('../../config/db');

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS wiseape_background_images (
      image_id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES wiseape_users(user_id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  schemaReady = true;
}

async function listForUser(userId, { limit = 10, offset = 0 } = {}) {
  await ensureSchema();

  const countResult = await db.query(
    'SELECT COUNT(*)::int AS count FROM wiseape_background_images WHERE user_id = $1',
    [userId]
  );
  const totalCount = countResult.rows[0].count;

  const result = await db.query(
    `SELECT image_id AS id, url, created_at AS "createdAt"
     FROM wiseape_background_images
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return { rows: result.rows, totalCount };
}

async function addForUser(userId, url) {
  await ensureSchema();

  const result = await db.query(
    `INSERT INTO wiseape_background_images (user_id, url)
     VALUES ($1, $2)
     RETURNING image_id AS id, url, created_at AS "createdAt"`,
    [userId, url]
  );

  return result.rows[0];
}

module.exports = { listForUser, addForUser };
