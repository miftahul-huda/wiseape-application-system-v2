const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class JobPosition extends Model {}

JobPosition.init(
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
        notEmpty: { msg: 'Kode jabatan wajib diisi' }
      }
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'title',
      validate: {
        notEmpty: { msg: 'Nama/Judul jabatan wajib diisi' }
      }
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'organization_id'
    },
    jobLevelId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'job_level_id'
    },
    department: {
      type: DataTypes.STRING(100),
      field: 'department'
    },
    description: {
      type: DataTypes.TEXT,
      field: 'description'
    },
    requirements: {
      type: DataTypes.TEXT,
      field: 'requirements'
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
    modelName: 'JobPosition',
    tableName: 'job_positions',
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['organization_id'] },
      { fields: ['job_level_id'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ]
  }
);

module.exports = JobPosition;
