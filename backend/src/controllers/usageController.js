const ApiMetric = require('../models/ApiMetric');
const Service = require('../models/Service');
const AdminProject = require('../models/AdminProject');

function getTimeRange(query) {
  const now = new Date();
  let from = new Date(now);
  const to = now;

  if (query.from && query.to) {
    from = new Date(query.from);
    return { from, to: new Date(query.to) };
  }

  const range = query.range || '24h';
  if (range === '24h') from.setHours(now.getHours() - 24);
  else if (range === '7d') from.setDate(now.getDate() - 7);
  else if (range === '30d') from.setDate(now.getDate() - 30);

  return { from, to };
}

/**
 * Build service filter. Owner: use query params. Admin: restrict to own services.
 */
async function getServiceFilter(query, req) {
  if (req.adminRole === 'user') {
    const myProjects = await AdminProject.find({ adminId: req.adminId }).select('_id');
    const myProjectIds = myProjects.map((p) => p._id);
    const myServices = await Service.find({
      projectId: { $in: myProjectIds },
    }).select('_id');
    const myServiceIds = myServices.map((s) => s._id.toString());
    const baseFilter = { serviceId: { $in: myServiceIds } };

    if (query.serviceId) {
      if (!myServiceIds.includes(query.serviceId)) return { serviceId: { $in: [] } };
      return { serviceId: query.serviceId };
    }
    if (query.projectId) {
      const projectBelongsToMe = myProjectIds.some(
        (id) => id.toString() === query.projectId
      );
      if (!projectBelongsToMe) return { serviceId: { $in: [] } };
      const services = await Service.find({ projectId: query.projectId }).select('_id');
      const ids = services.map((s) => s._id.toString());
      return { serviceId: { $in: ids } };
    }
    return baseFilter;
  }

  if (query.serviceId) return { serviceId: query.serviceId };
  if (query.projectId) {
    const services = await Service.find({ projectId: query.projectId }).select(
      '_id'
    );
    const serviceIds = services.map((s) => s._id.toString());
    return { serviceId: { $in: serviceIds } };
  }
  return {};
}

/**
 * GET /api/usage/summary
 */
async function getSummary(req, res) {
  try {
    const { from, to } = getTimeRange(req.query);
    const serviceFilter = await getServiceFilter(req.query, req);
    const match = {
      timestamp: { $gte: from, $lte: to },
      ...serviceFilter,
    };

    const [summary] = await ApiMetric.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: '$requestCount' },
          avgResponseTime: { $avg: '$responseTime' },
          errorCount: {
            $sum: {
              $cond: [{ $gte: ['$statusCode', 400] }, '$requestCount', 0],
            },
          },
        },
      },
    ]);

    const total = summary?.totalRequests || 0;
    const errors = summary?.errorCount || 0;

    res.json({
      from,
      to,
      totalRequests: total,
      errorCount: errors,
      errorRate: total > 0 ? ((errors / total) * 100).toFixed(2) : 0,
      avgResponseTimeMs: summary?.avgResponseTime
        ? Math.round(summary.avgResponseTime)
        : 0,
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch usage summary',
    });
  }
}

/**
 * GET /api/usage/endpoints
 * Query: page, limit, sortBy (endpoint|method|requestCount|avgResponseTimeMs|errorRate), sortOrder (asc|desc)
 */
async function getEndpoints(req, res) {
  try {
    const { from, to } = getTimeRange(req.query);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 10), 100);
    const sortBy = ['endpoint', 'method', 'requestCount', 'avgResponseTimeMs', 'errorRate'].includes(
      req.query.sortBy
    )
      ? req.query.sortBy
      : 'requestCount';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const serviceFilter = await getServiceFilter(req.query, req);
    const match = {
      timestamp: { $gte: from, $lte: to },
      ...serviceFilter,
    };

    const sortStage = { [sortBy]: sortOrder };

    const [result] = await ApiMetric.aggregate([
      { $match: match },
      {
        $group: {
          _id: { endpoint: '$endpoint', method: '$method' },
          requestCount: { $sum: '$requestCount' },
          avgResponseTime: { $avg: '$responseTime' },
          errorCount: {
            $sum: {
              $cond: [{ $gte: ['$statusCode', 400] }, '$requestCount', 0],
            },
          },
        },
      },
      {
        $project: {
          endpoint: '$_id.endpoint',
          method: '$_id.method',
          requestCount: 1,
          avgResponseTimeMs: { $round: ['$avgResponseTime', 0] },
          errorCount: 1,
          errorRate: {
            $cond: [
              { $eq: ['$requestCount', 0] },
              0,
              { $multiply: [{ $divide: ['$errorCount', '$requestCount'] }, 100] },
            ],
          },
        },
      },
      {
        $facet: {
          total: [{ $count: 'count' }],
          endpoints: [{ $sort: sortStage }, { $skip: skip }, { $limit: limit }],
        },
      },
    ]);

    const total = result?.total?.[0]?.count || 0;

    res.json({
      from,
      to,
      endpoints: result?.endpoints || [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Endpoints error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch endpoint usage',
    });
  }
}

/**
 * GET /api/usage/trends
 */
async function getTrends(req, res) {
  try {
    const { from, to } = getTimeRange(req.query);
    const granularity = req.query.granularity || 'hourly';

    const serviceFilter = await getServiceFilter(req.query, req);
    const match = {
      timestamp: { $gte: from, $lte: to },
      ...serviceFilter,
    };

    const dateFormat =
      granularity === 'daily' ? '%Y-%m-%d' : '%Y-%m-%dT%H:00:00.000Z';

    const trends = await ApiMetric.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$timestamp' },
          },
          requestCount: { $sum: '$requestCount' },
          avgResponseTime: { $avg: '$responseTime' },
          errorCount: {
            $sum: {
              $cond: [{ $gte: ['$statusCode', 400] }, '$requestCount', 0],
            },
          },
        },
      },
      {
        $project: {
          timestamp: '$_id',
          requestCount: 1,
          avgResponseTimeMs: { $round: ['$avgResponseTime', 0] },
          errorCount: 1,
        },
      },
      { $sort: { timestamp: 1 } },
    ]);

    res.json({ from, to, granularity, data: trends });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch usage trends',
    });
  }
}

module.exports = { getSummary, getEndpoints, getTrends };
