const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const protectAdmin = require('../middleware/protectAdmin');

router.post('/', protectAdmin, projectController.createProject);
router.get('/', protectAdmin, projectController.listProjects);
router.get('/tree', protectAdmin, projectController.getTree);
router.get('/:id', protectAdmin, projectController.getProject);

module.exports = router;
