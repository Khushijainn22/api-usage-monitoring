/**
 * Step 5: Validate payload from Admin's middleware.
 * Only allows metadata: endpoint, method, statusCode, responseTime, requestCount.
 * No payloads, responses, tokens, or secrets.
 */
const validateIngest = (req, res, next) => {
  const { metrics } = req.body;

  if (!metrics || !Array.isArray(metrics)) {
    return res.status(400).json({
      error: 'Invalid payload',
      message: 'Request body must contain a "metrics" array',
    });
  }

  const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  const errors = [];

  const validatedMetrics = metrics.filter((m, idx) => {
    if (!m || typeof m !== 'object') {
      errors.push(`Metric at index ${idx}: must be an object`);
      return false;
    }

    if (!m.endpoint || typeof m.endpoint !== 'string') {
      errors.push(`Metric at index ${idx}: endpoint is required and must be a string`);
      return false;
    }

    if (!m.method || !allowedMethods.includes(m.method.toUpperCase())) {
      errors.push(`Metric at index ${idx}: method must be one of ${allowedMethods.join(', ')}`);
      return false;
    }

    if (typeof m.statusCode !== 'number' || m.statusCode < 100 || m.statusCode > 599) {
      errors.push(`Metric at index ${idx}: statusCode must be a valid HTTP status (100-599)`);
      return false;
    }

    if (typeof m.responseTime !== 'number' || m.responseTime < 0) {
      errors.push(`Metric at index ${idx}: responseTime must be a non-negative number`);
      return false;
    }

    if (m.requestSize !== undefined) {
      if (typeof m.requestSize !== 'number' || m.requestSize < 0) {
        errors.push(`Metric at index ${idx}: requestSize must be a non-negative number`);
        return false;
      }
    }
    if (m.responseSize !== undefined) {
      if (typeof m.responseSize !== 'number' || m.responseSize < 0) {
        errors.push(`Metric at index ${idx}: responseSize must be a non-negative number`);
        return false;
      }
    }

    return true;
  });

  if (validatedMetrics.length === 0) {
    return res.status(400).json({
      error: 'Invalid payload',
      message: 'No valid metrics to ingest',
      details: errors,
    });
  }

  const ENDPOINT_MAX_LEN = 2048;

  // Normalize and attach to request (no PII: endpoint path only, no query/body/tokens)
  req.validatedMetrics = validatedMetrics.map((m) => {
    const endpoint = String(m.endpoint).trim().slice(0, ENDPOINT_MAX_LEN);
    const out = {
      endpoint,
      method: m.method.toUpperCase(),
      statusCode: m.statusCode,
      responseTime: m.responseTime,
      requestCount: typeof m.requestCount === 'number' && m.requestCount > 0 ? m.requestCount : 1,
    };
    if (typeof m.requestSize === 'number' && m.requestSize >= 0) out.requestSize = Math.round(m.requestSize);
    if (typeof m.responseSize === 'number' && m.responseSize >= 0) out.responseSize = Math.round(m.responseSize);
    return out;
  });

  if (errors.length > 0) {
    req.validationWarnings = errors;
  }

  next();
};

module.exports = validateIngest;
