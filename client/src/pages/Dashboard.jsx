import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { tasksAPI, agencyRequestsAPI, usersAPI } from '../api/index.js';
import { HiOutlineUserGroup, HiOutlineClock, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';

const STATUS_ORDER = ['in-progress', 'todo', 'revision-requested', 'submitted', 'approved'];

const statusLabel = (s) => {
  const map = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'submitted': 'Submitted',
    'approved': 'Approved',
    'revision-requested': 'Revision Requested',
  };
  return map[s] || s;
};

const statusBadgeClass = (s) => {
  const map = {
    'todo': 'badge-gray',
    'in-progress': 'badge-info',
    'submitted': 'badge-warning',
    'approved': 'badge-success',
    'revision-requested': 'badge-error',
  };
  return map[s] || 'badge-gray';
};

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Dashboard states
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [submitForm, setSubmitForm] = useState({ submissionNote: '', submissionFileUrl: '' });

  // Agency Hub states
  const [agencyRequests, setAgencyRequests] = useState({ sent: [], received: [] });
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [hubLoading, setHubLoading] = useState(true);
  const [proposeForm, setProposeForm] = useState({ name: '', description: '', specializations: '' });
  const [inviteUserEmail, setInviteUserEmail] = useState('');
  const [selectedInvitees, setSelectedInvitees] = useState([]);
  const [proposeSubmitting, setProposeSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data } = await tasksAPI.getMy();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAgencyHub = useCallback(async () => {
    if (user?.role !== 'freelancer' || user?.agencyId) {
      setHubLoading(false);
      return; 
    }
    try {
      const { data } = await agencyRequestsAPI.getMy();
      setAgencyRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHubLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    loadAgencyHub();
  }, [loadData, loadAgencyHub]);

  // --- Task Handlers ---
  const handleStart = async (taskId) => {
    try {
      await tasksAPI.updateStatus(taskId, { status: 'in-progress' });
      toast.success('Task started!');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start task');
    }
  };

  const handleSubmitTask = async (taskId) => {
    if (!submitForm.submissionNote.trim()) {
      return toast.error('Please add a submission note');
    }
    try {
      await tasksAPI.submit(taskId, {
        submissionNote: submitForm.submissionNote,
        submissionFileUrl: submitForm.submissionFileUrl || undefined,
      });
      toast.success('Task submitted!');
      setSubmitting(null);
      setSubmitForm({ submissionNote: '', submissionFileUrl: '' });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit task');
    }
  };

  const openSubmitForm = (taskId) => {
    setSubmitting(taskId);
    setSubmitForm({ submissionNote: '', submissionFileUrl: '' });
  };

  // --- Agency Hub Handlers ---
  const [searchResults, setSearchResults] = useState([]);
  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!inviteUserEmail.trim()) return;
    try {
      const { data } = await usersAPI.search({ search: inviteUserEmail, role: 'freelancer' });
      const results = (data.users || []).filter(
        u => u._id !== user._id && !selectedInvitees.find(i => i._id === u._id)
      );
      if (results.length === 0) return toast.error('No freelancers found');
      
      // If exact email match found, add directly
      const exactMatch = results.find(u => u.email === inviteUserEmail.trim().toLowerCase());
      if (exactMatch) {
        setSelectedInvitees([...selectedInvitees, exactMatch]);
        setInviteUserEmail('');
        setSearchResults([]);
      } else if (results.length === 1) {
        setSelectedInvitees([...selectedInvitees, results[0]]);
        setInviteUserEmail('');
        setSearchResults([]);
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      toast.error('Search failed');
    }
  };

  const handlePickUser = (pickedUser) => {
    setSelectedInvitees([...selectedInvitees, pickedUser]);
    setSearchResults(searchResults.filter(u => u._id !== pickedUser._id));
    setInviteUserEmail('');
  };


  const handleProposeAgency = async (e) => {
    e.preventDefault();
    if (!proposeForm.name.trim()) return toast.error('Agency name is required');
    if (selectedInvitees.length === 0) return toast.error('Add at least one fellow freelancer');

    setProposeSubmitting(true);
    try {
      await agencyRequestsAPI.create({
        proposedName: proposeForm.name,
        proposedDescription: proposeForm.description,
        proposedSpecializations: proposeForm.specializations.split(',').map(s => s.trim()).filter(Boolean),
        inviteeIds: selectedInvitees.map(i => i._id)
      });
      toast.success('Agency proposal sent!');
      setShowProposeModal(false);
      setProposeForm({ name: '', description: '', specializations: '' });
      setSelectedInvitees([]);
      await loadAgencyHub();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setProposeSubmitting(false);
    }
  };

  const handleRespondToRequest = async (id, action) => {
    try {
      await agencyRequestsAPI.respond(id, { action });
      toast.success(`Request ${action}ed`);
      if (action === 'accept') {
        setTimeout(() => window.location.reload(), 1000); // Reload to fetch new user role/agency
      } else {
        await loadAgencyHub();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    }
  };


  if (loading || hubLoading) {
    return <div className="loading-screen"><div className="spinner spinner-lg"></div></div>;
  }

  // Group tasks by status
  const grouped = {};
  STATUS_ORDER.forEach(s => { grouped[s] = []; });
  tasks.forEach(t => {
    const s = t.status || 'todo';
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(t);
  });
  const totalTasks = tasks.length;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-xs)' }}>Welcome back, {user?.name?.split(' ')[0]}!</h2>
        <p className="text-muted">Here is your workspace overview.</p>
      </div>

      {/* --- Agency Hub Section --- */}
      {!user?.agencyId && user?.role === 'freelancer' && (
        <div className="card" style={{ marginBottom: 'var(--space-xl)', background: 'linear-gradient(135deg, var(--bg-card), var(--primary-50))', border: '1px solid var(--primary-200)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                <HiOutlineUserGroup className="text-primary-600" /> Agency Hub
              </h3>
              <p className="text-sm text-muted" style={{ marginTop: 'var(--space-xs)' }}>
                Group up with fellow freelancers to form an Agency and bid on larger projects.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowProposeModal(true)}>
              Propose New Agency
            </button>
          </div>

          <div className="grid-2">
            {/* Incoming Requests */}
            <div>
              <h4 className="text-sm" style={{ marginBottom: 'var(--space-sm)' }}>Incoming Proposals</h4>
              {(() => {
                const actionableRequests = agencyRequests.received.filter(
                  r => r.status === 'pending' && r.invitees.some(i => (i.user?._id === user._id || i.user === user._id) && i.status === 'pending')
                );
                return actionableRequests.length === 0 ? (
                  <div style={{ padding: 'var(--space-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--text-tertiary)', border: '1px dashed var(--border-color)' }}>
                    No incoming agency requests.
                  </div>
                ) : (
                  <div className="flex flex-col gap-sm">
                    {actionableRequests.map(req => (
                      <div key={req._id} style={{ padding: 'var(--space-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: 600 }}>{req.proposedName}</div>
                        <div className="text-xs text-muted" style={{ marginBottom: 'var(--space-sm)' }}>Proposed by: {req.initiatorId?.name}</div>
                        <div className="flex gap-xs">
                          <button className="btn btn-sm btn-primary flex-1" onClick={() => handleRespondToRequest(req._id, 'accept')}>Accept & Join</button>
                          <button className="btn btn-sm btn-secondary flex-1" onClick={() => handleRespondToRequest(req._id, 'reject')}>Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Sent Requests */}
            <div>
              <h4 className="text-sm" style={{ marginBottom: 'var(--space-sm)' }}>Sent Proposals</h4>
              {agencyRequests.sent.filter(r => r.status === 'pending').length === 0 ? (
                <div style={{ padding: 'var(--space-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--text-tertiary)', border: '1px dashed var(--border-color)' }}>
                  You haven't proposed any agencies.
                </div>
              ) : (
                <div className="flex flex-col gap-sm">
                  {agencyRequests.sent.filter(r => r.status === 'pending').map(req => (
                    <div key={req._id} style={{ padding: 'var(--space-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-xs)' }}>
                        <div style={{ fontWeight: 600 }}>{req.proposedName}</div>
                        <span className="badge badge-warning text-xs">Awaiting Approval</span>
                      </div>
                      <div className="text-xs text-muted">
                        Invited: {req.invitees.map(i => i.user?.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Tasks Section --- */}
      <h3 style={{ margin: 'var(--space-2xl) 0 var(--space-md) 0' }}>Assigned Tasks</h3>
      {totalTasks === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No tasks assigned</div>
          <p className="text-muted text-sm">When a project manager assigns tasks to you, they will appear here.</p>
        </div>
      ) : (
        STATUS_ORDER.map(status => {
          const group = grouped[status];
          if (!group || group.length === 0) return null;
          return (
            <div key={status} style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
                <h3 style={{ margin: 0 }}>{statusLabel(status)}</h3>
                <span className="badge badge-gray">{group.length}</span>
              </div>
              <div className="flex flex-col gap-md">
                {group.map(task => (
                  <div className="card" key={task._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, marginBottom: 'var(--space-xs)' }}>{task.title}</h4>
                        {task.description && (
                          <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-xs)' }}>{task.description}</p>
                        )}
                        <div className="flex gap-sm text-sm text-muted" style={{ flexWrap: 'wrap' }}>
                          {task.projectId?.title && <span>Project: {task.projectId.title}</span>}
                          {task.milestoneId?.title && <span>| Milestone: {task.milestoneId.title}</span>}
                          {task.milestoneId?.dueDate && <span>| Due: {new Date(task.milestoneId.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-sm">
                        <span className={`badge ${statusBadgeClass(task.status)}`}>{statusLabel(task.status)}</span>
                      </div>
                    </div>

                    {task.status === 'revision-requested' && task.submissionNote && (
                      <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', background: 'var(--surface-minus-1)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                        <strong>Previous note:</strong> {task.submissionNote}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ marginTop: 'var(--space-sm)', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                      {task.status === 'todo' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleStart(task._id)}>
                          Start
                        </button>
                      )}
                      {task.status === 'in-progress' && (
                        <button className="btn btn-primary btn-sm" onClick={() => openSubmitForm(task._id)}>
                          Submit
                        </button>
                      )}
                      {task.status === 'revision-requested' && (
                        <button className="btn btn-primary btn-sm" onClick={() => openSubmitForm(task._id)}>
                          Re-submit
                        </button>
                      )}
                    </div>

                    {/* Submission form */}
                    {submitting === task._id && (
                      <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}>
                        <div className="form-group">
                          <label className="form-label">Submission Note *</label>
                          <textarea
                            className="form-input"
                            rows={3}
                            placeholder="Describe what you've completed..."
                            value={submitForm.submissionNote}
                            onChange={e => setSubmitForm({ ...submitForm, submissionNote: e.target.value })}
                            style={{ resize: 'vertical' }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">File URL (optional)</label>
                          <input
                            className="form-input"
                            placeholder="https://drive.google.com/..."
                            value={submitForm.submissionFileUrl}
                            onChange={e => setSubmitForm({ ...submitForm, submissionFileUrl: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-sm">
                          <button className="btn btn-primary btn-sm" onClick={() => handleSubmitTask(task._id)}>
                            Submit Task
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setSubmitting(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* --- Propose Agency Modal --- */}
      {showProposeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Propose New Agency</h2>
              <button className="modal-close" onClick={() => setShowProposeModal(false)}><HiOutlineX /></button>
            </div>
            
            <form onSubmit={handleProposeAgency}>
              <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                <label className="form-label">Proposed Agency Name *</label>
                <input 
                  className="form-input" 
                  value={proposeForm.name} 
                  onChange={e => setProposeForm({...proposeForm, name: e.target.value})} 
                  placeholder="e.g. Acme Digital"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                <label className="form-label">Agency Description</label>
                <textarea 
                  className="form-input" 
                  value={proposeForm.description} 
                  onChange={e => setProposeForm({...proposeForm, description: e.target.value})} 
                  placeholder="What does your agency do?"
                  rows={3}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
                <label className="form-label">Invite Fellow Freelancers *</label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                  <input 
                    className="form-input" 
                    value={inviteUserEmail} 
                    onChange={e => setInviteUserEmail(e.target.value)} 
                    placeholder="Search by name or email"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearchUser(e); } }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleSearchUser}>Search</button>
                </div>
                {searchResults.length > 0 && (
                  <div className="flex flex-col gap-xs" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-sm)', marginBottom: 'var(--space-sm)', maxHeight: 180, overflowY: 'auto' }}>
                    <div className="text-xs text-muted" style={{ marginBottom: 'var(--space-xs)' }}>Select a freelancer:</div>
                    {searchResults.map(u => (
                      <div key={u._id} className="flex justify-between items-center" style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} onClick={() => handlePickUser(u)}>
                        <div>
                          <span className="text-sm font-medium">{u.name}</span>
                          <span className="text-xs text-muted" style={{ marginLeft: 'var(--space-xs)' }}>{u.email}</span>
                        </div>
                        <span className="btn btn-sm btn-primary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>Add</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedInvitees.length > 0 && (
                  <div className="flex flex-col gap-xs p-md" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    {selectedInvitees.map(inv => (
                      <div key={inv._id} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{inv.name} ({inv.email})</span>
                        <button type="button" className="btn btn-sm btn-ghost text-error" onClick={() => setSelectedInvitees(prev => prev.filter(p => p._id !== inv._id))}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-sm">
                <button type="submit" className="btn btn-primary" disabled={proposeSubmitting || selectedInvitees.length === 0}>
                  {proposeSubmitting ? 'Sending Request...' : 'Send Agency Request'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProposeModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
