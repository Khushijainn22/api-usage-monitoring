import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import InfoCard from '../components/InfoCard';
import ProjectServiceExplainer from '../components/ProjectServiceExplainer';
import './Projects.css';

export default function Projects() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [searchParams] = useSearchParams();
  const projectRefs = useRef({});

  const loadTree = () => {
    api.projects
      .tree()
      .then((data) => setTree(data.tree || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTree();
  }, []);

  const highlightedProjectId = searchParams.get('project');

  useEffect(() => {
    if (highlightedProjectId && projectRefs.current[highlightedProjectId]) {
      projectRefs.current[highlightedProjectId].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedProjectId, tree]);

  async function handleCreateProject(e) {
    e.preventDefault();
    if (!projectName.trim()) return;
    setSubmitting(true);
    try {
      await api.projects.create({ name: projectName.trim() });
      setProjectName('');
      setShowModal(false);
      setSuccess('Project created');
      loadTree();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateService(e) {
    e.preventDefault();
    if (!serviceName.trim() || !selectedProjectId) return;
    setSubmitting(true);
    try {
      const res = await api.services.create({
        name: serviceName.trim(),
        projectId: selectedProjectId,
      });
      setServiceName('');
      setSelectedProjectId('');
      setNewApiKey(res.service?.apiKey || '');
      setSuccess('Service created. Copy your API key below.');
      setShowModal(false);
      loadTree();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="projects-page">
      <header className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Create a project for your backend, then add a service per deployment, region, or version. Each gets its own key — put that key in the app you're tracking.</p>
          <p>Lost your key? Contact admin <strong>khushij2210@gmail.com</strong>.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New project
        </button>
      </header>

      {/* <ProjectServiceExplainer /> */}

      {error && (
        <div className="alert alert-error" onClick={() => setError('')}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <div>{success}</div>
          {newApiKey && (
            <>
              <div className="api-key-box">
                <code>{newApiKey}</code>
                <button
                  className="btn-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(newApiKey);
                  }}
                >
                  Copy
                </button>
              </div>
              <p className="api-key-note">Lost your key? Contact admin <strong>khushij2210@gmail.com</strong>.</p>
            </>
          )}
          <button className="alert-dismiss" onClick={() => { setSuccess(''); setNewApiKey(''); }}>
            Dismiss
          </button>
        </div>
      )}

      <div className="projects-section">
        
        <div className="projects-grid">
        {tree.map((project) => (
          <div
            key={project.id}
            ref={(el) => { projectRefs.current[project.id] = el; }}
            className={`project-card ${highlightedProjectId === project.id ? 'project-card-highlighted' : ''}`}
          >
            <div className="project-header">
              <span className="project-icon">📁</span>
              <h3>{project.name}</h3>
            </div>
            <div className="project-services">
              {project.services?.length === 0 ? (
                <p className="empty-text">No services</p>
              ) : (
                project.services?.map((s) => (
                  <div key={s.id} className="service-item">
                    <span className="service-dot">•</span>
                    {s.name}
                  </div>
                ))
              )}
            </div>
            <div className="project-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelectedProjectId(project.id);
                  setShowModal('service');
                }}
              >
                + Add service
              </button>
            </div>
          </div>
        ))}
        </div>
      </div>

      {tree.length === 0 && (
        <div className="empty-state">
          <p className="empty-title">No projects yet</p>
          <p>Create a project first, then add services to get API keys.</p>
        </div>
      )}

      {showModal === true && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New project</h2>
            <form onSubmit={handleCreateProject}>
              <label>
                Project name
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. My App"
                  autoFocus
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'service' && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New service</h2>
            <form onSubmit={handleCreateService}>
              <label>
                Project
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  required
                >
                  <option value="">Select project</option>
                  {tree.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Service name
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. Prod, EU, v2"
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
