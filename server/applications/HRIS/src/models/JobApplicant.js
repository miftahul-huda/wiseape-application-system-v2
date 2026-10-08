const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class JobApplicant extends Model {}

JobApplicant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    jobVacancyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'job_vacancy_id'
    },
    applicantNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'applicant_number'
    },
    fullName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'full_name',
      validate: {
        notEmpty: { msg: 'Nama lengkap pelamar wajib diisi' }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'email',
      validate: {
        isEmail: { msg: 'Format email tidak valid' }
      }
    },
    phone: {
      type: DataTypes.STRING(50),
      field: 'phone'
    },
    gender: {
      type: DataTypes.STRING(20),
      field: 'gender'
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      field: 'birth_date'
    },
    lastEducation: {
      type: DataTypes.STRING(50),
      field: 'last_education'
    },
    major: {
      type: DataTypes.STRING(100),
      field: 'major'
    },
    currentCompany: {
      type: DataTypes.STRING(150),
      field: 'current_company'
    },
    currentPosition: {
      type: DataTypes.STRING(150),
      field: 'current_position'
    },
    expectedSalary: {
      type: DataTypes.DECIMAL(15, 2),
      field: 'expected_salary'
    },
    resumeUrl: {
      type: DataTypes.STRING(255),
      field: 'resume_url'
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'APPLIED', // APPLIED, IN_PROCESS, OFFERED, HIRED, REJECTED, WITHDRAWN
      field: 'status'
    },
    appliedDate: {
      type: DataTypes.DATEONLY,
      field: 'applied_date'
    },
    notes: {
      type: DataTypes.TEXT,
      field: 'notes'
    }
  },
  {
    sequelize,
    modelName: 'JobApplicant',
    tableName: 'recruitment_job_applicants',
    indexes: [
      { fields: ['job_vacancy_id'] },
      { fields: ['email'] },
      { fields: ['status'] },
      { fields: ['full_name'] }
    ]
  }
);

module.exports = JobApplicant;
