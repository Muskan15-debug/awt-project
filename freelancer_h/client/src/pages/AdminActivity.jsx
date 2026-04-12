import { useState, useEffect } from 'react';
import { adminAPI } from '../api/index.js';
import {
  HiOutlineUsers, HiOutlineBriefcase,
  HiOutlineExclamationCircle, HiOutlineShieldCheck,
  HiOutlineClock, HiOutlineOfficeBuilding
} from 'react-icons/hi';

const AdminActivity = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchAction, setSearchAction] = useState('');
  const [targetType, setTargetType] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (searchAction) params.action = searchAction;
      if (targetType !== 'all') params.targetType = targetType;

      const { data } = await adminAPI.getActivityLog(params);
      setLogs(data.logs || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, targetType]); // We trigger load on page or tab change. We handle searchAction on Enter key.

  const getActionFormat = (log) => {
    const [entity, event] = log.action.split('.');
    let icon = HiOutlineClock;
    let color = 'var(--gray-500)';

    if (event === 'approved' || event === 'resolved' || event === 'verify') { icon = HiOutlineShieldCheck; color = 'var(--success)'; }
    if (event === 'rejected' || event === 'ban' || event === 'cancelled') { icon = HiOutlineExclamationCircle; color = 'var(--error)'; }
    if (entity === 'project' || entity === 'milestone') { icon = HiOutlineBriefcase; color = 'var(--info)'; }
    if (entity === 'user') { icon = HiOutlineUsers; color = 'var(--primary-600)'; }
    if (entity === 'agency') { icon = HiOutlineOfficeBuilding; color = 'var(--accent-500)'; }

    let message = log.action;
    let boldText = '';

    if (log.meta) {
      if (log.action === 'project.pm_assigned') { message = 'assigned PM to'; boldText = log.meta.projectTitle; }
      else if (log.action === 'task.submitted') { message = 'submitted task'; boldText = log.meta.taskTitle; }
      else if (log.action === 'user.changeRole') { message = `changed role to ${log.meta.newRole} for`; boldText = log.meta.userName; }
      else if (log.meta.projectTitle) { message = `updated project`; boldText = log.meta.projectTitle; }
      else if (log.meta.milestoneTitle) { message = `updated milestone`; boldText = log.meta.milestoneTitle; }
      else if (log.meta.agencyName) { message = `${event} agency`; boldText = log.meta.agencyName; }
      else if (log.meta.userName) { message = `${event} user`; boldText = log.meta.userName; }
    }

    return { icon, color, message, boldText };
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-lg" style={{ marginBottom: 'var(--space-md)' }}>
        <h2 style={{ margin: 0 }}>Platform Activity Log</h2>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <select 
            className="form-select" 
            style={{ width: 'auto', marginBottom: 0 }}
            value={targetType}
            onChange={(e) => { setTargetType(e.target.value); setPage(1); }}
          >
            <option value="all">All Targets</option>
            <option value="User">Users</option>
            <option value="Project">Projects</option>
            <option value="Milestone">Milestones</option>
            <option value="Task">Tasks</option>
            <option value="Dispute">Disputes</option>
            <option value="Agency">Agencies</option>
          </select>
          <input 
            className="form-input" 
            style={{ maxWidth: 300, marginBottom: 0 }} 
            placeholder="Search action type... (e.g. user.ban)" 
            value={searchAction} 
            onChange={e => setSearchAction(e.target.value)} 
            onKeyDown={e => { if (e.key === 'Enter') { setPage(1); load(); } }}
          />
        </div>
      </div>

      <div className="card" style={{ overflow: 'auto', padding: 0 }}>
        {loading && logs.length === 0 ? (
          <div className="loading-screen" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
        ) : logs.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-2xl) var(--space-xl)' }}>
            <div className="empty-state-title">No activity logs found</div>
            <p className="text-muted text-sm">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-tertiary)' }}>
                  <th style={{ padding: '1rem' }}>Time</th>
                  <th style={{ padding: '1rem' }}>User</th>
                  <th style={{ padding: '1rem' }}>Action</th>
                  <th style={{ padding: '1rem' }}>Target</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const format = getActionFormat(log);
                  const Icon = format.icon;
                  return (
                    <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }} className="text-muted text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {log.performedBy ? (
                          <div className="flex items-center gap-xs">
                            <div className="avatar avatar-sm">{log.performedBy.name?.[0]?.toUpperCase()}</div>
                            <span>{log.performedBy.name}</span>
                            <span className="badge badge-gray" style={{ fontSize: '0.6rem' }}>{log.performedBy.role}</span>
                          </div>
                        ) : (
                          <span className="text-muted">System</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                          <div style={{ color: format.color, display: 'flex', alignItems: 'center' }}>
                            <Icon size={16} />
                          </div>
                          <span>
                            {format.message} {format.boldText && <strong style={{ marginLeft: 4 }}>{format.boldText}</strong>}
                            <span className="text-muted text-sm" style={{ marginLeft: 'var(--space-sm)' }}>
                              ({log.action})
                            </span>
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className="badge badge-gray">{log.targetType}</span>
                        {log.meta?.reason && (
                          <div className="text-sm text-muted" style={{ marginTop: 'var(--space-xs)' }}>
                            Reason: {log.meta.reason}
                          </div>
                        )}
                        {log.meta?.adminNote && (
                          <div className="text-sm text-muted" style={{ marginTop: 'var(--space-xs)' }}>
                            Note: {log.meta.adminNote}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div className="pagination" style={{ padding: 'var(--space-md)', margin: 0, borderTop: '1px solid var(--border-color)' }}>
                <button 
                  className="pagination-btn" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="text-sm" style={{ padding: '0 var(--space-md)' }}>
                  Page {page} of {totalPages}
                </span>
                <button 
                  className="pagination-btn" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminActivity;
