const Admin = require('../models/Admin');

/**
 * GET /api/admins - List all users (Admin only)
 */
async function listAdmins(req, res) {
  try {
    const admins = await Admin.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      admins: admins.map((a) => ({
        id: a._id,
        email: a.email,
        name: a.name,
        role: a.role,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list admins',
    });
  }
}

module.exports = { listAdmins };
