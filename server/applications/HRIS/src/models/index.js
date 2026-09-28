const sequelize = require('../config/database');
const Employee = require('./Employee');
const EmployeeDocument = require('./EmployeeDocument');
const WorkExperience = require('./WorkExperience');
const EducationHistory = require('./EducationHistory');
const CareerHistory = require('./CareerHistory');

// ==========================================
// Model Associations
// ==========================================

// 1. Employee <-> Documents (1 : M)
Employee.hasMany(EmployeeDocument, {
  foreignKey: 'employeeId',
  as: 'documents',
  onDelete: 'CASCADE'
});
EmployeeDocument.belongsTo(Employee, {
  foreignKey: 'employeeId',
  as: 'employee'
});

// 2. Employee <-> Work Experience / Previous Org (1 : M)
Employee.hasMany(WorkExperience, {
  foreignKey: 'employeeId',
  as: 'workExperiences',
  onDelete: 'CASCADE'
});
WorkExperience.belongsTo(Employee, {
  foreignKey: 'employeeId',
  as: 'employee'
});

// 3. Employee <-> Education History (1 : M)
Employee.hasMany(EducationHistory, {
  foreignKey: 'employeeId',
  as: 'educationHistories',
  onDelete: 'CASCADE'
});
EducationHistory.belongsTo(Employee, {
  foreignKey: 'employeeId',
  as: 'employee'
});

// 4. Employee <-> Career History / Internal (1 : M)
Employee.hasMany(CareerHistory, {
  foreignKey: 'employeeId',
  as: 'careerHistories',
  onDelete: 'CASCADE'
});
CareerHistory.belongsTo(Employee, {
  foreignKey: 'employeeId',
  as: 'employee'
});

// 5. Employee Self Association (Manager & Subordinates)
Employee.belongsTo(Employee, {
  foreignKey: 'managerId',
  as: 'manager'
});
Employee.hasMany(Employee, {
  foreignKey: 'managerId',
  as: 'subordinates'
});

module.exports = {
  sequelize,
  Employee,
  EmployeeDocument,
  WorkExperience,
  EducationHistory,
  CareerHistory
};
