const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const protectAdmin = require('../middleware/protectAdmin');

router.post('/', protectAdmin, serviceController.createService);
router.get('/', protectAdmin, serviceController.listServices);

module.exports = router;
