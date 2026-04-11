import { useState, useEffect, useCallback } from 'react';
import { usersAPI, shortlistAPI, invitesAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  HiOutlineStar, HiOutlineLocationMarker, HiOutlineHeart, HiHeart,
  HiUsers, HiOutlineX,
} from 'react-icons/hi';

/* ---------- Send Invite Modal ---------- */
const SendInviteModal = ({ target, onClose, onSent }) => {
  const [form, setForm] = useState({ projectTitle: '', message: '' });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!form.projectTitle.trim() || !form.message.trim()) {
      return showToast('Fill all fields', 'warning');
    }
    setLoading(true);
    try {
      await invitesAPI.send({
        receiverId: target._id,
        receiverType: target.role === 'agency' ? 'agency' : 'freelancer',
        projectTitle: form.projectTitle,
        message: form.message,
      });
      showToast('Invite sent!', 'success');
      onSent && onSent();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send invite', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <HiOutlineX size={20} />
        </button>
        <h3 style={{ marginBottom: '0.25rem' }}>Send Invite</h3>
        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
          To: <strong>{target?.name}</strong>&nbsp;({target?.title || target?.role})
        </p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Project Title *</label>
            <input className="form-input" placeholder="e.g. E-commerce Website Redesign"
              value={form.projectTitle} onChange={e => setForm({ ...form, projectTitle: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Message *</label>
            <textarea className="form-input" rows={4} placeholder="Describe the project and why you're reaching out..."
              value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required
              style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------- Main Page ---------- */
const TalentSearch = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [shortlists, setShortlists] = useState(new Set());
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [inviteTarget, setInviteTarget] = useState(null);
  const [filters, setFilters] = useState({
    role: 'freelancer',
    skills: '',
    search: '',
    minRate: '',
    maxRate: '',
    availability: '',
    experienceLevel: '',
    page: 1,
  });

  const isRecruiter = currentUser?.role === 'recruiter' || currentUser?.role === 'admin';

  const loadShortlists = useCallback(async () => {
    if (!isRecruiter) return;
    try {
      const { data } = await shortlistAPI.getAll();
      const ids = new Set((data.shortlists || []).map(s => s.targetId?._id || s.targetId));
      setShortlists(ids);
    } catch { /* silent */ }
  }, [isRecruiter]);

  useEffect(() => { loadShortlists(); }, [loadShortlists]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { ...filters, limit: 12 };
        Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
        const { data } = await usersAPI.search(params);
        setUsers(data.users || []);
        setPagination(data.pagination || {});
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [filters]);

  const toggleShortlist = async (u) => {
    try {
      const { data } = await shortlistAPI.toggle({
        targetId: u._id,
        targetType: u.role === 'agency' ? 'Agency' : 'User',
      });
      setShortlists(prev => {
        const s = new Set(prev);
        if (data.shortlisted) s.add(u._id);
        else s.delete(u._id);
        return s;
      });
      showToast(data.shortlisted ? 'Added to shortlist' : 'Removed from shortlist', 'success');
    } catch {
      showToast('Failed to update shortlist', 'error');
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: 'var(--space-xl)' }}>
      <div className="section-header" style={{ textAlign: 'left' }}>
        <h2>Find Talent</h2>
        <p>Discover skilled freelancers and agencies for your projects</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <input className="form-input" placeholder="Search by name, title, or skills..."
          value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
          style={{ flex: '1 1 260px', marginBottom: 0 }} />
        <select className="form-select" value={filters.role}
          onChange={e => setFilters({ ...filters, role: e.target.value, page: 1 })}
          style={{ marginBottom: 0 }}>
          <option value="freelancer">Freelancers</option>
          <option value="agency">Agencies</option>
          <option value="">All</option>
        </select>
        <select className="form-select" value={filters.availability}
          onChange={e => setFilters({ ...filters, availability: e.target.value, page: 1 })}
          style={{ marginBottom: 0 }}>
          <option value="">Any Availability</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <select className="form-select" value={filters.experienceLevel}
          onChange={e => setFilters({ ...filters, experienceLevel: e.target.value, page: 1 })}
          style={{ marginBottom: 0 }}>
          <option value="">Any Experience</option>
          <option value="junior">Junior</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
          <option value="expert">Expert</option>
        </select>
        <input className="form-input" type="number" placeholder="Min $/hr"
          value={filters.minRate} onChange={e => setFilters({ ...filters, minRate: e.target.value, page: 1 })}
          style={{ width: 90, marginBottom: 0 }} />
        <input className="form-input" type="number" placeholder="Max $/hr"
          value={filters.maxRate} onChange={e => setFilters({ ...filters, maxRate: e.target.value, page: 1 })}
          style={{ width: 90, marginBottom: 0 }} />
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner spinner-lg"></div></div>
      ) : users.length > 0 ? (
        <div className="grid-3">
          {users.map(u => {
            const isShortlisted = shortlists.has(u._id);
            return (
              <div className="card" key={u._id} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {/* Shortlist heart -- recruiter only */}
                {isRecruiter && (
                  <button onClick={() => toggleShortlist(u)}
                    style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: isShortlisted ? '#ef4444' : 'var(--text-muted)', transition: 'color 0.2s' }}
                    title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}>
                    {isShortlisted ? <HiHeart size={22} /> : <HiOutlineHeart size={22} />}
                  </button>
                )}

                <div className="flex items-center gap-md mb-md">
                  <div className="avatar avatar-lg">
                    {u.avatar
                      ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : u.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ paddingRight: isRecruiter ? '2rem' : 0 }}>
                    <h4 style={{ fontSize: '1rem', margin: 0 }}>{u.name}</h4>
                    <p className="text-muted text-sm">{u.title || (u.role === 'agency' ? 'Agency' : 'Freelancer')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-md mb-md text-sm" style={{ flexWrap: 'wrap' }}>
                  <span className="flex items-center gap-xs">
                    <HiOutlineStar size={14} style={{ color: '#f59e0b' }} />
                    {u.rating?.average?.toFixed(1) || '0.0'} ({u.rating?.count || 0})
                  </span>
                  {u.location?.city && (
                    <span className="flex items-center gap-xs text-muted">
                      <HiOutlineLocationMarker size={14} /> {u.location.city}
                    </span>
                  )}
                  {u.hourlyRate > 0 && <span className="font-semibold">${u.hourlyRate}/hr</span>}
                  {u.role === 'agency' && <span className="flex items-center gap-xs text-muted"><HiUsers size={14} /> members</span>}
                  {u.experienceLevel && <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{u.experienceLevel}</span>}
                </div>

                <p className="text-sm text-muted mb-md" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                  {u.bio || 'No description available.'}
                </p>

                <div className="flex gap-xs" style={{ flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {u.skills?.slice(0, 4).map(s => <span className="skill-tag" key={s}>{s}</span>)}
                  {u.skills?.length > 4 && <span className="skill-tag">+{u.skills.length - 4}</span>}
                </div>

                {u.availability && (
                  <span className={`badge status-${u.availability}`} style={{ alignSelf: 'flex-start', marginBottom: '0.75rem' }}>
                    {u.availability}
                  </span>
                )}

                {/* Recruiter actions */}
                {isRecruiter && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => setInviteTarget(u)}
                    >
                      Send Invite
                    </button>
                    <button
                      className={`btn btn-sm ${isShortlisted ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => toggleShortlist(u)}
                      title={isShortlisted ? 'Remove from shortlist' : 'Shortlist'}
                    >
                      {isShortlisted ? <HiHeart size={16} /> : <HiOutlineHeart size={16} />}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-title">No talent found</div>
          <p className="text-muted text-sm">Try adjusting your filters.</p>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button key={i}
              className={`pagination-btn ${filters.page === i + 1 ? 'active' : ''}`}
              onClick={() => setFilters({ ...filters, page: i + 1 })}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {inviteTarget && (
        <SendInviteModal
          target={inviteTarget}
          onClose={() => setInviteTarget(null)}
          onSent={loadShortlists}
        />
      )}
    </div>
  );
};

export default TalentSearch;
