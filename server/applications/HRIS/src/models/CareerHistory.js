const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class CareerHistory extends Model {}

CareerHistory.init(
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
    changeType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'change_type',
      // 'Promosi', 'Demosi', 'Rotasi', 'Penyesuaian Gaji', 'Penghargaan', 'Surat Peringatan', 'Lainnya'
      validate: {
        notEmpty: { msg: 'Jenis perubahan karir wajib diisi' }
      }
    },
    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'effective_date',
      validate: {
        notEmpty: { msg: 'Tanggal efektif wajib diisi' }
      }
    },
    previousJobTitle: {
      type: DataTypes.STRING(100),
      field: 'previous_job_title'
    },
    newJobTitle: {
      type: DataTypes.STRING(100),
      field: 'new_job_title'
    },
    previousDepartment: {
      type: DataTypes.STRING(100),
      field: 'previous_department'
    },
    newDepartment: {
      type: DataTypes.STRING(100),
      field: 'new_department'
    },
    previousSalary: {
      type: DataTypes.DECIMAL(15, 2),
      field: 'previous_salary'
    },
    newSalary: {
      type: DataTypes.DECIMAL(15, 2),
      field: 'new_salary'
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      field: 'reference_number' // Nomor SK / Surat Keputusan Direksi
    },
    notes: {
      type: DataTypes.TEXT,
      field: 'notes' // Catatan disiplin, alasan promosi, deskripsi penghargaan
    }
  },
  {
    sequelize,
    modelName: 'CareerHistory',
    tableName: 'career_histories',
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['change_type'] },
      { fields: ['effective_date'] }
    ]
  }
);

module.exports = CareerHistory;
