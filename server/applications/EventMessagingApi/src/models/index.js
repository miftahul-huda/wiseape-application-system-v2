const sequelize = require('../config/database');
const TopicWebhook = require('./TopicWebhook');
const WebhookDelivery = require('./WebhookDelivery');

TopicWebhook.hasMany(WebhookDelivery, { foreignKey: { name: 'webhookId', allowNull: false }, onDelete: 'CASCADE', hooks: true });
WebhookDelivery.belongsTo(TopicWebhook, { foreignKey: { name: 'webhookId', allowNull: false }, onDelete: 'CASCADE' });

module.exports = { sequelize, TopicWebhook, WebhookDelivery };
