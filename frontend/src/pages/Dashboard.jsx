import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import StatCard from "../components/StatCard";
import "./Dashboard.css";
import "./Usage.css";

function formatTimestamp(ts, isHourly) {
  if (!ts) return { date: "", time: "" };
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const date = `${dd}/${mm}`;
  const time = isHourly ? `${String(d.getHours()).padStart(2, "0")}:00` : "";
  return { date, time };
}

function getDummyData(range) {
  const now = new Date();
  const isHourly = range === "24h";
  const count = isHourly ? 24 : range === "7d" ? 7 : 10;
  const trends = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (isHourly) d.setHours(d.getHours() - i);
    else d.setDate(d.getDate() - i);
    const ts = isHourly
      ? d.toISOString().slice(0, 19) + ".000Z"
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
      errorRate: "2.0",
      avgResponseTimeMs: 142,
    },
    trends,
    endpoints: [
      { endpoint: "/api/users", method: "GET", requestCount: 4520, successCount: 4480, clientErrorCount: 35, serverErrorCount: 5, avgResponseTimeMs: 89, minResponseTimeMs: 12, maxResponseTimeMs: 420, errorRate: 0.1, lastHit: now.toISOString(), avgRequestSize: 120, avgResponseSize: 1024 },
      { endpoint: "/api/products", method: "GET", requestCount: 3200, successCount: 3200, clientErrorCount: 0, serverErrorCount: 0, avgResponseTimeMs: 156, minResponseTimeMs: 45, maxResponseTimeMs: 890, errorRate: 0, lastHit: now.toISOString(), avgRequestSize: 0, avgResponseSize: 2048 },
      { endpoint: "/api/auth/login", method: "POST", requestCount: 1800, successCount: 1791, clientErrorCount: 9, serverErrorCount: 0, avgResponseTimeMs: 234, minResponseTimeMs: 89, maxResponseTimeMs: 1200, errorRate: 0.5, lastHit: now.toISOString(), avgRequestSize: 256, avgResponseSize: 512 },
      { endpoint: "/api/orders", method: "POST", requestCount: 980, successCount: 968, clientErrorCount: 10, serverErrorCount: 2, avgResponseTimeMs: 312, minResponseTimeMs: 120, maxResponseTimeMs: 2100, errorRate: 1.2, lastHit: now.toISOString(), avgRequestSize: 420, avgResponseSize: 180 },
      { endpoint: "/api/cart", method: "GET", requestCount: 2100, successCount: 2100, clientErrorCount: 0, serverErrorCount: 0, avgResponseTimeMs: 45, minResponseTimeMs: 8, maxResponseTimeMs: 340, errorRate: 0, lastHit: now.toISOString(), avgRequestSize: null, avgResponseSize: 320 },
      { endpoint: "/api/health", method: "GET", requestCount: 1500, successCount: 1500, clientErrorCount: 0, serverErrorCount: 0, avgResponseTimeMs: 12, minResponseTimeMs: 2, maxResponseTimeMs: 45, errorRate: 0, lastHit: now.toISOString(), avgRequestSize: null, avgResponseSize: 12 },
      { endpoint: "/api/search", method: "GET", requestCount: 890, successCount: 887, clientErrorCount: 3, serverErrorCount: 0, avgResponseTimeMs: 178, minResponseTimeMs: 34, maxResponseTimeMs: 560, errorRate: 0.3, lastHit: now.toISOString(), avgRequestSize: 80, avgResponseSize: 4096 },
      { endpoint: "/api/admin/users", method: "GET", requestCount: 420, successCount: 420, clientErrorCount: 0, serverErrorCount: 0, avgResponseTimeMs: 98, minResponseTimeMs: 28, maxResponseTimeMs: 280, errorRate: 0, lastHit: now.toISOString(), avgRequestSize: null, avgResponseSize: 512 },
      { endpoint: "/api/webhooks", method: "POST", requestCount: 650, successCount: 649, clientErrorCount: 1, serverErrorCount: 0, avgResponseTimeMs: 45, minResponseTimeMs: 12, maxResponseTimeMs: 120, errorRate: 0.2, lastHit: now.toISOString(), avgRequestSize: 1024, avgResponseSize: 0 },
      { endpoint: "/api/export", method: "GET", requestCount: 120, successCount: 120, clientErrorCount: 0, serverErrorCount: 0, avgResponseTimeMs: 890, minResponseTimeMs: 340, maxResponseTimeMs: 3200, errorRate: 0, lastHit: now.toISOString(), avgRequestSize: null, avgResponseSize: 524288 },
      { endpoint: "/api/config", method: "GET", requestCount: 380, successCount: 380, clientErrorCount: 0, serverErrorCount: 0, avgResponseTimeMs: 34, minResponseTimeMs: 8, maxResponseTimeMs: 120, errorRate: 0, lastHit: now.toISOString(), avgRequestSize: null, avgResponseSize: 256 },
      { endpoint: "/api/notifications", method: "POST", requestCount: 210, successCount: 209, clientErrorCount: 0, serverErrorCount: 1, avgResponseTimeMs: 156, minResponseTimeMs: 45, maxResponseTimeMs: 890, errorRate: 0.5, lastHit: now.toISOString(), avgRequestSize: 180, avgResponseSize: 64 },
      { endpoint: "/api/analytics", method: "GET", requestCount: 95, successCount: 95, clientErrorCount: 0, serverErrorCount: 0, avgResponseTimeMs: 420, minResponseTimeMs: 120, maxResponseTimeMs: 2100, errorRate: 0, lastHit: now.toISOString(), avgRequestSize: null, avgResponseSize: 8192 },
      { endpoint: "/api/reports", method: "GET", requestCount: 75, successCount: 75, clientErrorCount: 0, serverErrorCount: 0, avgResponseTimeMs: 1200, minResponseTimeMs: 450, maxResponseTimeMs: 4500, errorRate: 0, lastHit: now.toISOString(), avgRequestSize: null, avgResponseSize: 65536 },
      { endpoint: "/api/docs", method: "GET", requestCount: 340, successCount: 340, clientErrorCount: 0, serverErrorCount: 0, avgResponseTimeMs: 28, minResponseTimeMs: 5, maxResponseTimeMs: 89, errorRate: 0, lastHit: now.toISOString(), avgRequestSize: null, avgResponseSize: 4096 },
    ],
  };
}

