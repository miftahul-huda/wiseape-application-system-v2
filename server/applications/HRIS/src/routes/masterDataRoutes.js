const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterDataController');

router.get('/types', masterDataController.listCategories);
router.get('/', masterDataController.list);
router.get('/:id', masterDataController.getById);
router.post('/', masterDataController.create);
router.put('/:id', masterDataController.update);
router.patch('/:id/deactivate', masterDataController.deactivate);
router.patch('/:id/activate', masterDataController.activate);
router.delete('/:id', masterDataController.delete);

module.exports = router;
