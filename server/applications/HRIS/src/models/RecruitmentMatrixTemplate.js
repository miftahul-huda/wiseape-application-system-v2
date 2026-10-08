const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class RecruitmentMatrixTemplate extends Model {}

RecruitmentMatrixTemplate.init(
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
        notEmpty: { msg: 'Nama template matriks wajib diisi' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      field: 'description'
    },
    criteria: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'criteria'
    },
    passScore: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 70.0,
      field: 'pass_score'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  },
  {
    sequelize,
    modelName: 'RecruitmentMatrixTemplate',
    tableName: 'recruitment_matrix_templates',
    indexes: [
      { fields: ['name'] },
      { fields: ['is_active'] }
    ]
  }
);

module.exports = RecruitmentMatrixTemplate;
