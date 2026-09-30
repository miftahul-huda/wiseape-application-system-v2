const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class EmployeeFamily extends Model {}

EmployeeFamily.init(
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
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'name',
      validate: {
        notEmpty: { msg: 'Nama anggota keluarga wajib diisi' }
      }
    },
    relationship: {
      type: DataTypes.STRING(50), // 'Suami', 'Istri', 'Anak', 'Ayah', 'Ibu', 'Saudara Kandung', 'Lainnya'
      allowNull: false,
      field: 'relationship',
      defaultValue: 'Anak'
    },
    gender: {
      type: DataTypes.STRING(20), // 'Laki-laki', 'Perempuan'
      field: 'gender',
      defaultValue: 'Laki-laki'
    },
    idCardNumber: {
      type: DataTypes.STRING(50), // NIK / No KTP
      field: 'id_card_number'
    },
    birthPlace: {
      type: DataTypes.STRING(100),
      field: 'birth_place'
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      field: 'birth_date'
    },
    educationLevel: {
      type: DataTypes.STRING(50), // 'Belum Sekolah', 'SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3', 'Lainnya'
      field: 'education_level'
    },
    occupation: {
      type: DataTypes.STRING(100), // Pekerjaan
      field: 'occupation'
    },
    phone: {
      type: DataTypes.STRING(30), // Nomor HP / Kontak
      field: 'phone'
    },
    isEmergencyContact: {
      type: DataTypes.BOOLEAN,
      field: 'is_emergency_contact',
      defaultValue: false
    },
    isDependent: {
      type: DataTypes.BOOLEAN,
      field: 'is_dependent',
      defaultValue: true
    },
    description: {
      type: DataTypes.TEXT,
      field: 'description'
    }
  },
  {
    sequelize,
    modelName: 'EmployeeFamily',
    tableName: 'employee_families',
    indexes: [
      { fields: ['employee_id'] }
    ]
  }
);

module.exports = EmployeeFamily;
