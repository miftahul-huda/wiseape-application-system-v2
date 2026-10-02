const sequelize = require('../config/database');
const Employee = require('./Employee');
const EmployeeDocument = require('./EmployeeDocument');
const WorkExperience = require('./WorkExperience');
const EducationHistory = require('./EducationHistory');
const CareerHistory = require('./CareerHistory');
const EmployeeFamily = require('./EmployeeFamily');
const MasterData = require('./MasterData');
const Organization = require('./Organization');
const JobLevel = require('./JobLevel');
const JobPosition = require('./JobPosition');

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

// 5. Employee <-> Family Members (1 : M)
Employee.hasMany(EmployeeFamily, {
  foreignKey: 'employeeId',
  as: 'familyMembers',
  onDelete: 'CASCADE'
});
EmployeeFamily.belongsTo(Employee, {
  foreignKey: 'employeeId',
  as: 'employee'
});

// 6. Employee Self Association (Manager & Subordinates)
Employee.belongsTo(Employee, {
  foreignKey: 'managerId',
  as: 'manager'
});
Employee.hasMany(Employee, {
  foreignKey: 'managerId',
  as: 'subordinates'
});

// 7. Organization Self Association (Parent <-> Sub-units)
Organization.belongsTo(Organization, {
  foreignKey: 'parentId',
  as: 'parent'
});
Organization.hasMany(Organization, {
  foreignKey: 'parentId',
  as: 'children'
});

// 8. Organization <-> JobPosition (1 : M)
Organization.hasMany(JobPosition, {
  foreignKey: 'organizationId',
  as: 'positions'
});
JobPosition.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// 9. JobLevel <-> JobPosition (1 : M)
JobLevel.hasMany(JobPosition, {
  foreignKey: 'jobLevelId',
  as: 'positions'
});
JobPosition.belongsTo(JobLevel, {
  foreignKey: 'jobLevelId',
  as: 'jobLevel'
});

module.exports = {
  sequelize,
  Employee,
  EmployeeDocument,
  WorkExperience,
  EducationHistory,
  CareerHistory,
  EmployeeFamily,
  MasterData,
  Organization,
  JobLevel,
  JobPosition
};
