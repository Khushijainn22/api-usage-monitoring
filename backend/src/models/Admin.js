/**
 * Admin = Platform user who signs up and monitors their APIs.
 * Stores: email, hashed password, name.
 * Used when Admins sign up (Step 1) and log in to access the dashboard.
 *
 * TODO: Add sign-up/login routes and protect Service creation with Admin auth.
 */
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
