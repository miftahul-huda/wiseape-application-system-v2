const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class WorkExperience extends Model {}

WorkExperience.init(
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
    companyName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'company_name',
      validate: {
        notEmpty: { msg: 'Nama perusahaan wajib diisi' }
      }
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'position',
      validate: {
        notEmpty: { msg: 'Posisi/jabatan wajib diisi' }
      }
    },
    startDate: {
      type: DataTypes.DATEONLY,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      field: 'end_date'
    },
    isCurrentJob: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_current_job'
    },
    lastSalary: {
      type: DataTypes.DECIMAL(15, 2),
      field: 'last_salary'
    },
    description: {
      type: DataTypes.TEXT,
      field: 'description' // Keterangan tambahan, tanggung jawab, pencapaian
    }
  },
  {
    sequelize,
    modelName: 'WorkExperience',
    tableName: 'work_experiences',
    indexes: [
      { fields: ['employee_id'] }
    ]
  }
);

module.exports = WorkExperience;
