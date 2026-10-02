const express = require('express');
const router = express.Router();
const jobLevelController = require('../controllers/jobLevelController');

router.get('/', jobLevelController.list);
router.get('/:id', jobLevelController.getById);
router.post('/', jobLevelController.create);
router.put('/:id', jobLevelController.update);
router.patch('/:id/deactivate', jobLevelController.deactivate);
router.patch('/:id/activate', jobLevelController.activate);
router.delete('/:id', jobLevelController.delete);

module.exports = router;
