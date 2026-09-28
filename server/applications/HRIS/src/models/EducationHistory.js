const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class EducationHistory extends Model {}

EducationHistory.init(
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
    institutionName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'institution_name',
      validate: {
        notEmpty: { msg: 'Nama institusi pendidikan wajib diisi' }
      }
    },
    degree: {
      type: DataTypes.STRING(50), // 'SMA/SMK', 'D3', 'D4', 'S1', 'S2', 'S3', 'Non-Formal'
      field: 'degree'
    },
    major: {
      type: DataTypes.STRING(100), // Jurusan
      field: 'major'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      field: 'start_date'
    },
    graduationDate: {
      type: DataTypes.DATEONLY,
      field: 'graduation_date' // Tanggal terakhir / tanggal lulus
    },
    gpa: {
      type: DataTypes.DECIMAL(4, 2),
      field: 'gpa' // Nilai / IPK
    },
    description: {
      type: DataTypes.TEXT,
      field: 'description' // Keterangan tambahan (prestasi, judul tugas akhir, dll.)
    }
  },
  {
    sequelize,
    modelName: 'EducationHistory',
    tableName: 'education_histories',
    indexes: [
      { fields: ['employee_id'] }
    ]
  }
);

module.exports = EducationHistory;
