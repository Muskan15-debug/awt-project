import { useState, useEffect, useRef, useCallback } from 'react';
import { invitesAPI, shortlistAPI, usersAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  HiOutlineUserGroup, HiOutlineMail, HiOutlineCheck, HiOutlineOfficeBuilding,
  HiOutlineChevronDown, HiOutlineChevronUp, HiOutlinePaperAirplane, HiOutlineX,
  HiOutlineHeart,
} from 'react-icons/hi';

/* --- Message Thread --- */
const MessageThread = ({ inviteId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const toast = useToast();

  const load = useCallback(async () => {
    try { const { data } = await invitesAPI.getMessages(inviteId); setMessages(data.messages || []); } catch { }
  }, [inviteId]);

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try { await invitesAPI.sendMessage(inviteId, text.trim()); setText(''); await load(); }
    catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ padding: '0.4rem 1rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>THREAD</div>
      <div style={{ maxHeight: 200, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--surface-minus-1)' }}>
        {messages.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', margin: 'auto' }}>No messages yet.</p>}
        {messages.map(m => {
          const isMe = String(m.senderId?._id) === String(currentUserId);
          return (
            <div key={m._id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', flexShrink: 0 }}>{m.senderId?.name?.[0]?.toUpperCase()}</div>
              <div style={{ maxWidth: '72%', padding: '0.45rem 0.75rem', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: isMe ? 'var(--primary)' : 'var(--surface)', color: isMe ? '#fff' : 'var(--text)', fontSize: '0.875rem' }}>{m.content}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <input className="form-input" style={{ flex: 1, marginBottom: 0 }} placeholder="Message..." value={text} onChange={e => setText(e.target.value)} disabled={sending} />
        <button className="btn btn-primary btn-sm" type="submit" disabled={sending || !text.trim()}><HiOutlinePaperAirplane size={15} /></button>
      </form>
    </div>
  );
};

/* --- Invite Card --- */
const statusColor = { pending: '#f59e0b', accepted: '#10b981', declined: '#ef4444' };

const InviteCard = ({ invite, pmList, onAssignPM, currentUserId }) => {
  const [expanded, setExpanded] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedPM, setSelectedPM] = useState('');
  const toast = useToast();
  const receiver = invite.receiverId;

  const handleAssign = async () => {
    if (!selectedPM) return toast.warning('Select a PM first');
    setAssigning(true);
    try { await onAssignPM(invite._id, selectedPM); toast.success('Handed off to PM!'); }
    catch { toast.error('Failed to assign PM'); }
    finally { setAssigning(false); }
  };

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
          <div className="avatar avatar-md">{receiver?.avatar ? <img src={receiver.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : receiver?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600 }}>{receiver?.name}</div>
            <div className="text-muted text-sm">{receiver?.title || receiver?.role}</div>
            <div style={{ fontSize: '0.85rem', marginTop: 2 }}>{invite.projectTitle}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: `${statusColor[invite.status]}22`, color: statusColor[invite.status] }}>{invite.status}</span>
          {invite.assignedPM && <span className="text-muted text-sm">PM: {invite.assignedPM?.name}</span>}
          <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            {expanded ? <HiOutlineChevronUp size={18} /> : <HiOutlineChevronDown size={18} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'var(--surface-minus-1)', padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
            "{invite.message}"
          </p>
          {invite.status === 'accepted' && !invite.assignedPM && (
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
              <select className="form-select" style={{ flex: 1, minWidth: 200, marginBottom: 0 }} value={selectedPM} onChange={e => setSelectedPM(e.target.value)}>
                <option value="">Select Project Manager...</option>
                {pmList.map(pm => <option key={pm._id} value={pm._id}>{pm.name}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleAssign} disabled={assigning || !selectedPM}>
                {assigning ? 'Assigning...' : 'Hand Off to PM'}
              </button>
            </div>
          )}
          <MessageThread inviteId={invite._id} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
};

/* --- Send Invite Modal --- */
const SendInviteModal = ({ target, onClose, onSent }) => {
  const [form, setForm] = useState({ projectTitle: '', message: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!form.projectTitle.trim() || !form.message.trim()) return toast.warning('Fill all fields');
    setLoading(true);
    try {
      await invitesAPI.send({ receiverId: target._id, receiverType: target.role === 'agency' ? 'agency' : 'freelancer', ...form });
      toast.success('Invite sent!'); onSent(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><HiOutlineX size={20} /></button>
        <h3 style={{ marginBottom: '0.25rem' }}>Send Invite</h3>
        <p className="text-muted text-sm" style={{ marginBottom: '1.25rem' }}>To: <strong>{target?.name}</strong></p>
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Project Title *</label><input className="form-input" placeholder="e.g. Mobile App Development" value={form.projectTitle} onChange={e => setForm({ ...form, projectTitle: e.target.value })} required /></div>
          <div className="form-group"><label className="form-label">Message *</label><textarea className="form-input" rows={4} placeholder="Why are you reaching out and what does the project involve?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required style={{ resize: 'vertical' }} /></div>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Sending...' : 'Send Invite'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --- Main Dashboard --- */
const TABS = ['Shortlisted', 'Invited', 'Accepted', 'Handed Off'];
const TAB_ICONS = [HiOutlineHeart, HiOutlineMail, HiOutlineCheck, HiOutlineOfficeBuilding];

const RecruiterDashboard = ({ initialTab = 0 }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState(initialTab);
  const [invites, setInvites] = useState([]);
  const [shortlisted, setShortlisted] = useState([]);
  const [pmList, setPmList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteTarget, setInviteTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      const [invRes, slRes, pmRes] = await Promise.all([
        invitesAPI.getAll(),
        shortlistAPI.getAll(),
        usersAPI.search({ role: 'projectManager', limit: 100 }),
      ]);
      setInvites(invRes.data.invites || []);
      setShortlisted(slRes.data.shortlists || []);
      setPmList(pmRes.data.users || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAssignPM = async (inviteId, pmId) => {
    await invitesAPI.assignPM(inviteId, pmId);
    await load();
  };

  const tabData = [
    shortlisted,
    invites.filter(i => i.status === 'pending'),
    invites.filter(i => i.status === 'accepted' && !i.assignedPM),
    invites.filter(i => !!i.assignedPM),
  ];

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg"></div></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>Hiring Pipeline</h2>
        <p className="text-muted">Manage your talent from shortlist to project handoff.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {TABS.map((label, i) => {
          const Icon = TAB_ICONS[i];
          return (
            <div key={label} className="stat-card" style={{ cursor: 'pointer', border: tab === i ? '2px solid var(--primary)' : '2px solid transparent', transition: 'border-color 0.2s' }} onClick={() => setTab(i)}>
              <Icon size={22} color="var(--primary)" />
              <div className="stat-value" style={{ marginTop: '0.5rem' }}>{tabData[i].length}</div>
              <div className="stat-label">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ background: 'none', border: 'none', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', borderBottom: tab === i ? '3px solid var(--primary)' : '3px solid transparent', color: tab === i ? 'var(--primary)' : 'var(--text-muted)', transition: 'all 0.2s', marginBottom: -2 }}>
            {t}
            <span style={{ marginLeft: 6, background: 'var(--surface)', borderRadius: 99, padding: '1px 7px', fontSize: '0.72rem' }}>{tabData[i].length}</span>
          </button>
        ))}
      </div>

      {/* Tab 0 -- Shortlisted talent */}
      {tab === 0 && (
        shortlisted.length === 0
          ? <div className="empty-state"><div className="empty-state-title">No shortlisted talent</div><p className="text-muted text-sm">Go to Talent Search and click the heart icon or "Send Invite" on any freelancer or agency.</p></div>
          : <div className="grid-3">
            {shortlisted.map(sl => {
              const t = sl.targetId;
              if (!t) return null;
              return (
                <div className="card" key={sl._id}>
                  <div className="flex items-center gap-md mb-md">
                    <div className="avatar avatar-md">{t.avatar ? <img src={t.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : t.name?.[0]?.toUpperCase()}</div>
                    <div><div style={{ fontWeight: 600 }}>{t.name}</div><div className="text-muted text-sm">{t.title || t.role}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {t.skills?.slice(0, 3).map(s => <span className="skill-tag" key={s}>{s}</span>)}
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => setInviteTarget(t)}>Send Invite</button>
                </div>
              );
            })}
          </div>
      )}

      {/* Tabs 1-3 -- Invite lists */}
      {tab > 0 && (
        tabData[tab].length === 0
          ? <div className="empty-state">
            <div className="empty-state-title">Nothing here yet</div>
            <p className="text-muted text-sm">{['', 'Send invites from Talent Search or the Shortlisted tab.', 'Waiting for freelancers/agencies to accept.', 'Accepted invites will appear here after PM assignment.'][tab]}</p>
          </div>
          : tabData[tab].map(inv => (
            <InviteCard key={inv._id} invite={inv} pmList={pmList} onAssignPM={handleAssignPM} currentUserId={user?._id} />
          ))
      )}

      {inviteTarget && (
        <SendInviteModal target={inviteTarget} onClose={() => setInviteTarget(null)} onSent={load} />
      )}
    </div>
  );
};

export default RecruiterDashboard;
