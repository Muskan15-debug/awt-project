import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { projectsAPI, milestonesAPI, tasksAPI, usersAPI } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';

const milestoneStatusBadge = (s) => {
  const map = {
    'pending': 'badge-gray',
    'in-progress': 'badge-info',
    'submitted': 'badge-warning',
    'approved': 'badge-success',
    'rejected': 'badge-error',
  };
  return map[s] || 'badge-gray';
};

const taskStatusBadge = (s) => {
  const map = {
    'todo': 'badge-gray',
    'in-progress': 'badge-info',
    'submitted': 'badge-warning',
    'approved': 'badge-success',
    'revision-requested': 'badge-error',
  };
  return map[s] || 'badge-gray';
};

const taskStatusLabel = (s) => {
  const map = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'submitted': 'Submitted',
    'approved': 'Approved',
    'revision-requested': 'Revision Requested',
  };
  return map[s] || s;
};

const PMProjectDetail = () => {
  const { id } = useParams();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);

  // Forms
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', dueDate: '', amount: '' });
  const [milestoneSubmitting, setMilestoneSubmitting] = useState(false);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', milestoneId: '', assignedToId: '' });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Revision form per task
  const [revisionTaskId, setRevisionTaskId] = useState(null);
  const [revisionNote, setRevisionNote] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [projRes, milRes, taskRes] = await Promise.all([
        projectsAPI.getOne(id),
        milestonesAPI.getByProject(id),
        tasksAPI.getByProject(id),
      ]);
      setProject(projRes.data.project || projRes.data);
      setMilestones(milRes.data.milestones || []);
      setTasks(taskRes.data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load potential assignees (freelancers only, or from agency members)
  useEffect(() => {
    const loadTeam = async () => {
      try {
        // Load available freelancers for assignment
        const { data } = await usersAPI.search({ role: 'freelancer', limit: 100 });
        setTeamMembers(data.users || []);
      } catch {
        // silent
      }
    };
    loadTeam();
  }, []);

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneForm.title.trim()) return toast.error('Title is required');
    if (!milestoneForm.dueDate) return toast.error('Due date is required');
    if (!milestoneForm.amount || Number(milestoneForm.amount) <= 0) return toast.error('Amount must be positive');

    setMilestoneSubmitting(true);
    try {
      await milestonesAPI.create(id, {
        title: milestoneForm.title,
        dueDate: milestoneForm.dueDate,
        amount: Number(milestoneForm.amount),
      });
      toast.success('Milestone created!');
      setShowMilestoneForm(false);
      setMilestoneForm({ title: '', dueDate: '', amount: '' });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create milestone');
    } finally {
      setMilestoneSubmitting(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Title is required');
    if (!taskForm.milestoneId) return toast.error('Select a milestone');

    setTaskSubmitting(true);
    try {
      await tasksAPI.create({
        title: taskForm.title,
        description: taskForm.description,
        milestoneId: taskForm.milestoneId,
        projectId: id,
        assignedToId: taskForm.assignedToId || undefined,
      });
      toast.success('Task created!');
      setShowTaskForm(false);
      setTaskForm({ title: '', description: '', milestoneId: '', assignedToId: '' });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleApproveTask = async (taskId) => {
    try {
      await tasksAPI.approve(taskId, { status: 'approved' });
      toast.success('Task approved!');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve task');
    }
  };

  const handleRequestRevision = async (taskId) => {
    if (!revisionNote.trim()) return toast.error('Please provide a revision note');
    try {
      await tasksAPI.approve(taskId, { status: 'revision-requested', revisionNote });
      toast.success('Revision requested');
      setRevisionTaskId(null);
      setRevisionNote('');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request revision');
    }
  };

  const handleMilestoneStatus = async (milestoneId, status) => {
    try {
      await milestonesAPI.updateStatus(milestoneId, { status });
      toast.success(`Milestone ${status}!`);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update milestone');
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner spinner-lg"></div></div>;
  }

  if (!project) {
    return (
      <div className="fade-in">
        <div className="empty-state">
          <div className="empty-state-title">Project not found</div>
        </div>
      </div>
    );
  }

  // Group tasks by milestone
  const tasksByMilestone = {};
  tasks.forEach(t => {
    const mId = t.milestoneId?._id || t.milestoneId || 'unassigned';
    if (!tasksByMilestone[mId]) tasksByMilestone[mId] = [];
    tasksByMilestone[mId].push(t);
  });

  return (
    <div className="fade-in">
      {/* Project Info */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: 'var(--space-xs)' }}>{project.title}</h2>
            {project.description && <p className="text-muted" style={{ marginBottom: 'var(--space-sm)' }}>{project.description}</p>}
            <div className="flex gap-md text-sm text-muted" style={{ flexWrap: 'wrap' }}>
              {project.recruiterId?.name && <span>Recruiter: {project.recruiterId.name}</span>}
              {project.freelancerOrAgencyId?.name && (
                <span>{project.receiverType === 'agency' ? 'Agency' : 'Freelancer'}: {project.freelancerOrAgencyId.name}</span>
              )}
            </div>
          </div>
          <span className={`badge ${project.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
            {project.status || 'active'}
          </span>
        </div>
      </div>

      {/* Milestones Section */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
          <h3 style={{ margin: 0 }}>Milestones</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowMilestoneForm(v => !v)}>
            {showMilestoneForm ? 'Cancel' : 'Create Milestone'}
          </button>
        </div>

        {showMilestoneForm && (
          <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
            <form onSubmit={handleCreateMilestone}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    className="form-input"
                    placeholder="Milestone title"
                    value={milestoneForm.title}
                    onChange={e => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input
                    className="form-input"
                    type="date"
                    value={milestoneForm.dueDate}
                    onChange={e => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    placeholder="Amount"
                    value={milestoneForm.amount}
                    onChange={e => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={milestoneSubmitting}>
                {milestoneSubmitting ? 'Creating...' : 'Create'}
              </button>
            </form>
          </div>
        )}

        {milestones.length === 0 ? (
          <div className="card">
            <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
              No milestones yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-md">
            {milestones.map(ms => {
              const msTasks = tasksByMilestone[ms._id] || [];
              const allApproved = msTasks.length > 0 && msTasks.every(t => t.status === 'approved');
              return (
                <div className="card" key={ms._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{ms.title}</h4>
                      <div className="text-sm text-muted">
                        Due: {ms.dueDate ? new Date(ms.dueDate).toLocaleDateString() : 'N/A'} | Amount: {ms.amount ? `$${ms.amount.toLocaleString()}` : 'N/A'}
                      </div>
                    </div>
                    <div className="flex items-center gap-sm">
                      <span className={`badge ${milestoneStatusBadge(ms.status)}`}>{ms.status}</span>
                      {allApproved && ms.status !== 'approved' && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleMilestoneStatus(ms._id, 'approved')}>
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tasks for this milestone */}
                  {msTasks.length === 0 ? (
                    <p className="text-muted text-sm">No tasks for this milestone.</p>
                  ) : (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-sm)' }}>
                      {msTasks.map(task => (
                        <div key={task._id} style={{ padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title}</div>
                            {task.description && <div className="text-muted text-sm">{task.description}</div>}
                            <div className="text-sm text-muted">
                              Assigned to: {task.assignedToId?.name || 'Unassigned'}
                            </div>
                            {task.submissionNote && task.status === 'submitted' && (
                              <div style={{ marginTop: 'var(--space-xs)', fontSize: '0.85rem', background: 'var(--surface-minus-1)', padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
                                <strong>Submission:</strong> {task.submissionNote}
                                {task.submissionFileUrl && (
                                  <span> | <a href={task.submissionFileUrl} target="_blank" rel="noopener noreferrer">View File</a></span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
                            <span className={`badge ${taskStatusBadge(task.status)}`}>{taskStatusLabel(task.status)}</span>
                            {task.status === 'submitted' && (
                              <>
                                <button className="btn btn-sm btn-primary" onClick={() => handleApproveTask(task._id)}>
                                  Approve
                                </button>
                                <button className="btn btn-sm btn-secondary" onClick={() => {
                                  setRevisionTaskId(revisionTaskId === task._id ? null : task._id);
                                  setRevisionNote('');
                                }}>
                                  Request Revision
                                </button>
                              </>
                            )}
                          </div>
                          {revisionTaskId === task._id && (
                            <div style={{ width: '100%', marginTop: 'var(--space-sm)', display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-end' }}>
                              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <input
                                  className="form-input"
                                  placeholder="Revision note..."
                                  value={revisionNote}
                                  onChange={e => setRevisionNote(e.target.value)}
                                  style={{ marginBottom: 0 }}
                                />
                              </div>
                              <button className="btn btn-sm btn-primary" onClick={() => handleRequestRevision(task._id)}>
                                Send
                              </button>
                              <button className="btn btn-sm btn-secondary" onClick={() => setRevisionTaskId(null)}>
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
          <h3 style={{ margin: 0 }}>Create Task</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowTaskForm(v => !v)}>
            {showTaskForm ? 'Cancel' : 'Create Task'}
          </button>
        </div>

        {showTaskForm && (
          <div className="card">
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  className="form-input"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Task description..."
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Milestone *</label>
                  <select
                    className="form-select"
                    value={taskForm.milestoneId}
                    onChange={e => setTaskForm({ ...taskForm, milestoneId: e.target.value })}
                    required
                  >
                    <option value="">Select milestone...</option>
                    {milestones.map(ms => (
                      <option key={ms._id} value={ms._id}>{ms.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select
                    className="form-select"
                    value={taskForm.assignedToId}
                    onChange={e => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {/* Show the project freelancer/agency as first option */}
                    {project?.freelancerOrAgencyId && (
                      <option value={project.freelancerOrAgencyId._id || project.freelancerOrAgencyId}>
                        {project.freelancerOrAgencyId.name || 'Project Assignee'}
                      </option>
                    )}
                    {teamMembers
                      .filter(m => m._id !== (project?.freelancerOrAgencyId?._id || project?.freelancerOrAgencyId))
                      .map(m => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))
                    }
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={taskSubmitting}>
                {taskSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PMProjectDetail;
