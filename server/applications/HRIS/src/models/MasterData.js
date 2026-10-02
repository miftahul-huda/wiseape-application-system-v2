const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class MasterData extends Model {}

MasterData.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    dataType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'data_type',
      validate: {
        notEmpty: { msg: 'Kategori Master Data (dataType) wajib diisi' }
      }
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'code',
      validate: {
        notEmpty: { msg: 'Kode master data wajib diisi' }
      }
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'name',
      validate: {
        notEmpty: { msg: 'Nama master data wajib diisi' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      field: 'description'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'metadata'
    }
  },
  {
    sequelize,
    modelName: 'MasterData',
    tableName: 'master_data',
    indexes: [
      { fields: ['data_type'] },
      { fields: ['code'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ]
  }
);

module.exports = MasterData;
