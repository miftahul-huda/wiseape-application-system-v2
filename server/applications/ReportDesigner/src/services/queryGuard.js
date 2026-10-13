const { badRequest } = require('../utils/httpError');

const FORBIDDEN = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE', 'GRANT', 'REVOKE',
  'EXEC', 'EXECUTE', 'MERGE', 'CALL', 'COPY', 'INTO', 'REPLACE', 'DO', 'VACUUM', 'ATTACH', 'LOCK',
  'SHUTDOWN', 'XP_CMDSHELL', 'OPENROWSET', 'OPENQUERY', 'PG_SLEEP', 'WAITFOR'];

// Removes comments, keeping string literals intact.
function stripComments(sql) {
  let out = '';
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    const two = sql.substr(i, 2);
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === ch) { if (sql[j + 1] === ch) { j += 2; continue; } break; }
        j++;
      }
      out += sql.slice(i, j + 1);
      i = j + 1;
    } else if (two === '--' || ch === '#') {
      while (i < sql.length && sql[i] !== '\n') i++;
      out += ' ';
    } else if (two === '/*') {
      const end = sql.indexOf('*/', i + 2);
      i = end < 0 ? sql.length : end + 2;
      out += ' ';
    } else { out += ch; i++; }
  }
  return out;
}

// Returns the cleaned single read-only statement or throws 400.
function validateReadOnlyQuery(raw) {
  if (typeof raw !== 'string' || !raw.trim()) throw badRequest('Query is required');
  let sql = stripComments(raw).trim();
  sql = sql.replace(/;+\s*$/, '').trim();
  // literals blanked for structural checks
  const blanked = sql.replace(/'(?:[^']|'')*'|"(?:[^"]|"")*"|`(?:[^`]|``)*`/g, "''");
  if (blanked.includes(';')) throw badRequest('Only a single statement is allowed (found ";" followed by more statements)');
  if (!/^(SELECT|WITH)\b/i.test(blanked)) throw badRequest('Query must start with SELECT or WITH');
  const words = blanked.toUpperCase().match(/[A-Z_][A-Z0-9_]*/g) || [];
  const bad = words.find((w) => FORBIDDEN.includes(w));
  if (bad) throw badRequest(`Keyword '${bad}' is not allowed in a read-only query`);
  return sql;
}

module.exports = { validateReadOnlyQuery, stripComments };
