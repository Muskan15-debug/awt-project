import { useState, useEffect } from 'react';
import { adminAPI } from '../api/index.js';
import { HiOutlineUsers, HiOutlineBriefcase, HiOutlineDocumentText, HiOutlineExclamationCircle } from 'react-icons/hi';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => { try { const { data } = await adminAPI.getAnalytics('overview'); setStats(data); } catch {} finally { setLoading(false); } };
    load();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg"></div></div>;

  const cards = [
    { icon: HiOutlineUsers, label: 'Total Users', value: stats.totalUsers || 0, color: '#0d9488' },
    { icon: HiOutlineBriefcase, label: 'Total Projects', value: stats.totalProjects || 0, color: '#3b82f6' },
    { icon: HiOutlineDocumentText, label: 'Active Contracts', value: stats.activeContracts || 0, color: '#f59e0b' },
    { icon: HiOutlineExclamationCircle, label: 'Open Disputes', value: stats.totalDisputes || 0, color: '#ef4444' },
  ];

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: 'var(--space-xl)' }}>Admin Analytics</h2>
      <div className="stats-grid">
        {cards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}><c.icon size={22} /></div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
