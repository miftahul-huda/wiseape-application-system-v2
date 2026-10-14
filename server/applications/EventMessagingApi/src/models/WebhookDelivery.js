const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MAX_ROWS = 5000;

const WebhookDelivery = sequelize.define('WebhookDelivery', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  webhookId: { type: DataTypes.INTEGER, allowNull: false },
  topic: { type: DataTypes.STRING(249), allowNull: false },
  partition: { type: DataTypes.INTEGER, allowNull: true },
  offset: { type: DataTypes.STRING(32), allowNull: true },
  eventId: { type: DataTypes.STRING(128), allowNull: true },
  status: { type: DataTypes.STRING(16), allowNull: false, validate: { isIn: [['success', 'failed']] } },
  httpStatus: { type: DataTypes.INTEGER, allowNull: true },
  attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  error: { type: DataTypes.TEXT, allowNull: true },
  durationMs: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'event_webhook_deliveries',
  updatedAt: false,
  indexes: [{ fields: ['webhook_id'] }, { fields: ['topic'] }],
});

// Keep the table bounded: delete everything older than the MAX_ROWS-th newest row.
WebhookDelivery.prune = async function prune() {
  const edge = await WebhookDelivery.findOne({ attributes: ['id'], order: [['id', 'DESC']], offset: MAX_ROWS - 1 });
  if (edge) await WebhookDelivery.destroy({ where: { id: { [require('sequelize').Op.lt]: edge.id } } });
};

module.exports = WebhookDelivery;
