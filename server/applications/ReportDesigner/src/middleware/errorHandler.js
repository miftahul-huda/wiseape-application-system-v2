module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON body'; }
  else if (err.code === '23505') { status = 409; message = 'A record with the same unique value already exists'; }
  else if (err.code === '23503') { status = 409; message = 'Record is referenced by other data'; }
  if (status >= 500) console.error('[RD Service] Error:', err);
  res.status(status).json({ success: false, message });
};
