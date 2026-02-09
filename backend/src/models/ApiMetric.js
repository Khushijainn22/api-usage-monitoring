/**
 * Step 6: Each metric is saved with serviceId → tied to Admin's API.
 * Collected by Admin's middleware (Step 5), stored for dashboard (Step 7).
 */
const mongoose = require('mongoose');

const apiMetricSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  serviceId: {
    type: String,
    required: true,
    index: true,
  },
  endpoint: {
    type: String,
    required: true,
    index: true,
  },
  method: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
  },
  statusCode: {
    type: Number,
    required: true,
  },
  responseTime: {
    type: Number,
    required: true,
    default: 0,
  },
  requestCount: {
    type: Number,
    default: 1,
  },
});

// Compound indexes for common queries
apiMetricSchema.index({ timestamp: 1, serviceId: 1 });
apiMetricSchema.index({ timestamp: 1, endpoint: 1 });
apiMetricSchema.index({ serviceId: 1, timestamp: -1 });

module.exports = mongoose.model('ApiMetric', apiMetricSchema);
