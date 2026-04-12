import { useState, useEffect } from 'react';
import { adminAPI } from '../api/index.js';

const statusBadgeClass = (s) => {
  const map = {
    'active': 'badge-success',
    'completed': 'badge-info',
    'pending': 'badge-warning',
    'on-hold': 'badge-warning',
    'disputed': 'badge-error',
    'cancelled': 'badge-error',
  };
  return map[s] || 'badge-gray';
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All Projects' },
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = activeStatus !== 'all' ? { status: activeStatus } : {};
        const { data } = await adminAPI.getProjects(params);
        setProjects(data.projects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeStatus]);

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: 'var(--space-md)' }}>Project Oversight</h2>

      <div className="tabs">
        {STATUS_FILTERS.map(status => (
          <button
            key={status.value}
            className={`tab ${activeStatus === status.value ? 'active' : ''}`}
            onClick={() => setActiveStatus(status.value)}
          >
            {status.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No projects found</div>
          <p className="text-muted text-sm">No projects match the selected filter.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-tertiary)' }}>
                <th style={{ padding: '1rem' }}>Title</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Created</th>
                <th style={{ padding: '1rem' }}>Recruiter</th>
                <th style={{ padding: '1rem' }}>PM</th>
                <th style={{ padding: '1rem' }}>Freelancer / Agency</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{p.title}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${statusBadgeClass(p.status)}`}>
                      {p.status || 'active'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }} className="text-muted text-sm">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      <div className="avatar avatar-sm">{p.recruiterId?.name?.[0]?.toUpperCase() || '?'}</div>
                      <span>{p.recruiterId?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {p.pmId ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                        <div className="avatar avatar-sm">{p.pmId.name[0].toUpperCase()}</div>
                        <span>{p.pmId.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted">Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {p.freelancerOrAgencyId ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                        <div className="avatar avatar-sm">{p.freelancerOrAgencyId.name[0].toUpperCase()}</div>
                        <span>{p.freelancerOrAgencyId.name}</span>
                        <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{p.receiverType}</span>
                      </div>
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
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
