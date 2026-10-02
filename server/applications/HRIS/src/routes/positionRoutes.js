const express = require('express');
const router = express.Router();
const positionController = require('../controllers/positionController');

router.get('/', positionController.list);
router.get('/:id', positionController.getById);
router.post('/', positionController.create);
router.put('/:id', positionController.update);
router.patch('/:id/deactivate', positionController.deactivate);
router.patch('/:id/activate', positionController.activate);
router.delete('/:id', positionController.delete);

module.exports = router;