const ENDPOINTS_PAGE_SIZE = 10;
const ENDPOINT_COLUMNS = [
  { key: "endpoint", label: "Endpoint", sortable: true },
  { key: "method", label: "Method", sortable: true },
  { key: "requestCount", label: "Requests", sortable: true },
  { key: "successCount", label: "2xx", sortable: true, title: "Successful responses" },
  { key: "clientErrorCount", label: "4xx", sortable: true, title: "Client errors" },
  { key: "serverErrorCount", label: "5xx", sortable: true, title: "Server errors" },
  { key: "avgResponseTimeMs", label: "Avg (ms)", sortable: true, title: "Average response time in milliseconds" },
  { key: "minResponseTimeMs", label: "Min (ms)", sortable: true, title: "Minimum response time" },
  { key: "maxResponseTimeMs", label: "Max (ms)", sortable: true, title: "Maximum response time" },
  { key: "errorRate", label: "Error %", sortable: true, title: "Percentage of requests that returned 4xx or 5xx" },
  { key: "lastHit", label: "Last hit", sortable: true, title: "When this endpoint was last called" },
  { key: "avgRequestSize", label: "Request size", sortable: true, title: "Average size of request body (B/KB/MB) per request" },
  { key: "avgResponseSize", label: "Response size", sortable: true, title: "Average size of response body (B/KB/MB) per request" },
];

