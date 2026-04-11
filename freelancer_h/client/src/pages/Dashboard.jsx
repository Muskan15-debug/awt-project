import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { tasksAPI } from '../api/index.js';

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
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [submitForm, setSubmitForm] = useState({ submissionNote: '', submissionFileUrl: '' });

  const load = useCallback(async () => {
    try {
      const { data } = await tasksAPI.getMy();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStart = async (taskId) => {
    try {
      await tasksAPI.updateStatus(taskId, { status: 'in-progress' });
      toast.success('Task started!');
      await load();
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
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit task');
    }
  };

  const openSubmitForm = (taskId) => {
    setSubmitting(taskId);
    setSubmitForm({ submissionNote: '', submissionFileUrl: '' });
  };

  if (loading) {
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
        <p className="text-muted">Here are your assigned tasks across all projects.</p>
      </div>

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
    </div>
  );
};

export default Dashboard;
