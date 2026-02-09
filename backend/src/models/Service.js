/**
 * Step 2: Admin creates a Service (registers their API) under a Project.
 * Structure: Admin → Project (folder) → Service (API).
 * Stores: name, apiKey. Service owns the API key used for ingestion (Step 5–6).
 */
const mongoose = require('mongoose');
const crypto = require('crypto');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    apiKey: {
      type: String,
      required: true,
      unique: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminProject',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for listing services by project
serviceSchema.index({ projectId: 1 });

// Generate a secure API key
serviceSchema.statics.generateApiKey = function () {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.model('Service', serviceSchema);