function formatBytes(bytes) {
  if (bytes == null || bytes === 0) return "—";
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatEndpointCell(col, value, row) {
  if (value == null && col.key !== "endpoint") return "—";
  switch (col.key) {
    case "method":
      return (
        <span className={`method-badge method-${(value || "").toLowerCase()}`}>
          {value}
        </span>
      );
    case "endpoint":
      return <span className="endpoint-path">{value}</span>;
    case "requestCount":
    case "successCount":
    case "clientErrorCount":
    case "serverErrorCount":
      return (value ?? 0).toLocaleString();
    case "avgResponseTimeMs":
    case "minResponseTimeMs":
    case "maxResponseTimeMs":
      return value ?? "—";
    case "errorRate":
      return (
        <span className={(row?.errorRate > 0 ? "error-rate" : "")}>
          {(value ?? 0).toFixed(1)}%
        </span>
      );
    case "lastHit":
      if (!value) return "—";
      const d = new Date(value);
      const now = Date.now();
      const diff = (now - d) / 1000;
      if (diff < 60) return "now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    case "avgRequestSize":
    case "avgResponseSize":
      return formatBytes(value);
    default:
      return String(value ?? "");
  }
}

export default function Dashboard() {
  const [range, setRange] = useState("24h");
  const [endpointsPage, setEndpointsPage] = useState(1);
  const [endpointsSortBy, setEndpointsSortBy] = useState("requestCount");
  const [endpointsSortOrder, setEndpointsSortOrder] = useState("desc");
  const [endpointsTotal, setEndpointsTotal] = useState(0);
  const [projectId, setProjectId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [tree, setTree] = useState([]);
  const [summary, setSummary] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    setServiceId("");
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
        granularity: range === "24h" ? "hourly" : "daily",
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
          const dir = endpointsSortOrder === "asc" ? 1 : -1;
          const sorted = [...all].sort((a, b) => {
            const va = a[endpointsSortBy];
            const vb = b[endpointsSortBy];
            if (typeof va === "string") return dir * String(va).localeCompare(vb);
            return dir * ((va ?? 0) - (vb ?? 0));
          });
          const start = (endpointsPage - 1) * ENDPOINTS_PAGE_SIZE;
          setEndpoints(sorted.slice(start, start + ENDPOINTS_PAGE_SIZE));
        }
      })
      .catch((err) => setError(err.message));
  }, [range, projectId, serviceId, endpointsPage, endpointsSortBy, endpointsSortOrder]);

  const totalProjects = tree.length;
  const totalServices = tree.reduce(
    (acc, p) => acc + (p.services?.length || 0),
    0
  );

  if (loading && !summary) return <div className="page-loading">Loading…</div>;

  return (
    <div className="dashboard dashboard--with-usage">
      <header className="page-header page-header--compact">
        <h1>Dashboard</h1>
        <div className="dashboard-controls">
          <select
            className="filter-select"
            value={projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            title="Project"
          >
            <option value="">All projects</option>
            {tree.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setEndpointsPage(1);
            }}
            title="Service"
          >
            <option value="">All services</option>
            {servicesForFilter.map((s) => (
              <option key={s.id} value={s.id}>
                {s.projectName ? `${s.name} (${s.projectName})` : s.name}
              </option>
            ))}
          </select>
          <div className="range-selector">
            {["24h", "7d", "30d"].map((r) => (
              <button
                key={r}
                className={`range-btn ${range === r ? "active" : ""}`}
                onClick={() => setRange(r)}
              >
                {r === "24h" ? "24h" : r === "7d" ? "7d" : "30d"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {error && (
        <div className="alert alert-error" onClick={() => setError("")}>
          {error}
        </div>
      )}

      <div className="stats-section">
        <div className="stats-grid stats-grid--dashboard">
          <StatCard
            title="Requests"
            value={summary?.totalRequests?.toLocaleString() || 0}
            subtitle={range === "24h" ? "Last 24h" : range === "7d" ? "Last 7d" : "Last 30d"}
          />
          <StatCard
            title="Error rate"
            value={`${summary?.errorRate || 0}%`}
            subtitle={summary?.errorCount ? `${summary.errorCount} errors` : null}
          />
          <StatCard
            title="Avg latency"
            value={`${summary?.avgResponseTimeMs || 0}ms`}
          />
          <StatCard title="Projects" value={totalProjects} />
          <StatCard title="Services" value={totalServices} />
        </div>
      </div>

      <section className="usage-section">
        <div className="traffic-section-header">
          <h2 className="dashboard-section-title">Traffic</h2>
          <span className="traffic-timezone" title="Chart times use your browser’s timezone">
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </span>
        </div>
        {isDemoData && (
          <p className="demo-badge">Demo data — integrate middleware for live metrics.</p>
        )}
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
                    const { date, time } = formatTimestamp(t.timestamp, range === "24h");
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
        <h2 className="dashboard-section-title">Endpoints</h2>
        {endpoints.length === 0 && endpointsTotal === 0 ? (
          <div className="empty-state">No endpoint data</div>
        ) : (
          <>
            <div className="endpoints-table-wrap">
              <table className="endpoints-table">
                <thead>
                  <tr>
                    {ENDPOINT_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className={col.sortable ? "endpoints-th-sortable" : ""}
                        title={col.title}
                        onClick={
                          col.sortable
                            ? () => {
                                if (endpointsSortBy === col.key) {
                                  setEndpointsSortOrder((o) => (o === "asc" ? "desc" : "asc"));
                                } else {
                                  setEndpointsSortBy(col.key);
                                  setEndpointsSortOrder(
                                    ["endpoint", "method"].includes(col.key) ? "asc" : "desc"
                                  );
                                }
                                setEndpointsPage(1);
                              }
                            : undefined
                        }
                      >
                        {col.label}
                        {col.sortable && endpointsSortBy === col.key && (
                          <span className="sort-arrow">
                            {endpointsSortOrder === "asc" ? " ↑" : " ↓"}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {endpoints.map((e, i) => (
                    <tr key={i}>
                      {ENDPOINT_COLUMNS.map((col) => (
                        <td key={col.key} className={col.key === "endpoint" ? "endpoint-path" : ""}>
                          {formatEndpointCell(col, e[col.key], e)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="endpoints-pagination">
              <span className="endpoints-pagination-info">
                {(endpointsPage - 1) * ENDPOINTS_PAGE_SIZE + 1}–
                {Math.min(endpointsPage * ENDPOINTS_PAGE_SIZE, endpointsTotal)} of {endpointsTotal}
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
                  {endpointsPage} / {Math.max(1, Math.ceil(endpointsTotal / ENDPOINTS_PAGE_SIZE))}
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

      <section className="tree-section">
        <div className="tree-section-header">
          <h2 className="dashboard-section-title">Projects</h2>
          <Link to="/projects" className="tree-section-link">
            Manage
          </Link>
        </div>
        {tree.length === 0 ? (
          <div className="empty-state">
            <p className="empty-title">No projects</p>
            <Link to="/projects" className="empty-cta">
              Add project
            </Link>
          </div>
        ) : (
          <div className="tree-list">
            {tree.map((project) => (
              <Link
                key={project.id}
                to={`/projects?project=${project.id}`}
                className="tree-item tree-item-link"
              >
                <div className="tree-project">
                  <span className="tree-name">{project.name}</span>
                  <span className="tree-arrow">→</span>
                </div>
                {project.services?.length > 0 ? (
                  <div className="tree-services">
                    {project.services.map((s) => (
                      <div key={s.id} className="tree-service">
                        {s.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tree-services-empty">No services</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
