const themesModel = require('../models/themesModel');

async function listThemes() {
  return themesModel.listThemes();
}

function getThemeById(themes, themeId) {
  return themes.find((theme) => theme.id === themeId) || themes[0] || null;
}

async function createTheme(data) {
  return themesModel.createTheme(data);
}

async function updateTheme(id, data) {
  return themesModel.updateTheme(id, data);
}

async function deleteTheme(id) {
  return themesModel.deleteTheme(id);
}

module.exports = { listThemes, getThemeById, createTheme, updateTheme, deleteTheme };

