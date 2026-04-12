import { useState, useEffect } from 'react';
import { adminAPI } from '../api/index.js';

const statusBadgeClass = (s) => {
  const map = {
    'active': 'badge-success',
    'completed': 'badge-info',
    'pending': 'badge-warning',
    'on-hold': 'badge-gray',
    'cancelled': 'badge-error',
  };
  return map[s] || 'badge-gray';
};

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await adminAPI.getProjects();
        setProjects(data.projects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg"></div></div>;

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: 'var(--space-lg)' }}>All Projects</h2>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No projects</div>
          <p className="text-muted text-sm">No projects have been created yet.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Title</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>PM</th>
                <th style={{ padding: '0.75rem' }}>Recruiter</th>
                <th style={{ padding: '0.75rem' }}>Freelancer/Agency</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{p.title}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${statusBadgeClass(p.status)}`}>
                      {p.status || 'active'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{p.pmId?.name || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{p.recruiterId?.name || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{p.freelancerOrAgencyId?.name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
