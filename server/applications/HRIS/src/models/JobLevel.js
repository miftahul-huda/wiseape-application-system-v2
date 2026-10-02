const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class JobLevel extends Model {}

JobLevel.init(
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
        notEmpty: { msg: 'Kode jenjang jabatan wajib diisi' }
      }
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'name',
      validate: {
        notEmpty: { msg: 'Nama jenjang jabatan wajib diisi' }
      }
    },
    levelNumber: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'level_number'
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
    modelName: 'JobLevel',
    tableName: 'job_levels',
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['level_number'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ]
  }
);

module.exports = JobLevel;
