import { useState, useEffect } from 'react';
import { adminAPI } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';

const statusBadgeClass = (s) => {
  const map = {
    'open': 'badge-warning',
    'under-review': 'badge-info',
    'resolved': 'badge-success',
  };
  return map[s] || 'badge-gray';
};

const AdminDisputes = () => {
  const toast = useToast();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [resolveForm, setResolveForm] = useState({});

  const load = async () => {
    try {
      const { data } = await adminAPI.getDisputes();
      setDisputes(data.disputes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleResolve = async (id) => {
    const form = resolveForm[id] || {};
    if (!form.resolution) return toast.error('Select a resolution outcome');
    try {
      await adminAPI.resolveDispute(id, {
        resolution: form.resolution,
        adminNote: form.adminNote || '',
      });
      toast.success('Dispute resolved!');
      setExpandedId(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve dispute');
    }
  };

  const updateResolveForm = (id, field, value) => {
    setResolveForm(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  };

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg"></div></div>;

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: 'var(--space-lg)' }}>All Disputes</h2>
      {disputes.length > 0 ? (
        <div className="flex flex-col gap-md">
          {disputes.map(d => {
            const isExpanded = expandedId === d._id;
            return (
              <div className="card" key={d._id}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: 'var(--space-sm)' }}
                  onClick={() => setExpandedId(isExpanded ? null : d._id)}
                >
                  <div>
                    <h4 style={{ margin: 0 }}>
                      {d.projectId?.title || 'Project Dispute'}
                    </h4>
                    <p className="text-muted text-sm">
                      Raised by: {d.raisedById?.name || 'Unknown'}
                    </p>
                  </div>
                  <span className={`badge ${statusBadgeClass(d.status)}`}>
                    {d.status}
                  </span>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 'var(--space-md)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-md)' }}>
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                      <p style={{ fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>
                        <strong>Reason:</strong> {d.reason}
                      </p>
                      <p className="text-sm text-muted">
                        Project: {d.projectId?.title || 'N/A'}
                      </p>
                      {d.adminNote && (
                        <p className="text-sm" style={{ marginTop: 'var(--space-xs)' }}>
                          <strong>Admin Note:</strong> {d.adminNote}
                        </p>
                      )}
                      {d.resolution && (
                        <p className="text-sm" style={{ marginTop: 'var(--space-xs)' }}>
                          <strong>Resolution:</strong> {d.resolution}
                        </p>
                      )}
                    </div>

                    {d.status !== 'resolved' && (
                      <div style={{ background: 'var(--surface-minus-1)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                        <h5 style={{ margin: '0 0 var(--space-sm) 0' }}>Resolve Dispute</h5>
                        <div className="form-group">
                          <label className="form-label">Admin Note</label>
                          <textarea
                            className="form-input"
                            rows={2}
                            placeholder="Add notes about this dispute..."
                            value={resolveForm[d._id]?.adminNote || ''}
                            onChange={e => updateResolveForm(d._id, 'adminNote', e.target.value)}
                            style={{ resize: 'vertical' }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Resolution *</label>
                          <select
                            className="form-select"
                            value={resolveForm[d._id]?.resolution || ''}
                            onChange={e => updateResolveForm(d._id, 'resolution', e.target.value)}
                          >
                            <option value="">Select outcome...</option>
                            <option value="refund">Refund to Recruiter</option>
                            <option value="release">Release to Freelancer</option>
                            <option value="split">Split Payment</option>
                          </select>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => handleResolve(d._id)}>
                          Resolve Dispute
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-title">No disputes</div>
          <p className="text-muted text-sm">There are currently no disputes to review.</p>
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;
