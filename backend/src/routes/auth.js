const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const protectAdmin = require('../middleware/protectAdmin');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protectAdmin, authController.me);
router.put('/change-password', protectAdmin, authController.changePassword);

module.exports = router;
