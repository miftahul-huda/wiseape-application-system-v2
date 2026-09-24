const backgroundImagesModel = require('../models/backgroundImagesModel');

async function listForUser(userId, params) {
  return backgroundImagesModel.listForUser(userId, params);
}

async function addForUser(userId, url) {
  return backgroundImagesModel.addForUser(userId, url);
}

module.exports = { listForUser, addForUser };
