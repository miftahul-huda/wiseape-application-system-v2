const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ApplicantProcess extends Model {}

ApplicantProcess.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    applicantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'applicant_id'
    },
    jobVacancyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'job_vacancy_id'
    },
    stageName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'stage_name',
      validate: {
        notEmpty: { msg: 'Nama proses / tahapan wajib diisi' }
      }
    },
    stageOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'stage_order'
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'Not Starting', // 'Not Starting', 'Ongoing', 'Done', 'Canceled'
      field: 'status'
    },
    scheduledDate: {
      type: DataTypes.DATEONLY,
      field: 'scheduled_date'
    },
    interviewerName: {
      type: DataTypes.STRING(150),
      field: 'interviewer_name'
    },
    result: {
      type: DataTypes.STRING(50),
      defaultValue: 'PENDING', // 'PENDING', 'PASSED', 'FAILED', 'ON_HOLD'
      field: 'result'
    },
    overallScore: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: null,
      field: 'overall_score'
    },
    matrixTemplateId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'matrix_template_id'
    },
    evaluationMatrix: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'evaluation_matrix'
    },
    comments: {
      type: DataTypes.TEXT,
      field: 'comments'
    },
    documents: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'documents'
    }
  },
  {
    sequelize,
    modelName: 'ApplicantProcess',
    tableName: 'recruitment_applicant_processes',
    indexes: [
      { fields: ['applicant_id'] },
      { fields: ['job_vacancy_id'] },
      { fields: ['status'] },
      { fields: ['stage_order'] }
    ]
  }
);

module.exports = ApplicantProcess;
