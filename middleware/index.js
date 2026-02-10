/**
 * Express middleware to track API usage.
 * Captures endpoint, method, status code, response time and sends to the platform.
 *
 * Usage:
 *   const apiUsageMonitor = require('api-usage-monitor');
 *   app.use(apiUsageMonitor({ apiKey: 'YOUR_KEY', ingestionUrl: 'http://localhost:3001' }));
 */

const metrics = [];
const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000;
let flushTimer = null;

function flush(apiKey, ingestionUrl) {
  if (metrics.length === 0) return;

  const batch = metrics.splice(0, BATCH_SIZE);
  const payload = JSON.stringify({ metrics: batch });

  fetch(`${ingestionUrl}/api/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: payload,
  }).catch((err) => console.error('[api-usage-monitor] Failed to send metrics:', err.message));
}

function scheduleFlush(apiKey, ingestionUrl) {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flush(apiKey, ingestionUrl);
    flushTimer = null;
    if (metrics.length > 0) scheduleFlush(apiKey, ingestionUrl);
  }, FLUSH_INTERVAL_MS);
}

/**
 * @param {Object} options
 * @param {string} options.apiKey - Your service API key from the platform
 * @param {string} options.ingestionUrl - Platform URL (e.g. http://localhost:3001)
 * @param {string[]} options.excludePaths - Paths to skip (e.g. ['/health', '/favicon.ico'])
 */
function apiUsageMonitor(options = {}) {
  const { apiKey, ingestionUrl, excludePaths = [] } = options;

  if (!apiKey || !ingestionUrl) {
    console.warn('[api-usage-monitor] apiKey and ingestionUrl are required. Middleware disabled.');
    return (req, res, next) => next();
  }

  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const path = req.path || req.url?.split('?')[0] || '/';
      if (excludePaths.some((p) => path.startsWith(p))) return;

      const reqLen = req.headers['content-length'];
      const resLen = res.getHeader('Content-Length');
      const entry = {
        endpoint: path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: Date.now() - start,
      };
      if (reqLen !== undefined) {
        const n = parseInt(reqLen, 10);
        if (!Number.isNaN(n) && n >= 0) entry.requestSize = n;
      }
      if (resLen !== undefined) {
        const n = parseInt(resLen, 10);
        if (!Number.isNaN(n) && n >= 0) entry.responseSize = n;
      }
      metrics.push(entry);

      if (metrics.length >= BATCH_SIZE) {
        flush(apiKey, ingestionUrl);
      } else {
        scheduleFlush(apiKey, ingestionUrl);
      }
    });

    next();
  };
}

module.exports = apiUsageMonitor;
