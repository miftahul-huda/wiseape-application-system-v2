const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');

router.get('/tree', organizationController.getTree);
router.get('/', organizationController.list);
router.get('/:id', organizationController.getById);
router.post('/', organizationController.create);
router.put('/:id', organizationController.update);
router.patch('/:id/deactivate', organizationController.deactivate);
router.patch('/:id/activate', organizationController.activate);
router.delete('/:id', organizationController.delete);

module.exports = router;
