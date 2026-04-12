import { useState, useEffect } from 'react';
import { adminAPI } from '../api/index.js';
import {
  HiOutlineUsers, HiOutlineBriefcase, HiOutlineDocumentText,
  HiOutlineExclamationCircle, HiOutlineCash, HiOutlineClock,
  HiOutlineUserGroup, HiOutlineShieldCheck
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await adminAPI.getAnalytics();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg"></div></div>;
  if (!stats) return <div className="empty-state">Failed to load analytics</div>;

  const topCards = [
    { icon: HiOutlineUsers, label: 'Total Users', value: stats.totalUsers || 0, color: '#0d9488' },
    { icon: HiOutlineBriefcase, label: 'Total Projects', value: stats.totalProjects || 0, color: '#3b82f6' },
    { icon: HiOutlineDocumentText, label: 'Active Contracts', value: stats.activeContracts || 0, color: '#f59e0b' },
    { icon: HiOutlineExclamationCircle, label: 'Open Disputes', value: stats.openDisputes || 0, color: '#ef4444' },
  ];

  const financialCards = [
    { icon: HiOutlineClock, label: 'Held in Escrow', value: `$${(stats.payments?.heldAmount || 0).toLocaleString()}`, count: stats.payments?.held || 0, color: '#8b5cf6' },
    { icon: HiOutlineCash, label: 'Total Released', value: `$${(stats.payments?.releasedAmount || 0).toLocaleString()}`, count: stats.payments?.released || 0, color: '#10b981' },
    { icon: HiOutlineShieldCheck, label: 'Total Refunded', value: `$${(stats.payments?.refundedAmount || 0).toLocaleString()}`, count: stats.payments?.refunded || 0, color: '#64748b' },
  ];

  const renderRoleBar = () => {
    const roles = ['freelancer', 'agency', 'recruiter', 'projectManager', 'admin'];
    const total = stats.totalUsers || 1;
    const colors = {
      freelancer: 'var(--primary-500)',
      agency: 'var(--info)',
      recruiter: 'var(--warning)',
      projectManager: 'var(--error)',
      admin: 'var(--gray-800)'
    };

    return (
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <h3 style={{ marginBottom: 'var(--space-md)' }}>User Role Distribution</h3>
        <div style={{ display: 'flex', width: '100%', height: 32, borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-md)' }}>
          {roles.map(role => {
            const count = stats.roleDistribution?.[role] || 0;
            if (count === 0) return null;
            const percentage = (count / total) * 100;
            return (
              <div
                key={role}
                style={{ width: `${percentage}%`, backgroundColor: colors[role], height: '100%' }}
                title={`${role}: ${count} (${percentage.toFixed(1)}%)`}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', fontSize: '0.875rem' }}>
          {roles.map(role => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: colors[role] }} />
              <span style={{ textTransform: 'capitalize' }}>
                {role === 'projectManager' ? 'Project Manager' : role} ({stats.roleDistribution?.[role] || 0})
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getActionFormat = (log) => {
    const [entity, event] = log.action.split('.');
    let icon = HiOutlineClock;
    let color = 'var(--gray-500)';

    if (event === 'approved' || event === 'resolved' || event === 'verify') { icon = HiOutlineShieldCheck; color = 'var(--success)'; }
    if (event === 'rejected' || event === 'ban' || event === 'cancelled') { icon = HiOutlineExclamationCircle; color = 'var(--error)'; }
    if (entity === 'project' || entity === 'milestone') { icon = HiOutlineBriefcase; color = 'var(--info)'; }
    if (entity === 'user') { icon = HiOutlineUsers; color = 'var(--primary-600)'; }

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
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ margin: 0 }}>Platform Overview</h2>
        <div className="flex gap-sm">
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/users')}>Users</button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/projects')}>Projects</button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/disputes')}>Disputes</button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        {topCards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}><c.icon size={22} /></div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div>
          {renderRoleBar()}

          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-md)' }}>Financial Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {financialCards.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) 0', borderBottom: i < financialCards.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}><c.icon size={24} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{c.value}</div>
                    <div className="text-sm text-muted">{c.label} ({c.count} transactions)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
            <h3 style={{ margin: 0 }}>Recent Activity</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/activity')}>View All</button>
          </div>
          
          {(!stats.recentActivity || stats.recentActivity.length === 0) ? (
            <p className="text-muted text-sm">No recent platform activity.</p>
          ) : (
            <div className="activity-feed">
              {stats.recentActivity.map(log => {
                const format = getActionFormat(log);
                const Icon = format.icon;
                return (
                  <div className="activity-item" key={log._id}>
                    <div className="activity-icon" style={{ color: format.color, background: `${format.color}15` }}>
                      <Icon size={18} />
                    </div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.performedBy?.name || 'System'}</span>
                        <span className="activity-time">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="activity-text">
                        {format.message} {format.boldText && <strong>{format.boldText}</strong>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
