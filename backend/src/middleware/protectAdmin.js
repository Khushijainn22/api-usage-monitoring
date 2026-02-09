const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

/**
 * Protects routes that require logged-in Admin.
 * Expects: Authorization: Bearer <token>
 * Attaches adminId, adminRole to req.
 */
async function protectAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token required. Use Authorization: Bearer <token>',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('_id role');
    if (!admin) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin not found',
      });
    }
    req.adminId = admin._id.toString();
    req.adminRole = admin.role;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

module.exports = protectAdmin;
