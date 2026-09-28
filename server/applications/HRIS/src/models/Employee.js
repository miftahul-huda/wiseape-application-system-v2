const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const { calculateTenure } = require('../utils/tenureCalculator');

class Employee extends Model {}

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // ==========================================
    // 1. DATA PRIBADI (Personal Information)
    // ==========================================
    fullName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'full_name',
      validate: {
        notEmpty: { msg: 'Nama lengkap wajib diisi' }
      }
    },
    nickname: {
      type: DataTypes.STRING(50),
      field: 'nickname'
    },
    birthPlace: {
      type: DataTypes.STRING(100),
      field: 'birth_place'
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      field: 'birth_date'
    },
    gender: {
      type: DataTypes.STRING(20), // 'Laki-laki', 'Perempuan'
      field: 'gender'
    },
    religion: {
      type: DataTypes.STRING(30), // 'Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'
      field: 'religion'
    },
    currentAddress: {
      type: DataTypes.TEXT,
      field: 'current_address'
    },
    idCardAddress: {
      type: DataTypes.TEXT,
      field: 'id_card_address'
    },
    phoneNumber: {
      type: DataTypes.STRING(30),
      field: 'phone_number'
    },
    personalEmail: {
      type: DataTypes.STRING(100),
      field: 'personal_email',
      validate: {
        isEmail: { msg: 'Format email pribadi tidak valid' }
      }
    },
    // Emergency Contact
    emergencyContactName: {
      type: DataTypes.STRING(150),
      field: 'emergency_contact_name'
    },
    emergencyContactRelation: {
      type: DataTypes.STRING(50), // 'Orang Tua', 'Suami/Istri', 'Saudara', 'Teman', dll.
      field: 'emergency_contact_relation'
    },
    emergencyContactPhone: {
      type: DataTypes.STRING(30),
      field: 'emergency_contact_phone'
    },

    // ==========================================
    // 2. DATA PEKERJAAN (Employment Details)
    // ==========================================
    nik: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'nik',
      validate: {
        notEmpty: { msg: 'NIK / ID Karyawan wajib diisi' }
      }
    },
    jobTitle: {
      type: DataTypes.STRING(100),
      field: 'job_title'
    },
    jobLevel: {
      type: DataTypes.STRING(50), // 'Staff', 'Senior Staff', 'Supervisor', 'Manager', 'General Manager', 'Director'
      field: 'job_level'
    },
    department: {
      type: DataTypes.STRING(100),
      field: 'department'
    },
    division: {
      type: DataTypes.STRING(100),
      field: 'division'
    },
    employmentStatus: {
      type: DataTypes.STRING(50), // 'Karyawan Tetap', 'Kontrak/PKWT', 'Paruh Waktu', 'Magang'
      defaultValue: 'Kontrak/PKWT',
      field: 'employment_status'
    },
    joinDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'join_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      field: 'end_date'
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'manager_id'
    },
    managerName: {
      type: DataTypes.STRING(150),
      field: 'manager_name'
    },
    workLocation: {
      type: DataTypes.STRING(50), // 'Kantor Pusat', 'Kantor Cabang', 'Remote', 'Hybrid'
      defaultValue: 'Kantor Pusat',
      field: 'work_location'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    status: {
      type: DataTypes.STRING(30), // 'Aktif', 'Nonaktif', 'Cuti', 'Resign', 'PHK'
      defaultValue: 'Aktif',
      field: 'status'
    },

    // ==========================================
    // 3. DATA KOMPENSASI & KEUANGAN (Payroll)
    // ==========================================
    bankName: {
      type: DataTypes.STRING(50), // 'BCA', 'Mandiri', 'BNI', 'BRI', dll.
      field: 'bank_name'
    },
    bankAccountNumber: {
      type: DataTypes.STRING(50),
      field: 'bank_account_number'
    },
    bankAccountHolder: {
      type: DataTypes.STRING(150),
      field: 'bank_account_holder'
    },
    basicSalary: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'basic_salary'
    },
    allowancePosition: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'allowance_position'
    },
    allowanceTransport: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'allowance_transport'
    },
    allowanceMeal: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'allowance_meal'
    },
    allowanceOther: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'allowance_other'
    },
    taxStatus: {
      type: DataTypes.STRING(10), // 'TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'
      defaultValue: 'TK/0',
      field: 'tax_status'
    },
    npwp: {
      type: DataTypes.STRING(30),
      field: 'npwp'
    },
    bpjsKesehatan: {
      type: DataTypes.STRING(30),
      field: 'bpjs_kesehatan'
    },
    bpjsKetenagakerjaan: {
      type: DataTypes.STRING(30),
      field: 'bpjs_ketenagakerjaan'
    },

    // ==========================================
    // Virtual Properties
    // ==========================================
    tenure: {
      type: DataTypes.VIRTUAL,
      get() {
        return calculateTenure(this.getDataValue('joinDate'));
      }
    },
    totalSalary: {
      type: DataTypes.VIRTUAL,
      get() {
        const basic = parseFloat(this.getDataValue('basicSalary') || 0);
        const pos = parseFloat(this.getDataValue('allowancePosition') || 0);
        const transport = parseFloat(this.getDataValue('allowanceTransport') || 0);
        const meal = parseFloat(this.getDataValue('allowanceMeal') || 0);
        const other = parseFloat(this.getDataValue('allowanceOther') || 0);
        return basic + pos + transport + meal + other;
      }
    }
  },
  {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees',
    indexes: [
      { unique: true, fields: ['nik'] },
      { fields: ['department'] },
      { fields: ['job_title'] },
      { fields: ['employment_status'] },
      { fields: ['is_active'] },
      { fields: ['status'] }
    ]
  }
);

module.exports = Employee;
