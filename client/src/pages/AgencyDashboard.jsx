import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { tasksAPI, agenciesAPI } from '../api/index.js';

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

const AgencyDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reassigningTaskId, setReassigningTaskId] = useState(null);
  const [selectedMember, setSelectedMember] = useState('');

  const load = useCallback(async () => {
    try {
      const taskRes = await tasksAPI.getMy();
      setTasks(taskRes.data.tasks || []);

      // Try to load agency members if user has an agencyId
      if (user?.agencyId) {
        try {
          const agencyRes = await agenciesAPI.getOne(user.agencyId);
          setMembers(agencyRes.data.agency?.members || agencyRes.data.members || []);
        } catch {
          // silent - may not have agency details
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.agencyId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReassign = async (taskId) => {
    if (!selectedMember) return toast.error('Select a team member');
    try {
      await tasksAPI.reassign(taskId, { assignedToId: selectedMember });
      toast.success('Task reassigned!');
      setReassigningTaskId(null);
      setSelectedMember('');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reassign task');
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner spinner-lg"></div></div>;
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-xs)' }}>Agency Dashboard</h2>
        <p className="text-muted">Tasks assigned to your agency and team members.</p>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No tasks assigned</div>
          <p className="text-muted text-sm">When projects are started, tasks assigned to your agency will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-md">
          {tasks.map(task => (
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
                    {task.assignedToId?.name && <span>| Assigned: {task.assignedToId.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-sm">
                  <span className={`badge ${statusBadgeClass(task.status)}`}>{statusLabel(task.status)}</span>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setReassigningTaskId(reassigningTaskId === task._id ? null : task._id);
                      setSelectedMember('');
                    }}
                  >
                    Reassign
                  </button>
                </div>
              </div>

              {reassigningTaskId === task._id && (
                <div style={{ marginTop: 'var(--space-sm)', display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <select
                      className="form-select"
                      value={selectedMember}
                      onChange={e => setSelectedMember(e.target.value)}
                      style={{ marginBottom: 0 }}
                    >
                      <option value="">Select team member...</option>
                      {members.map(m => {
                        const member = m.userId || m;
                        return (
                          <option key={member._id || member} value={member._id || member}>
                            {member.name || 'Team member'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={() => handleReassign(task._id)}>
                    Confirm
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setReassigningTaskId(null)}>
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
};

export default AgencyDashboard;
