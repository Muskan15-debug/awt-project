import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api/index.js';
import { HiOutlineBriefcase, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi';

const statusBadgeClass = (s) => {
  const map = {
    'active': 'badge-success',
    'completed': 'badge-info',
    'pending': 'badge-warning',
    'on-hold': 'badge-warning',
    'cancelled': 'badge-error',
    'disputed': 'badge-error',
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

  const activeCount = projects.filter(p => p.status === 'active').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const pendingCount = projects.filter(p => ['on-hold', 'pending', 'disputed'].includes(p.status)).length;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-xs)' }}>Project Management</h2>
        <p className="text-muted">Oversee execution, manage milestones, and track freelancer progress.</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `var(--primary-100)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}><HiOutlineBriefcase size={22} /></div>
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Total Assigned</div>
        </div>
        <div className="stat-card">
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `var(--success-bg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}><HiOutlineClock size={22} /></div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-label">Active Projects</div>
        </div>
        <div className="stat-card">
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `var(--info-bg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)' }}><HiOutlineCheckCircle size={22} /></div>
          <div className="stat-value">{completedCount}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `var(--warning-bg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}><HiOutlineExclamationCircle size={22} /></div>
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">Action Required</div>
        </div>
      </div>

      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
        <h3 style={{ margin: 0 }}>My Projects</h3>
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
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              onClick={() => navigate(`/pm/projects/${project._id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                <h4 style={{ margin: 0, flex: 1 }}>{project.title}</h4>
                <span className={`badge ${statusBadgeClass(project.status)}`}>
                  {project.status || 'active'}
                </span>
              </div>
              {project.description && (
                <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-md)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {project.description}
                </p>
              )}
              
              <div style={{ marginTop: 'auto' }}>
                <div className="flex justify-between items-center text-xs text-muted" style={{ marginBottom: 'var(--space-xs)' }}>
                  <span>Progress tracking</span>
                  <span>Inside</span>
                </div>
                <div className="progress-container" style={{ marginBottom: 'var(--space-md)' }}>
                  <div className="progress-bar" style={{ width: `${project.status === 'completed' ? 100 : 30}%` }}></div>
                </div>

                <div className="text-sm text-muted" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  {project.freelancerOrAgencyId?.name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      <span style={{ width: 80, fontWeight: 500 }}>Worker:</span>
                      <div className="avatar avatar-sm" style={{ width: 20, height: 20 }}>{project.freelancerOrAgencyId.name[0].toUpperCase()}</div>
                      <span className="truncate">{project.freelancerOrAgencyId.name}</span>
                    </div>
                  )}
                  {project.recruiterId?.name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      <span style={{ width: 80, fontWeight: 500 }}>Recruiter:</span>
                      <div className="avatar avatar-sm" style={{ width: 20, height: 20 }}>{project.recruiterId.name[0].toUpperCase()}</div>
                      <span className="truncate">{project.recruiterId.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
  
// Need to add this icon
import { HiOutlineExclamationCircle } from 'react-icons/hi';

export default PMDashboard;
