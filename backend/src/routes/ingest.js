const express = require('express');
const router = express.Router();
const ingestController = require('../controllers/ingestController');
const validateIngest = require('../middleware/validateIngest');
const validateApiKey = require('../middleware/auth');

router.post('/', validateApiKey, validateIngest, ingestController.ingest);

module.exports = router;
