const TIMEOUT_MS = 8000;
const STATEMENT_TIMEOUT_MS = 30000;
const NUMERIC_RE = /int|numeric|decimal|float|double|real|money|serial|number/i;
const DATE_RE = /date|time/i;
const flags = (dataType) => ({ isNumeric: NUMERIC_RE.test(dataType), isDate: DATE_RE.test(dataType) });
const splitFull = (full) => {
  const i = String(full).indexOf('.');
  return i < 0 ? { schema: null, name: full } : { schema: full.slice(0, i), name: full.slice(i + 1) };
};
module.exports = { TIMEOUT_MS, STATEMENT_TIMEOUT_MS, flags, splitFull };
