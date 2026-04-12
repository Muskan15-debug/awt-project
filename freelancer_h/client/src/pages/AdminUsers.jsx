import { useState, useEffect } from 'react';
import { adminAPI } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';

const ROLES = [
  { value: 'all', label: 'All Users' },
  { value: 'freelancer', label: 'Freelancers' },
  { value: 'recruiter', label: 'Recruiters' },
  { value: 'projectManager', label: 'PMs' },
  { value: 'agency', label: 'Agencies' },
  { value: 'admin', label: 'Admins' },
];

const AdminUsers = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (activeRole !== 'all') params.role = activeRole;
      
      const { data } = await adminAPI.getUsers(params);
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, activeRole]);

  const handleAction = async (id, action, newRole) => {
    try {
      const payload = { action };
      if (newRole) payload.newRole = newRole;
      
      await adminAPI.updateUser(id, payload);
      toast.success(`User ${action === 'changeRole' ? 'role updated' : action + 'ed'}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-lg" style={{ marginBottom: 'var(--space-md)' }}>
        <h2 style={{ margin: 0 }}>User Management</h2>
        <input 
          className="form-input" 
          style={{ maxWidth: 300, marginBottom: 0 }} 
          placeholder="Search name or email..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="tabs">
        {ROLES.map(role => (
          <button
            key={role.value}
            className={`tab ${activeRole === role.value ? 'active' : ''}`}
            onClick={() => setActiveRole(role.value)}
          >
            {role.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div></div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No users found</div>
          <p className="text-muted text-sm">Try a different search term or role filter.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-tertiary)' }}>
                <th style={{ padding: '1rem' }}>User</th>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>Role</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Joined</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div className="flex items-center gap-sm">
                      <div className="avatar avatar-sm">{u.name?.[0]?.toUpperCase()}</div>
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }} className="text-muted">{u.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <div className="dropdown-container" style={{ display: 'flex' }}>
                      <select 
                        className="form-select" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 'auto', minWidth: '120px' }}
                        value={u.role}
                        onChange={(e) => {
                          if (e.target.value !== u.role && window.confirm(`Change ${u.name}'s role to ${e.target.value}?`)) {
                            handleAction(u._id, 'changeRole', e.target.value);
                          }
                        }}
                      >
                        <option value="freelancer">Freelancer</option>
                        <option value="recruiter">Recruiter</option>
                        <option value="projectManager">Project Manager</option>
                        <option value="agency">Agency</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {u.isBanned
                      ? <span className="badge badge-error">Banned</span>
                      : u.isVerified
                        ? <span className="badge badge-success">Verified</span>
                        : <span className="badge badge-warning">Unverified</span>
                    }
                  </td>
                  <td style={{ padding: '1rem' }} className="text-muted text-sm">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div className="flex gap-xs">
                      {!u.isVerified && <button className="btn btn-sm btn-primary" onClick={() => handleAction(u._id, 'verify')}>Verify</button>}
                      {u.isBanned
                        ? <button className="btn btn-sm btn-secondary" onClick={() => handleAction(u._id, 'unban')}>Unban</button>
                        : <button className="btn btn-sm btn-danger" onClick={() => {
                            if (window.confirm(`Are you sure you want to ban ${u.name}?`)) handleAction(u._id, 'ban');
                          }}>Ban</button>
                      }
                    </div>
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

export default AdminUsers;
