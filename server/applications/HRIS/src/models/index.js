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
const RecruitmentStageTemplate = require('./RecruitmentStageTemplate');
const RecruitmentMatrixTemplate = require('./RecruitmentMatrixTemplate');
const JobVacancy = require('./JobVacancy');
const JobApplicant = require('./JobApplicant');
const ApplicantProcess = require('./ApplicantProcess');
const RecruitmentDocument = require('./RecruitmentDocument');

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

// ==========================================
// Recruitment Associations
// ==========================================

// 10. JobVacancy <-> JobApplicant (1 : M)
JobVacancy.hasMany(JobApplicant, {
  foreignKey: 'jobVacancyId',
  as: 'applicants',
  onDelete: 'CASCADE'
});
JobApplicant.belongsTo(JobVacancy, {
  foreignKey: 'jobVacancyId',
  as: 'vacancy'
});

// 11. JobApplicant <-> ApplicantProcess (1 : M)
JobApplicant.hasMany(ApplicantProcess, {
  foreignKey: 'applicantId',
  as: 'processes',
  onDelete: 'CASCADE'
});
ApplicantProcess.belongsTo(JobApplicant, {
  foreignKey: 'applicantId',
  as: 'applicant'
});

// 12. JobVacancy <-> ApplicantProcess (1 : M)
JobVacancy.hasMany(ApplicantProcess, {
  foreignKey: 'jobVacancyId',
  as: 'processes',
  onDelete: 'CASCADE'
});
ApplicantProcess.belongsTo(JobVacancy, {
  foreignKey: 'jobVacancyId',
  as: 'vacancy'
});

// 13. ApplicantProcess <-> RecruitmentDocument (1 : M)
ApplicantProcess.hasMany(RecruitmentDocument, {
  foreignKey: 'applicantProcessId',
  as: 'documentsList',
  onDelete: 'CASCADE'
});
RecruitmentDocument.belongsTo(ApplicantProcess, {
  foreignKey: 'applicantProcessId',
  as: 'applicantProcess'
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
  JobPosition,
  RecruitmentStageTemplate,
  RecruitmentMatrixTemplate,
  JobVacancy,
  JobApplicant,
  ApplicantProcess,
  RecruitmentDocument
};
