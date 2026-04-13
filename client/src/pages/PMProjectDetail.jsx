import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { projectsAPI, milestonesAPI, tasksAPI, usersAPI } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineDocumentText } from 'react-icons/hi';

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

  // Load potential assignees
  useEffect(() => {
    const loadTeam = async () => {
      try {
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

  const handleProjectStatusToggle = async () => {
    const newStatus = project.status === 'active' ? 'on-hold' : 'active';
    try {
      await projectsAPI.updateStatus(project._id, { status: newStatus });
      toast.success(`Project marked as ${newStatus}`);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project status');
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

  // Calculate progress
  const approvedTasks = tasks.filter(t => t.status === 'approved').length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((approvedTasks / totalTasks) * 100);

  // Group tasks by milestone
  const tasksByMilestone = {};
  tasks.forEach(t => {
    const mId = t.milestoneId?._id || t.milestoneId || 'unassigned';
    if (!tasksByMilestone[mId]) tasksByMilestone[mId] = [];
    tasksByMilestone[mId].push(t);
  });

  return (
    <div className="fade-in">
      {/* Project Header */}
      <div className="action-bar">
        <div>
          <h2 style={{ margin: 0, marginBottom: 'var(--space-xs)' }}>{project.title}</h2>
          <div className="flex gap-md text-sm text-muted">
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}><HiOutlineClock size={16} /> Created: {new Date(project.createdAt).toLocaleDateString()}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}><HiOutlineDocumentText size={16} /> Tasks: {approvedTasks}/{totalTasks} approved</span>
          </div>
        </div>
        <div className="flex gap-md items-center">
          <span className={`badge ${project.status === 'active' ? 'badge-success' : project.status === 'on-hold' ? 'badge-warning' : 'badge-gray'}`}>
            {project.status.toUpperCase()}
          </span>
          {project.status !== 'completed' && project.status !== 'cancelled' && (
            <button
              className={`btn btn-sm ${project.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleProjectStatusToggle}
            >
              {project.status === 'active' ? 'Put On Hold' : 'Resume Project'}
            </button>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div>
          {/* Milestones Section */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
              <h3 style={{ margin: 0 }}>Milestones & Tasks</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowMilestoneForm(v => !v)}>
                {showMilestoneForm ? 'Cancel' : '+ New Milestone'}
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
                    {milestoneSubmitting ? 'Creating...' : 'Create Milestone'}
                  </button>
                </form>
              </div>
            )}

            {milestones.length === 0 ? (
              <div className="card">
                <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
                  No milestones defined yet. A project needs milestones to track progress and release payments.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-md">
                {milestones.map((ms, index) => {
                  const msTasks = tasksByMilestone[ms._id] || [];
                  const allApproved = msTasks.length > 0 && msTasks.every(t => t.status === 'approved');
                  return (
                    <div className="card" key={ms._id} style={{ borderLeft: `4px solid ${ms.status === 'approved' ? 'var(--success)' : 'var(--primary-500)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                        <div>
                          <h4 style={{ margin: 0 }}>Step {index + 1}: {ms.title}</h4>
                          <div className="text-sm text-muted" style={{ marginTop: 'var(--space-xs)' }}>
                            Due: {ms.dueDate ? new Date(ms.dueDate).toLocaleDateString() : 'N/A'} • Amount: {ms.amount ? `$${ms.amount.toLocaleString()}` : 'N/A'}
                          </div>
                        </div>
                        <div className="flex items-center gap-sm">
                          <span className={`badge ${milestoneStatusBadge(ms.status)}`}>{ms.status.toUpperCase()}</span>
                          {allApproved && ms.status !== 'approved' && (
                            <button className="btn btn-sm btn-primary" onClick={() => handleMilestoneStatus(ms._id, 'approved')}>
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: 'var(--space-md)' }}>
                        {msTasks.length === 0 ? (
                          <div style={{ padding: 'var(--space-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            No tasks created for this milestone.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                            {msTasks.map(task => (
                              <div key={task._id} style={{ padding: 'var(--space-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                    {task.status === 'approved' ? <HiOutlineCheckCircle color="var(--success)" /> : <HiOutlineClock color="var(--gray-500)" />}
                                    {task.title}
                                  </div>
                                  <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                                    Assignee: {task.assignedToId?.name || 'Unassigned'}
                                  </div>
                                  {task.submissionNote && task.status === 'submitted' && (
                                    <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.8125rem', background: 'var(--bg-card)', padding: 'var(--space-xs) var(--space-sm)', borderLeft: '2px solid var(--primary-500)' }}>
                                      <strong>Submission:</strong> {task.submissionNote}
                                      {task.submissionFileUrl && (
                                        <span> | <a href={task.submissionFileUrl} target="_blank" rel="noopener noreferrer">View File</a></span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-xs">
                                  <span className={`badge ${taskStatusBadge(task.status)}`} style={{ fontSize: '0.65rem' }}>{taskStatusLabel(task.status)}</span>
                                  {task.status === 'submitted' && (
                                    <div className="flex gap-xs" style={{ marginTop: 'var(--space-xs)' }}>
                                      <button className="btn btn-sm btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleApproveTask(task._id)}>
                                        Approve
                                      </button>
                                      <button className="btn btn-sm btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => {
                                        setRevisionTaskId(revisionTaskId === task._id ? null : task._id);
                                        setRevisionNote('');
                                      }}>
                                        Revise
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {revisionTaskId === task._id && (
                                  <div style={{ width: '100%', marginTop: 'var(--space-sm)', display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-end', background: 'var(--bg-card)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
                                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                      <input
                                        className="form-input"
                                        style={{ padding: '0.375rem 0.5rem', fontSize: '0.8125rem' }}
                                        placeholder="Reason for revision..."
                                        value={revisionNote}
                                        onChange={e => setRevisionNote(e.target.value)}
                                      />
                                    </div>
                                    <button className="btn btn-sm btn-primary" onClick={() => handleRequestRevision(task._id)}>Send</button>
                                    <button className="btn btn-sm btn-secondary" onClick={() => setRevisionTaskId(null)}>Cancel</button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          {/* Progress Overview Card */}
          <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ margin: '0 0 var(--space-md) 0' }}>Project Progress</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-xs)' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-600)' }}>{progressPercent}%</span>
              <span className="text-muted text-sm">{approvedTasks} of {totalTasks} tasks approved</span>
            </div>
            <div className="progress-container" style={{ height: 12, marginBottom: 'var(--space-lg)' }}>
              <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
            </div>

            <h4 style={{ margin: '0 0 var(--space-sm) 0', fontSize: '0.9375rem' }}>Create Task</h4>
            {!showTaskForm ? (
              <button
                className="btn btn-outline w-full"
                style={{ justifyContent: 'center', borderStyle: 'dashed' }}
                onClick={() => setShowTaskForm(true)}
              >
                + Add New Task
              </button>
            ) : (
              <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <form onSubmit={handleCreateTask}>
                  <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
                    <input
                      className="form-input"
                      placeholder="Task title *"
                      value={taskForm.title}
                      onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
                    <select
                      className="form-select"
                      value={taskForm.milestoneId}
                      onChange={e => setTaskForm({ ...taskForm, milestoneId: e.target.value })}
                      required
                    >
                      <option value="">Select Milestone *</option>
                      {milestones.map(ms => (
                        <option key={ms._id} value={ms._id}>{ms.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                    <select
                      className="form-select"
                      value={taskForm.assignedToId}
                      onChange={e => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
                    >
                      <option value="">Unassigned (Open for project workers)</option>
                      {project?.freelancerOrAgencyId && (
                        <option value={project.freelancerOrAgencyId._id || project.freelancerOrAgencyId}>
                          {project.freelancerOrAgencyId.name || 'Primary Worker'}
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
                  <div className="flex gap-sm">
                    <button type="submit" className="btn btn-primary flex-1" disabled={taskSubmitting}>
                      {taskSubmitting ? 'Creating...' : 'Create'}
                    </button>
                    <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowTaskForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Timeline Card */}
          <div className="card">
            <h3 style={{ margin: '0 0 var(--space-md) 0' }}>Activity Timeline</h3>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Project Created</div>
                  <div className="text-muted text-xs" style={{ marginTop: 2 }}>{new Date(project.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {project.handedOff && (
                <div className="timeline-item">
                  <div className="timeline-dot" style={{ borderColor: 'var(--info)' }}></div>
                  <div className="timeline-content">
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Handed off to PM</div>
                    <div className="text-muted text-sm" style={{ marginTop: 2 }}>
                      {project.recruiterId?.name} assigned {project.pmId?.name}
                    </div>
                  </div>
                </div>
              )}

              {milestones.map((ms, i) => (
                <div className="timeline-item" key={`ms-${ms._id}`}>
                  <div className="timeline-dot" style={{ borderColor: ms.status === 'approved' ? 'var(--success)' : 'var(--primary-400)' }}></div>
                  <div className="timeline-content">
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Milestone: {ms.title}</div>
                    <div className="text-muted text-xs" style={{ marginTop: 2 }}>
                      Status: {ms.status} {ms.status === 'approved' ? `• Payment released` : ''}
                    </div>
                  </div>
                </div>
              ))}

              {project.status === 'completed' && (
                <div className="timeline-item">
                  <div className="timeline-dot" style={{ borderColor: 'var(--success)' }}></div>
                  <div className="timeline-content">
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Project Completed 🎉</div>
                    <div className="text-muted text-xs" style={{ marginTop: 2 }}>All milestones approved and payments released.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PMProjectDetail;
