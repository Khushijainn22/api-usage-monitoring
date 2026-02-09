/**
 * Step 6: Look up which Service has this API key.
 * Admin's middleware sends X-API-Key (from Step 3).
 * We find the Service → attach serviceId to req → metrics get tied to that API.
 */
const Service = require('../models/Service');
const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing X-API-Key header',
    });
  }

  try {
    const service = await Service.findOne({ apiKey });
    if (!service) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
    }
    req.serviceId = service._id.toString();
    req.service = service;
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to validate API key',
    });
  }
};

module.exports = validateApiKey;
