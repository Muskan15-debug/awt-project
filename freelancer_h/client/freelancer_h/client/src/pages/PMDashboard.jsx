import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api/index.js';

const statusBadgeClass = (s) => {
  const map = {
    'active': 'badge-success',
    'completed': 'badge-info',
    'pending': 'badge-warning',
    'on-hold': 'badge-gray',
  };
  return map[s] || 'badge-gray';
};

const PMDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await projectsAPI.getAll();
        setProjects(data.projects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="loading-screen"><div className="spinner spinner-lg"></div></div>;
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-xs)' }}>My Projects</h2>
        <p className="text-muted">Projects assigned to you for management.</p>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No projects assigned</div>
          <p className="text-muted text-sm">When a recruiter hands off a project to you, it will appear here.</p>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(project => (
            <div
              className="card"
              key={project._id}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/pm/projects/${project._id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                <h4 style={{ margin: 0, flex: 1 }}>{project.title}</h4>
                <span className={`badge ${statusBadgeClass(project.status)}`}>
                  {project.status || 'active'}
                </span>
              </div>
              {project.description && (
                <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-sm)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {project.description}
                </p>
              )}
              <div className="text-sm text-muted">
                {project.freelancerOrAgencyId?.name && (
                  <span>{project.receiverType === 'agency' ? 'Agency' : 'Freelancer'}: {project.freelancerOrAgencyId.name}</span>
                )}
                {project.recruiterId?.name && (
                  <span style={{ marginLeft: 'var(--space-sm)' }}>| Recruiter: {project.recruiterId.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PMDashboard;
