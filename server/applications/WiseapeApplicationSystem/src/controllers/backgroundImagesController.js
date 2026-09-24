const backgroundImagesService = require('../services/backgroundImagesService');

async function list(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const { rows, totalCount } = await backgroundImagesService.listForUser(req.user.id, { limit, offset });
    res.json({ images: rows, totalCount });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }
    const image = await backgroundImagesService.addForUser(req.user.id, url);
    res.status(201).json({ image });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create };
