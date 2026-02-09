const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const protectAdmin = require('../middleware/protectAdmin');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/', protectAdmin, requireAdmin, adminController.listAdmins);

module.exports = router;
