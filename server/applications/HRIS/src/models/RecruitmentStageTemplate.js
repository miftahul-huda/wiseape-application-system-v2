const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class RecruitmentStageTemplate extends Model {}

RecruitmentStageTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'code'
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'name',
      validate: {
        notEmpty: { msg: 'Nama template proses wajib diisi' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      field: 'description'
    },
    stages: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'stages'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  },
  {
    sequelize,
    modelName: 'RecruitmentStageTemplate',
    tableName: 'recruitment_stage_templates',
    indexes: [
      { fields: ['name'] },
      { fields: ['is_active'] }
    ]
  }
);

module.exports = RecruitmentStageTemplate;
