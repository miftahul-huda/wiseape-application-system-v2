const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const documentController = require('../controllers/documentController');
const workExperienceController = require('../controllers/workExperienceController');
const educationController = require('../controllers/educationController');
const careerHistoryController = require('../controllers/careerHistoryController');
const { upload } = require('../middleware/upload');

// ==========================================
// Employee Base Routes
// ==========================================
router.get('/', employeeController.findAll);
router.get('/statistics', employeeController.getStatistics);
router.get('/:id', employeeController.getById);
router.post('/', employeeController.create);
router.put('/:id', employeeController.update);
router.patch('/:id/deactivate', employeeController.deactivate);
router.patch('/:id/activate', employeeController.activate);
router.delete('/:id', employeeController.delete);

// ==========================================
// Nested Subroutes under /:employeeId
// ==========================================

// 1. Documents
router.get('/:employeeId/documents', documentController.listByEmployee);
router.post(
  '/:employeeId/documents',
  upload.single('file'),
  documentController.uploadDocument
);

// 2. Previous Work Experiences
router.get('/:employeeId/work-experiences', workExperienceController.listByEmployee);
router.post('/:employeeId/work-experiences', workExperienceController.create);

// 3. Education Histories
router.get('/:employeeId/education', educationController.listByEmployee);
router.post('/:employeeId/education', educationController.create);

// 4. Internal Career & Org History
router.get('/:employeeId/career-history', careerHistoryController.listByEmployee);
router.post('/:employeeId/career-history', careerHistoryController.create);

module.exports = router;
