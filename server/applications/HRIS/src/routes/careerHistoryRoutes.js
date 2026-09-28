const express = require('express');
const router = express.Router();
const careerHistoryController = require('../controllers/careerHistoryController');

router.get('/:id', careerHistoryController.getById);
router.put('/:id', careerHistoryController.update);
router.delete('/:id', careerHistoryController.delete);

module.exports = router;
