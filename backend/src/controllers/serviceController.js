const Service = require('../models/Service');
const AdminProject = require('../models/AdminProject');

/**
 * POST /api/services - Create service under project (requires auth)
 */
async function createService(req, res) {
  try {
    const { name, projectId } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Service name is required',
      });
    }
    if (!projectId) {
      return res.status(400).json({
        error: 'Bad request',
        message:
          'projectId is required. Create a project first (POST /api/projects).',
      });
    }

    const project = await AdminProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Project not found',
      });
    }

    if (
      req.adminRole === 'user' &&
      project.adminId?.toString() !== req.adminId
    ) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this project',
      });
    }

    const apiKey = Service.generateApiKey();
    const service = await Service.create({
      name: name.trim(),
      apiKey,
      projectId,
    });

    res.status(201).json({
      success: true,
      service: {
        id: service._id,
        name: service.name,
        projectId: service.projectId,
        apiKey,
        createdAt: service.createdAt,
      },
      message: 'Store the API key securely. It will not be shown again. Use it to ingest metrics.',
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create service',
    });
  }
}

/**
 * GET /api/services - List services (Admin: all, User: own projects only)
 */
async function listServices(req, res) {
  try {
    const filter = {};
    if (req.query.projectId) filter.projectId = req.query.projectId;

    if (req.adminRole === 'user') {
      const myProjects = await AdminProject.find({ adminId: req.adminId }).select('_id');
      const myProjectIds = myProjects.map((p) => p._id);
      filter.projectId = { $in: myProjectIds };
      if (req.query.projectId) {
        if (!myProjectIds.some((id) => id.toString() === req.query.projectId)) {
          return res.json({ services: [] });
        }
        filter.projectId = req.query.projectId;
      }
    }

    const services = await Service.find(filter)
      .select('-apiKey')
      .sort({ createdAt: -1 });

    res.json({
      services: services.map((s) => ({
        id: s._id,
        name: s.name,
        projectId: s.projectId,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('List services error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list services',
    });
  }
}

module.exports = { createService, listServices };
