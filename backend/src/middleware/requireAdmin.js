/**
 * Restricts route to Admin (Super Admin) only.
 * Must be used after protectAdmin.
 */
function requireAdmin(req, res, next) {
  if (req.adminRole !== 'admin' && req.adminRole !== 'owner') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }
  next();
}

module.exports = requireAdmin;
