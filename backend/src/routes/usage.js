const express = require('express');
const router = express.Router();
const usageController = require('../controllers/usageController');
const protectAdmin = require('../middleware/protectAdmin');

router.get('/summary', protectAdmin, usageController.getSummary);
router.get('/endpoints', protectAdmin, usageController.getEndpoints);
router.get('/trends', protectAdmin, usageController.getTrends);

module.exports = router;
