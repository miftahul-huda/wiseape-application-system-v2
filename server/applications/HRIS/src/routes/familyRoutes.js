const express = require('express');
const router = express.Router({ mergeParams: true });
const familyController = require('../controllers/familyController');

// Mounted at /api/family and /api/employees/:employeeId/family
router
  .route('/')
  .get(familyController.listByEmployee)
  .post(familyController.create);

router
  .route('/:id')
  .get(familyController.getById)
  .put(familyController.update)
  .delete(familyController.delete);

module.exports = router;
