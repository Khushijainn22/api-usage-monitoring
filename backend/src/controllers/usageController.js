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

const ENDPOINT_SORT_FIELDS = [
  'endpoint',
  'method',
  'requestCount',
  'avgResponseTimeMs',
  'minResponseTimeMs',
  'maxResponseTimeMs',
  'errorRate',
  'successCount',
  'clientErrorCount',
  'serverErrorCount',
  'lastHit',
  'avgRequestSize',
  'avgResponseSize',
];

/**
 * GET /api/usage/endpoints
 * Returns per-endpoint metrics: counts, latency (avg/min/max), status breakdown (2xx/4xx/5xx),
 * lastHit, optional sizes. No PII or request/response content.
 */
async function getEndpoints(req, res) {
  try {
    const { from, to } = getTimeRange(req.query);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 10), 100);
    const sortBy = ENDPOINT_SORT_FIELDS.includes(req.query.sortBy)
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
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' },
          lastHit: { $max: '$timestamp' },
          successCount: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$statusCode', 200] }, { $lt: ['$statusCode', 300] }] },
                '$requestCount',
                0,
              ],
            },
          },
          clientErrorCount: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$statusCode', 400] }, { $lt: ['$statusCode', 500] }] },
                '$requestCount',
                0,
              ],
            },
          },
          serverErrorCount: {
            $sum: {
              $cond: [{ $gte: ['$statusCode', 500] }, '$requestCount', 0],
            },
          },
          totalRequestSize: {
            $sum: { $multiply: [{ $ifNull: ['$requestSize', 0] }, '$requestCount'] },
          },
          sizeRequestCount: {
            $sum: {
              $cond: [{ $gt: [{ $ifNull: ['$requestSize', 0] }, 0] }, '$requestCount', 0],
            },
          },
          totalResponseSize: {
            $sum: { $multiply: [{ $ifNull: ['$responseSize', 0] }, '$requestCount'] },
          },
          sizeResponseCount: {
            $sum: {
              $cond: [{ $gt: [{ $ifNull: ['$responseSize', 0] }, 0] }, '$requestCount', 0],
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
          minResponseTimeMs: { $round: ['$minResponseTime', 0] },
          maxResponseTimeMs: { $round: ['$maxResponseTime', 0] },
          lastHit: 1,
          successCount: 1,
          clientErrorCount: 1,
          serverErrorCount: 1,
          errorCount: { $add: ['$clientErrorCount', '$serverErrorCount'] },
          errorRate: {
            $cond: [
              { $eq: ['$requestCount', 0] },
              0,
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ['$clientErrorCount', '$serverErrorCount'] },
                      '$requestCount',
                    ],
                  },
                  100,
                ],
              },
            ],
          },
          avgRequestSize: {
            $cond: [
              { $gt: ['$sizeRequestCount', 0] },
              { $round: [{ $divide: ['$totalRequestSize', '$sizeRequestCount'] }, 0] },
              null,
            ],
          },
          avgResponseSize: {
            $cond: [
              { $gt: ['$sizeResponseCount', 0] },
              { $round: [{ $divide: ['$totalResponseSize', '$sizeResponseCount'] }, 0] },
              null,
            ],
          },
        },
      },
      {
        $project: {
          totalRequestSize: 0,
          totalResponseSize: 0,
          sizeRequestCount: 0,
          sizeResponseCount: 0,
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
