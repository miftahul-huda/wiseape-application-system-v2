const { query } = require('../db/pool');
const { encrypt, decrypt } = require('../utils/crypto');
const { notFound } = require('../utils/httpError');
const { getAdapter } = require('../drivers');

const SELECT = `SELECT c.*, t.code AS type_code, t.name AS type_name, t.driver
  FROM rd_connections c JOIN rd_database_types t ON t.id = c.database_type_id`;

function toPublic(r) {
  return {
    id: r.id, name: r.name, databaseTypeId: r.database_type_id,
    databaseTypeCode: r.type_code, databaseTypeName: r.type_name,
    host: r.host, port: r.port, databaseName: r.database_name, username: r.username,
    hasPassword: !!r.password_enc, options: r.options || {},
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

async function getRow(id) {
  const r = await query(`${SELECT} WHERE c.id = $1`, [id]);
  if (!r.rows[0]) throw notFound('Connection not found');
  return r.rows[0];
}

// Internal use only: includes decrypted password and driver.
function toRuntime(r) {
  return {
    id: r.id, host: r.host, port: r.port, databaseName: r.database_name, username: r.username,
    password: decrypt(r.password_enc), options: r.options || {}, driver: r.driver, typeCode: r.type_code,
  };
}

async function getRuntime(id) {
  const row = await getRow(id);
  return { conn: toRuntime(row), adapter: getAdapter(row.driver), driver: row.driver };
}

module.exports = { SELECT, toPublic, getRow, getRuntime, toRuntime, encrypt };
