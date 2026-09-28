const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class EmployeeDocument extends Model {}

EmployeeDocument.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'employee_id'
    },
    documentType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'document_type',
      // 'KTP', 'KK', 'NPWP', 'Kontrak Kerja', 'Sertifikat', 'Ijazah', 'Lisensi Profesi', 'Lainnya'
      validate: {
        notEmpty: { msg: 'Tipe dokumen wajib diisi' }
      }
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'title',
      validate: {
        notEmpty: { msg: 'Judul dokumen wajib diisi' }
      }
    },
    fileName: {
      type: DataTypes.STRING(255),
      field: 'file_name'
    },
    filePath: {
      type: DataTypes.STRING(500),
      field: 'file_path'
    },
    fileUrl: {
      type: DataTypes.STRING(500),
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
    documentNumber: {
      type: DataTypes.STRING(100),
      field: 'document_number' // e.g. Nomor KTP, No KK, No Ijazah, No Sertifikat
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      field: 'issue_date'
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      field: 'expiry_date'
    },
    description: {
      type: DataTypes.TEXT,
      field: 'description'
    }
  },
  {
    sequelize,
    modelName: 'EmployeeDocument',
    tableName: 'employee_documents',
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['document_type'] }
    ]
  }
);

module.exports = EmployeeDocument;
