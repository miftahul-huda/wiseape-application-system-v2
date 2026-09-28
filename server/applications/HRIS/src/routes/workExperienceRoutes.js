const express = require('express');
const router = express.Router();
const workExperienceController = require('../controllers/workExperienceController');

router.get('/:id', workExperienceController.getById);
router.put('/:id', workExperienceController.update);
router.delete('/:id', workExperienceController.delete);

module.exports = router;
