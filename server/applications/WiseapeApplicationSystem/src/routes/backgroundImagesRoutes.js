const express = require('express');
const backgroundImagesController = require('../controllers/backgroundImagesController');
const { requireUser } = require('../middleware/auth');

const router = express.Router();
router.get('/', requireUser, backgroundImagesController.list);
router.post('/', requireUser, backgroundImagesController.create);

module.exports = router;
