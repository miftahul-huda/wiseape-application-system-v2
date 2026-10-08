const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class RecruitmentDocument extends Model {}

RecruitmentDocument.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    applicantProcessId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'applicant_process_id'
    },
    applicantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'applicant_id'
    },
    documentName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'document_name'
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name'
    },
    filePath: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_path'
    },
    fileUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_url'
    },
    fileSize: {
      type: DataTypes.INTEGER,
      field: 'file_size'
    },
    mimeType: {
      type: DataTypes.STRING(100),
      field: 'mime_type'
    },
    uploadedBy: {
      type: DataTypes.STRING(100),
      field: 'uploaded_by'
    },
    notes: {
      type: DataTypes.TEXT,
      field: 'notes'
    }
  },
  {
    sequelize,
    modelName: 'RecruitmentDocument',
    tableName: 'recruitment_documents',
    indexes: [
      { fields: ['applicant_process_id'] },
      { fields: ['applicant_id'] }
    ]
  }
);

module.exports = RecruitmentDocument;
