const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Organization extends Model {}

Organization.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'code',
      validate: {
        notEmpty: { msg: 'Kode organisasi wajib diisi' }
      }
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'name',
      validate: {
        notEmpty: { msg: 'Nama organisasi wajib diisi' }
      }
    },
    type: {
      type: DataTypes.STRING(50), // 'Division', 'Department', 'Unit', 'Branch'
      defaultValue: 'Department',
      field: 'type'
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_id'
    },
    leaderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'leader_id'
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
    }
  },
  {
    sequelize,
    modelName: 'Organization',
    tableName: 'organizations',
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['parent_id'] },
      { fields: ['type'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ]
  }
);

module.exports = Organization;
