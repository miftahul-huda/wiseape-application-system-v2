const express = require('express');
const router = express.Router();

const stageTemplateController = require('../controllers/recruitmentStageTemplateController');
const matrixTemplateController = require('../controllers/recruitmentMatrixTemplateController');
const jobVacancyController = require('../controllers/jobVacancyController');
const jobApplicantController = require('../controllers/jobApplicantController');
const applicantProcessController = require('../controllers/applicantProcessController');
const { uploadRecruitment } = require('../middleware/recruitmentUpload');

// ==========================================
// 1. Stage Templates
// ==========================================
router.get('/stage-templates', stageTemplateController.findAll);
router.get('/stage-templates/:id', stageTemplateController.findById);
router.post('/stage-templates', stageTemplateController.create);
router.put('/stage-templates/:id', stageTemplateController.update);
router.delete('/stage-templates/:id', stageTemplateController.delete);

// ==========================================
// 2. Matrix Templates
// ==========================================
router.get('/matrix-templates', matrixTemplateController.findAll);
router.get('/matrix-templates/:id', matrixTemplateController.findById);
router.post('/matrix-templates', matrixTemplateController.create);
router.put('/matrix-templates/:id', matrixTemplateController.update);
router.delete('/matrix-templates/:id', matrixTemplateController.delete);

// ==========================================
// 3. Job Vacancies
// ==========================================
router.get('/vacancies', jobVacancyController.findAll);
router.get('/vacancies/:id', jobVacancyController.findById);
router.post('/vacancies', jobVacancyController.create);
router.put('/vacancies/:id', jobVacancyController.update);
router.delete('/vacancies/:id', jobVacancyController.delete);

// ==========================================
// 4. Job Applicants
// ==========================================
router.get('/applicants', jobApplicantController.findAll);
router.get('/applicants/:id', jobApplicantController.findById);
router.post('/applicants', jobApplicantController.create);
router.put('/applicants/:id', jobApplicantController.update);
router.delete('/applicants/:id', jobApplicantController.delete);

// ==========================================
// 5. Applicant Processes
// ==========================================
router.get('/applicants/:applicantId/processes', applicantProcessController.findByApplicantId);
router.get('/processes/:id', applicantProcessController.findById);
router.post('/processes', applicantProcessController.create);
router.put('/processes/:id', applicantProcessController.update);
router.delete('/processes/:id', applicantProcessController.delete);
router.post('/processes/:id/documents', uploadRecruitment.single('file'), applicantProcessController.uploadDocument);
router.delete('/processes/:id/documents/:docId', applicantProcessController.deleteDocument);

module.exports = router;
