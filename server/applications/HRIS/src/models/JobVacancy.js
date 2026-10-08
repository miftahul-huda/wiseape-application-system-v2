const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class JobVacancy extends Model {}

JobVacancy.init(
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'title',
      validate: {
        notEmpty: { msg: 'Judul lowongan wajib diisi' }
      }
    },
    department: {
      type: DataTypes.STRING(100),
      field: 'department'
    },
    division: {
      type: DataTypes.STRING(100),
      field: 'division'
    },
    position: {
      type: DataTypes.STRING(150),
      field: 'position'
    },
    jobLevel: {
      type: DataTypes.STRING(100),
      field: 'job_level'
    },
    workLocation: {
      type: DataTypes.STRING(100),
      field: 'work_location'
    },
    employmentType: {
      type: DataTypes.STRING(50),
      defaultValue: 'Tetap (PKWTT)',
      field: 'employment_type'
    },
    description: {
      type: DataTypes.TEXT,
      field: 'description'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      field: 'end_date'
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'ACTIVE', // DRAFT, ACTIVE, CLOSED, ARCHIVED
      field: 'status'
    },
    stageTemplateId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'stage_template_id'
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
    modelName: 'JobVacancy',
    tableName: 'recruitment_job_vacancies',
    indexes: [
      { fields: ['title'] },
      { fields: ['department'] },
      { fields: ['status'] },
      { fields: ['is_active'] }
    ]
  }
);

module.exports = JobVacancy;
