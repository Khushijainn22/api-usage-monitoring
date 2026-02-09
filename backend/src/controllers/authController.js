const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

/**
 * POST /api/auth/register - Sign up
 */
async function register(req, res) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Email, password, and name are required',
      });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered',
      });
    }

    const isFirstAdmin = (await Admin.countDocuments()) === 0;
    const role = isFirstAdmin ? 'admin' : 'user';

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      role,
    });

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      token,
      expiresIn: "7d",
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register',
    });
  }
}

/**
 * POST /api/auth/login - Sign in
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Email and password are required',
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      token,
      expiresIn: "7d",
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to login',
    });
  }
}

/**
 * GET /api/auth/me - Get current admin (requires token)
 */
async function me(req, res) {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    if (!admin) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Admin not found',
      });
    }
    res.json({
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch admin',
    });
  }
}

/**
 * PUT /api/auth/change-password - Change password (requires token)
 * Body: { currentPassword, newPassword }
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'currentPassword and newPassword are required',
      });
    }

    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Admin not found',
      });
    }

    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Current password is incorrect',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to change password',
    });
  }
}

module.exports = { register, login, me, changePassword };
