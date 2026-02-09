import { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import InfoCard from '../components/InfoCard';
import './Usage.css';

function formatTimestamp(ts, isHourly) {
  if (!ts) return { date: '', time: '' };
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const date = `${dd}/${mm}`;
  const time = isHourly ? `${String(d.getHours()).padStart(2, '0')}:00` : '';
  return { date, time };
}

function getDummyData(range) {
  const now = new Date();
  const isHourly = range === '24h';
  const count = isHourly ? 24 : range === '7d' ? 7 : 10;

  const trends = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (isHourly) d.setHours(d.getHours() - i);
    else d.setDate(d.getDate() - i);
    const ts = isHourly
      ? d.toISOString().slice(0, 19) + '.000Z'
      : d.toISOString().slice(0, 10);
    const hour = d.getHours();
    const base = isHourly ? (hour >= 9 && hour <= 17 ? 800 : 200) : 1200;
    const noise = Math.random() * 400 - 100;
    trends.push({
      timestamp: ts,
      requestCount: Math.max(50, Math.floor(base + noise)),
    });
  }

  const totalRequests = trends.reduce((s, t) => s + (t.requestCount || 0), 0);
  const errorCount = Math.floor(totalRequests * 0.02);

  return {
    summary: {
      totalRequests,
      errorCount,
      errorRate: '2.0',
      avgResponseTimeMs: 142,
    },
    trends,
    endpoints: [
      { endpoint: '/api/users', method: 'GET', requestCount: 4520, avgResponseTimeMs: 89, errorRate: 0.1 },
      { endpoint: '/api/products', method: 'GET', requestCount: 3200, avgResponseTimeMs: 156, errorRate: 0 },
      { endpoint: '/api/auth/login', method: 'POST', requestCount: 1800, avgResponseTimeMs: 234, errorRate: 0.5 },
      { endpoint: '/api/orders', method: 'POST', requestCount: 980, avgResponseTimeMs: 312, errorRate: 1.2 },
      { endpoint: '/api/cart', method: 'GET', requestCount: 2100, avgResponseTimeMs: 45, errorRate: 0 },
      { endpoint: '/api/health', method: 'GET', requestCount: 1500, avgResponseTimeMs: 12, errorRate: 0 },
      { endpoint: '/api/search', method: 'GET', requestCount: 890, avgResponseTimeMs: 178, errorRate: 0.3 },
      { endpoint: '/api/admin/users', method: 'GET', requestCount: 420, avgResponseTimeMs: 98, errorRate: 0 },
      { endpoint: '/api/webhooks', method: 'POST', requestCount: 650, avgResponseTimeMs: 45, errorRate: 0.2 },
      { endpoint: '/api/export', method: 'GET', requestCount: 120, avgResponseTimeMs: 890, errorRate: 0 },
      { endpoint: '/api/config', method: 'GET', requestCount: 380, avgResponseTimeMs: 34, errorRate: 0 },
      { endpoint: '/api/notifications', method: 'POST', requestCount: 210, avgResponseTimeMs: 156, errorRate: 0.5 },
      { endpoint: '/api/analytics', method: 'GET', requestCount: 95, avgResponseTimeMs: 420, errorRate: 0 },
      { endpoint: '/api/reports', method: 'GET', requestCount: 75, avgResponseTimeMs: 1200, errorRate: 0 },
      { endpoint: '/api/docs', method: 'GET', requestCount: 340, avgResponseTimeMs: 28, errorRate: 0 },
    ],
  };
}

const ENDPOINTS_PAGE_SIZE = 10;
const SORT_COLUMNS = ['endpoint', 'method', 'requestCount', 'avgResponseTimeMs', 'errorRate'];

