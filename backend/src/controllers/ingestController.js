const ApiMetric = require('../models/ApiMetric');

/**
 * POST /api/ingest - Save metrics (after validateApiKey + validateIngest)
 */
async function ingest(req, res) {
  try {
    const { serviceId } = req;
    const metrics = req.validatedMetrics.map((m) => ({
      ...m,
      timestamp: new Date(),
      serviceId,
    }));

    await ApiMetric.insertMany(metrics);

    res.status(202).json({
      success: true,
      ingested: metrics.length,
      message: 'Metrics queued for processing',
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to ingest metrics',
    });
  }
}

module.exports = { ingest };
