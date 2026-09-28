const express = require('express');
const router = express.Router();
const educationController = require('../controllers/educationController');

router.get('/:id', educationController.getById);
router.put('/:id', educationController.update);
router.delete('/:id', educationController.delete);

module.exports = router;
