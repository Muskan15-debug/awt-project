import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { agenciesAPI } from '../api/index.js';
import { HiOutlineUser, HiOutlineMail } from 'react-icons/hi';

const AgencyTeam = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTeam = useCallback(async () => {
    if (!user?.agencyId) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await agenciesAPI.getOne(user.agencyId);
      setMembers(data.agency?.members || data.members || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, [user?.agencyId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  if (loading) {
    return <div className="loading-screen"><div className="spinner spinner-lg"></div></div>;
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-xs)' }}>Agency Team</h2>
        <p className="text-muted">Manage your agency members and roles.</p>
      </div>

      {!user?.agencyId ? (
        <div className="empty-state">
          <div className="empty-state-title">No Agency Found</div>
          <p className="text-muted text-sm">You are not currently part of an active agency.</p>
        </div>
      ) : members.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No Team Members</div>
          <p className="text-muted text-sm">Use the Talent Search feature to invite freelancers to your agency.</p>
        </div>
      ) : (
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {members.map(m => {
            const memberObj = m.user || m.userId || m; // Depending on how Mongoose populated it
            return (
              <div className="card" key={memberObj._id || Math.random()}>
                <div className="flex items-center gap-md mb-md">
                  <div className="avatar avatar-md">
                    {memberObj.avatar 
                      ? <img src={memberObj.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> 
                      : (memberObj.name?.[0]?.toUpperCase() || <HiOutlineUser />)
                    }
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{memberObj.name || 'Pending User'}</h4>
                    <p className="text-muted text-sm" style={{ margin: 0, textTransform: 'capitalize' }}>
                      Role: <strong style={{ color: 'var(--text-primary)' }}>{m.role || 'Member'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-xs text-sm text-muted">
                  {memberObj.email && (
                    <span className="flex items-center gap-xs">
                      <HiOutlineMail /> {memberObj.email}
                    </span>
                  )}
                  <span className="flex items-center gap-xs">
                     Status: 
                     <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: 4 }}>
                       {m.status || 'Active'}
                     </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgencyTeam;
