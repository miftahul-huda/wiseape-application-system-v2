const express = require('express');
const themesController = require('../controllers/themesController');

const { requireUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.get('/', themesController.list);
router.post('/', requireUser, requireAdmin, themesController.create);
router.put('/:id', requireUser, requireAdmin, themesController.update);
router.delete('/:id', requireUser, requireAdmin, themesController.deleteTheme);

module.exports = router;

