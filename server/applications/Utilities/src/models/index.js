const sequelize = require('../config/database');
const { UtilityLink, seedLinks } = require('./UtilityLink');

module.exports = { sequelize, UtilityLink, seedLinks };
