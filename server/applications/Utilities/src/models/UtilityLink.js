const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LINK_TYPES = [
  { code: 'kong_manager', name: 'Kong Manager' },
  { code: 'kafka_manager', name: 'Kafka Manager' },
];
const TYPE_CODES = LINK_TYPES.map((t) => t.code);

const UtilityLink = sequelize.define('UtilityLink', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: {
    type: DataTypes.STRING(32),
    allowNull: false,
    validate: { isIn: { args: [TYPE_CODES], msg: `type must be one of: ${TYPE_CODES.join(', ')}` } },
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    set(v) { this.setDataValue('name', typeof v === 'string' ? v.trim() : v); },
    validate: { notEmpty: { msg: 'name is required' } },
  },
  url: {
    type: DataTypes.STRING(2048),
    allowNull: false,
    set(v) { this.setDataValue('url', typeof v === 'string' ? v.trim() : v); },
    validate: {
      isHttpUrl(value) {
        let u;
        try { u = new URL(value); } catch (e) { throw new Error('url must be a valid http/https URL'); }
        if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('url must use http or https');
        if (!u.hostname) throw new Error('url must have a host');
      },
    },
  },
  description: { type: DataTypes.TEXT, allowNull: true },
  isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'utility_links',
  indexes: [{ unique: true, fields: ['type', 'name'], name: 'utility_links_type_name_uq' }],
});

// Run a save and, when isDefault is true, clear the flag on the other links of the same type (one transaction).
UtilityLink.saveWithDefault = async function saveWithDefault(instance) {
  return sequelize.transaction(async (transaction) => {
    await instance.save({ transaction });
    if (instance.isDefault) {
      await UtilityLink.update(
        { isDefault: false },
        { where: { type: instance.type, id: { [require('sequelize').Op.ne]: instance.id } }, transaction },
      );
    }
    return instance;
  });
};

const SEEDS = [
  // Both UIs are reached through the Kong gateway (server/utilities/kong-gateway/kong.yml), which
  // strips X-Frame-Options so they can be shown inside WiseWebView. Direct URLs are
  // http://localhost:8002 (Kong Manager, no longer works: its CORS origin moved) and :8085.
  { type: 'kong_manager', name: 'Kong Manager (local)', url: 'http://kong-manager.localhost:8000', isDefault: true },
  { type: 'kafka_manager', name: 'Kafka UI (local)', url: 'http://kafka-ui.localhost:8000', isDefault: true },
];

async function seedLinks() {
  for (const s of SEEDS) {
    const count = await UtilityLink.count({ where: { type: s.type } });
    if (count === 0) {
      await UtilityLink.create(s);
      console.log(`[Utilities DB] Seeded ${s.type}: ${s.name}`);
    }
  }
}

module.exports = { UtilityLink, LINK_TYPES, TYPE_CODES, seedLinks };
