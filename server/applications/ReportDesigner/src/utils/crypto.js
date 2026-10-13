const crypto = require('crypto');

let key;
function getKey() {
  if (!key) {
    const secret = process.env.CONNECTION_SECRET;
    if (!secret || secret.length < 16) throw new Error('CONNECTION_SECRET is missing or too short');
    key = crypto.scryptSync(secret, 'wiseape-report-designer', 32);
  }
  return key;
}

function encrypt(plain) {
  if (plain === undefined || plain === null || plain === '') return null;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const enc = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  return [iv.toString('base64'), c.getAuthTag().toString('base64'), enc.toString('base64')].join('.');
}

function decrypt(payload) {
  if (!payload) return '';
  const [iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
