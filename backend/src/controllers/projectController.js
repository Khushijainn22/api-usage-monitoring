const AdminProject = require('../models/AdminProject');
const Service = require('../models/Service');

/**
 * POST /api/projects - Create project (requires auth)
 */
async function createProject(req, res) {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Project name is required',
      });
    }

    const project = await AdminProject.create({
      name: name.trim(),
      adminId: req.adminId,
    });

    res.status(201).json({
      success: true,
      project: {
        id: project._id,
        name: project.name,
        createdAt: project.createdAt,
      },
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create project',
    });
  }
}

/**
 * GET /api/projects - List projects (Admin: all, User: own only)
 */
async function listProjects(req, res) {
  try {
    const isAdmin = req.adminRole === 'admin' || req.adminRole === 'owner';
    const filter = isAdmin ? {} : { adminId: req.adminId };
    const projects = await AdminProject.find(filter).sort({ createdAt: -1 });

    res.json({
      projects: projects.map((p) => ({
        id: p._id,
        name: p.name,
        adminId: p.adminId,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list projects',
    });
  }
}

/**
 * GET /api/projects/tree - Folder structure (Admin: all, User: own only)
 */
async function getTree(req, res) {
  try {
    const projectFilter =
      (req.adminRole === 'admin' || req.adminRole === 'owner') ? {} : { adminId: req.adminId };
    const projects = await AdminProject.find(projectFilter).sort({
      createdAt: -1,
    });
    const services = await Service.find()
      .select('-apiKey')
      .sort({ createdAt: -1 });

    const tree = projects.map((p) => {
      const projectServices = services
        .filter(
          (s) => s.projectId && s.projectId.toString() === p._id.toString()
        )
        .map((s) => ({
          id: s._id,
          name: s.name,
          createdAt: s.createdAt,
        }));

      return {
        id: p._id,
        name: p.name,
        adminId: p.adminId,
        services: projectServices,
        createdAt: p.createdAt,
      };
    });

    res.json({ tree });
  } catch (error) {
    console.error('Tree error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch folder structure',
    });
  }
}

/**
 * GET /api/projects/:id - Get project with services (User: must own project)
 */
async function getProject(req, res) {
  try {
    const project = await AdminProject.findById(req.params.id);
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

    const services = await Service.find({ projectId: project._id }).select(
      '-apiKey'
    );

    res.json({
      project: {
        id: project._id,
        name: project.name,
        createdAt: project.createdAt,
      },
      services: services.map((s) => ({
        id: s._id,
        name: s.name,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch project',
    });
  }
}

module.exports = {
  createProject,
  listProjects,
  getTree,
  getProject,
};
