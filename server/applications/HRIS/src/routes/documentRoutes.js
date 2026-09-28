const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

router.get('/:id', documentController.getDocumentById);
router.get('/:id/download', documentController.downloadDocument);
router.put('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