export default function Usage() {
  const [range, setRange] = useState('24h');
  const [endpointsPage, setEndpointsPage] = useState(1);
  const [endpointsSortBy, setEndpointsSortBy] = useState('requestCount');
  const [endpointsSortOrder, setEndpointsSortOrder] = useState('desc');
  const [endpointsTotal, setEndpointsTotal] = useState(0);
  const [projectId, setProjectId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [tree, setTree] = useState([]);
  const [summary, setSummary] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemoData, setIsDemoData] = useState(false);

  useEffect(() => {
    api.projects.tree().then((d) => setTree(d.tree || [])).catch(() => {});
  }, []);

  const servicesForFilter = projectId
    ? tree.find((p) => p.id === projectId)?.services || []
    : tree.flatMap((p) =>
        (p.services || []).map((s) => ({ ...s, projectName: p.name }))
      );

  const handleProjectChange = (id) => {
    setProjectId(id);
    setServiceId('');
    setEndpointsPage(1);
  };

  const usageParams = () => {
    const p = { range };
    if (serviceId) p.serviceId = serviceId;
    else if (projectId) p.projectId = projectId;
    return p;
  };

  const endpointsParams = () => ({
    ...usageParams(),
    page: endpointsPage,
    limit: ENDPOINTS_PAGE_SIZE,
    sortBy: endpointsSortBy,
    sortOrder: endpointsSortOrder,
  });

  useEffect(() => {
    setLoading(true);
    const params = usageParams();
    Promise.all([
      api.usage.summary(params),
      api.usage.trends({
        ...params,
        granularity: range === '24h' ? 'hourly' : 'daily',
      }),
    ])
      .then(([s, t]) => {
        const trendsData = t.data || [];
        const hasData = trendsData.length > 0 || (s?.totalRequests || 0) > 0;
        if (hasData) {
          setSummary(s);
          setTrends(trendsData);
          setIsDemoData(false);
        } else {
          const dummy = getDummyData(range);
          setSummary(dummy.summary);
          setTrends(dummy.trends);
          setIsDemoData(true);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [range, projectId, serviceId]);

  useEffect(() => {
    const params = usageParams();
    const epParams = endpointsParams();
    api.usage
      .endpoints(epParams)
      .then((e) => {
        const endpointsData = e.endpoints || [];
        const total = e.total ?? endpointsData.length;
        if (endpointsData.length > 0 || total > 0) {
          setEndpoints(endpointsData);
          setEndpointsTotal(total);
        } else {
          const dummy = getDummyData(range);
          const all = dummy.endpoints;
          setEndpointsTotal(all.length);
          const dir = endpointsSortOrder === 'asc' ? 1 : -1;
          const sorted = [...all].sort((a, b) => {
            const va = a[endpointsSortBy];
            const vb = b[endpointsSortBy];
            if (typeof va === 'string') return dir * String(va).localeCompare(vb);
            return dir * ((va ?? 0) - (vb ?? 0));
          });
          const start = (endpointsPage - 1) * ENDPOINTS_PAGE_SIZE;
          setEndpoints(sorted.slice(start, start + ENDPOINTS_PAGE_SIZE));
        }
      })
      .catch((err) => setError(err.message));
  }, [range, projectId, serviceId, endpointsPage, endpointsSortBy, endpointsSortOrder]);

  if (loading && !summary) return <div className="page-loading">Loading...</div>;

  return (
    <div className="usage-page">
      <header className="page-header">
        <div>
          <h1>Usage</h1>
          <p>See how much traffic your APIs get, how fast they respond, and if anything broke.</p>
        </div>
        <div className="usage-controls">
          <select
            className="filter-select"
            value={projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            title="Filter by project"
          >
            <option value="">All projects</option>
            {tree.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={serviceId}
            onChange={(e) => { setServiceId(e.target.value); setEndpointsPage(1); }}
            title="Filter by service"
          >
            <option value="">All services</option>
            {servicesForFilter.map((s) => (
              <option key={s.id} value={s.id}>
                {s.projectName ? `${s.name} (${s.projectName})` : s.name}
              </option>
            ))}
          </select>
          <div className="range-selector">
          {['24h', '7d', '30d'].map((r) => (
            <button
              key={r}
              className={`range-btn ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r === '24h' ? '24 hours' : r === '7d' ? '7 days' : '30 days'}
            </button>
          ))}
          </div>
        </div>
      </header>

      {error && (
        <div className="alert alert-error" onClick={() => setError('')}>
          {error}
        </div>
      )}

      <div className="usage-stats-section">
        <InfoCard
          icon="📈"
          title={
            serviceId
              ? 'Metrics for this service'
              : projectId
                ? 'Metrics for this project'
                : 'Aggregate metrics'
          }
        >
          <p>
            {serviceId
              ? 'These numbers are for the single service you selected.'
              : projectId
                ? 'These numbers are for all services in the project you selected.'
                : 'These numbers add up everything across all your APIs.'}
          </p>
        </InfoCard>
        <div className="stats-row">
        <StatCard
          title="Total requests"
          value={summary?.totalRequests?.toLocaleString() || 0}
          subtitle="API calls in this period"
        />
        <StatCard
          title="Error rate"
          value={`${summary?.errorRate || 0}%`}
          subtitle={summary?.errorCount ? `${summary.errorCount} errors` : null}
        />
        <StatCard
          title="Avg response time"
          value={`${summary?.avgResponseTimeMs || 0}ms`}
          subtitle="Average speed"
        />
        </div>
      </div>

      <section className="usage-section">
        <InfoCard icon="📊" title="Traffic over time">
          <p>Number of requests per hour or day. Spot spikes, drops, or weird patterns.</p>
          {isDemoData && <p className="demo-badge">Showing demo data — integrate the middleware to see real traffic.</p>}
        </InfoCard>
        {trends.length === 0 ? (
          <div className="empty-chart">No data for this period</div>
        ) : (
          <div className="trend-chart-wrapper">
            <div className="trend-chart__y-axis">
              {(() => {
                const max = Math.max(...trends.map((x) => x.requestCount || 0), 1);
                const step = Math.ceil(max / 4);
                return [max, step * 3, step * 2, step, 0].map((n) => (
                  <span key={n}>{n.toLocaleString()}</span>
                ));
              })()}
            </div>
            <div className="trend-chart__scroll">
              <div className="trend-chart__body">
                <div className="trend-chart">
                  {trends.map((t) => {
                    const max = Math.max(...trends.map((x) => x.requestCount || 0), 1);
                    const pct = ((t.requestCount || 0) / max) * 100;
                    const barHeight = Math.max(8, (pct / 100) * 120);
                    return (
                      <div key={t.timestamp} className="trend-bar-wrap">
                        <div
                          className="trend-bar"
                          style={{ height: `${barHeight}px` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="trend-chart__x-axis">
                  {trends.map((t) => {
                    const { date, time } = formatTimestamp(t.timestamp, range === '24h');
                    return (
                      <span key={t.timestamp} className="trend-x-label">
                        <span className="trend-x-date">{date}</span>
                        {time && <span className="trend-x-time">{time}</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="usage-section">
        <InfoCard icon="🔥" title="All endpoints">
          <p>Every endpoint and method. Sorted by your choice — click a column header to sort.</p>
        </InfoCard>
        {endpoints.length === 0 && endpointsTotal === 0 ? (
          <div className="empty-state">No endpoint data</div>
        ) : (
          <>
            <div className="endpoints-table-wrap">
              <table className="endpoints-table">
                <thead>
                  <tr>
                    {SORT_COLUMNS.map((col) => (
                      <th
                        key={col}
                        className="endpoints-th-sortable"
                        onClick={() => {
                          if (endpointsSortBy === col) {
                            setEndpointsSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                          } else {
                            setEndpointsSortBy(col);
                            setEndpointsSortOrder(['endpoint', 'method'].includes(col) ? 'asc' : 'desc');
                          }
                          setEndpointsPage(1);
                        }}
                      >
                        {col === 'avgResponseTimeMs' ? 'Avg (ms)' : col === 'requestCount' ? 'Requests' : col === 'errorRate' ? 'Error rate' : col.charAt(0).toUpperCase() + col.slice(1)}
                        {endpointsSortBy === col && (
                          <span className="sort-arrow">{endpointsSortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {endpoints.map((e, i) => (
                    <tr key={i}>
                      <td className="endpoint-path">{e.endpoint}</td>
                      <td>
                        <span className={`method-badge method-${e.method?.toLowerCase()}`}>
                          {e.method}
                        </span>
                      </td>
                      <td>{e.requestCount?.toLocaleString()}</td>
                      <td>{e.avgResponseTimeMs}</td>
                      <td>
                        <span className={e.errorRate > 0 ? 'error-rate' : ''}>
                          {e.errorRate?.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="endpoints-pagination">
              <span className="endpoints-pagination-info">
                Showing {(endpointsPage - 1) * ENDPOINTS_PAGE_SIZE + 1}–{Math.min(endpointsPage * ENDPOINTS_PAGE_SIZE, endpointsTotal)} of {endpointsTotal}
              </span>
              <div className="endpoints-pagination-btns">
                <button
                  className="pagination-btn"
                  disabled={endpointsPage <= 1}
                  onClick={() => setEndpointsPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span className="pagination-page">
                  Page {endpointsPage} of {Math.max(1, Math.ceil(endpointsTotal / ENDPOINTS_PAGE_SIZE))}
                </span>
                <button
                  className="pagination-btn"
                  disabled={endpointsPage >= Math.ceil(endpointsTotal / ENDPOINTS_PAGE_SIZE)}
                  onClick={() => setEndpointsPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
