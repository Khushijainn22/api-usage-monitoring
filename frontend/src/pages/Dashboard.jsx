import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import StatCard from "../components/StatCard";
import InfoCard from "../components/InfoCard";
import ProjectServiceExplainer from "../components/ProjectServiceExplainer";
import "./Dashboard.css";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.usage.summary({ range: "24h" }), api.projects.tree()])
      .then(([s, t]) => {
        setSummary(s);
        setTree(t.tree || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading...</div>;
  if (error) return <div className="page-error">{error}</div>;

  const totalProjects = tree.length;
  const totalServices = tree.reduce(
    (acc, p) => acc + (p.services?.length || 0),
    0
  );

  return (
    <div className="dashboard">
      <header className="page-header">
        <h1>Overview</h1>
        <p>
          See how your APIs are doing at a glance. Jump to any project when you
          need to.
        </p>
      </header>

      <ProjectServiceExplainer />

      <div className="stats-section">
        <InfoCard icon="📊" title="Key numbers (last 24 hours)">
          <p>
            How much traffic you got, how fast you responded, and whether
            anything went wrong.
          </p>
        </InfoCard>
        <div className="stats-grid">
          <StatCard
            title="Total requests"
            value={summary?.totalRequests?.toLocaleString() || 0}
            subtitle="API calls in the last 24h"
          />
          <StatCard
            title="Error rate"
            value={`${summary?.errorRate || 0}%`}
            subtitle={
              summary?.errorCount
                ? `${summary.errorCount} errors`
                : "4xx and 5xx responses"
            }
          />
          <StatCard
            title="Avg response time"
            value={`${summary?.avgResponseTimeMs || 0}ms`}
            subtitle="How fast your APIs respond"
          />
          <StatCard
            title="Projects"
            value={totalProjects}
            subtitle="Backends added"
          />
          <StatCard
            title="Services"
            value={totalServices}
            subtitle="Deployments, regions, or versions"
          />
        </div>
      </div>

      <section className="tree-section">
        <InfoCard icon="📁" title="Your projects">
          <p>
            Click any project to open it — add services, get keys, or peek at
            usage.
          </p>
        </InfoCard>
        {tree.length === 0 ? (
          <div className="empty-state">
            <p className="empty-title">No projects yet</p>
            <p>
              Create a project for your backend, then add services — one per
              deployment, region, version, or instance.
            </p>
            <Link to="/projects" className="empty-cta">
              + Create your first project
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
                  <span className="tree-icon">📁</span>
                  <span className="tree-name">{project.name}</span>
                  <span className="tree-arrow">→</span>
                </div>
                {project.services?.length > 0 ? (
                  <div className="tree-services">
                    {project.services.map((s) => (
                      <div key={s.id} className="tree-service">
                        <span className="tree-icon-sm">•</span>
                        {s.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tree-services-empty">
                    No services yet — add deployments, regions, or versions from
                    Projects
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
