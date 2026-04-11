import { useState, useEffect } from 'react';
import { paymentsAPI } from '../api/index.js';

const statusColors = {
  'held': 'badge-warning',
  'released': 'badge-success',
  'refunded': 'badge-error',
};

const Earnings = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await paymentsAPI.getEarnings();
        setPayments(data.payments || []);
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

  const totalEarned = payments
    .filter(p => p.status === 'released')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalHeld = payments
    .filter(p => p.status === 'held')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: 'var(--space-lg)' }}>Earnings</h2>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success, #10b981)' }}>${totalEarned.toLocaleString()}</div>
          <div className="stat-label">Total Released</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f59e0b' }}>${totalHeld.toLocaleString()}</div>
          <div className="stat-label">In Escrow (Held)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{payments.length}</div>
          <div className="stat-label">Total Payments</div>
        </div>
      </div>

      {payments.length > 0 ? (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Milestone</th>
                <th style={{ padding: '0.75rem' }}>Project</th>
                <th style={{ padding: '0.75rem' }}>Amount</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem' }}>{p.milestoneId?.title || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{p.projectId?.title || 'N/A'}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>${p.amount?.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${statusColors[p.status] || 'badge-gray'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-title">No payment history</div>
          <p className="text-muted text-sm">Payments will appear here when milestones are funded and completed.</p>
        </div>
      )}
    </div>
  );
};

export default Earnings;
