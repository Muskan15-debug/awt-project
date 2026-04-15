import { useState, useEffect } from 'react';
import { adminAPI } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';

const AdminAgencies = () => {
  const toast = useToast();
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReasons, setRejectionReasons] = useState({});

  const load = async () => {
    try {
      const { data } = await adminAPI.getPendingAgencies();
      setAgencies(data.agencies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = async (id, action) => {
    const payload = { action };
    if (action === 'reject' && rejectionReasons[id]) {
      payload.rejectionReason = rejectionReasons[id];
    }
    try {
      await adminAPI.updateAgency(id, payload);
      toast.success(`Agency ${action}d`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg"></div></div>;

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: 'var(--space-lg)' }}>Pending Agencies</h2>
      {agencies.length > 0 ? (
        <div className="flex flex-col gap-md">
          {agencies.map(a => (
            <div className="card" key={a._id}>
              <div className="flex justify-between items-center">
                <div>
                  <h4>{a.name}</h4>
                  <p className="text-muted text-sm">Owner: {a.owner?.name} ({a.owner?.email})</p>
                </div>
                <div className="flex gap-sm items-center">
                  <button className="btn btn-sm btn-primary" onClick={() => handleAction(a._id, 'approve')}>Approve</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleAction(a._id, 'reject')}>Reject</button>
                </div>
              </div>
              {a.description && <p className="text-sm mt-md text-muted">{a.description}</p>}
              <div className="form-group" style={{ marginTop: 'var(--space-md)', marginBottom: 0 }}>
                <label className="form-label text-sm">Rejection Reason (optional)</label>
                <input
                  className="form-input"
                  placeholder="Reason for rejection..."
                  value={rejectionReasons[a._id] || ''}
                  onChange={e => setRejectionReasons({ ...rejectionReasons, [a._id]: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-title">No pending agencies</div>
          <p className="text-muted text-sm">All agency applications have been reviewed.</p>
        </div>
      )}
    </div>
  );
};

export default AdminAgencies;
