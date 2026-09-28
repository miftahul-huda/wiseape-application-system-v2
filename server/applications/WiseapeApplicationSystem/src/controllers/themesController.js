const themesService = require('../services/themesService');

async function list(req, res, next) {
  try {
    res.json({ themes: await themesService.listThemes() });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const theme = await themesService.createTheme(req.body || {});
    res.json({ theme });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const theme = await themesService.updateTheme(req.params.id, req.body || {});
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    res.json({ theme });
  } catch (error) {
    next(error);
  }
}

async function deleteTheme(req, res, next) {
  try {
    await themesService.deleteTheme(req.params.id);
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, update, deleteTheme };

