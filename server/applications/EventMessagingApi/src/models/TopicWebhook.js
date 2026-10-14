const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { topicProblem, isHttpUrl } = require('../utils/validators');

const TopicWebhook = sequelize.define('TopicWebhook', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  topic: {
    type: DataTypes.STRING(249),
    allowNull: false,
    validate: { topicOk(v) { const p = topicProblem(v); if (p) throw new Error(p); } },
  },
  url: {
    type: DataTypes.STRING(2048),
    allowNull: false,
    validate: { httpOnly(v) { if (!isHttpUrl(v)) throw new Error('url must be a valid http or https URL'); } },
  },
  description: { type: DataTypes.TEXT, allowNull: true },
  secret: { type: DataTypes.STRING(512), allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'event_topic_webhooks',
  indexes: [{ unique: true, fields: ['topic', 'url'] }, { fields: ['topic'] }],
});

module.exports = TopicWebhook;
