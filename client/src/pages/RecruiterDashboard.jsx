import { useState, useEffect, useRef, useCallback } from 'react';
import { invitesAPI, shortlistAPI, usersAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  HiOutlineHeart, HiOutlineMail, HiOutlineCheck, HiOutlineOfficeBuilding,
  HiOutlinePaperAirplane, HiOutlineX,
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
    try { const { data } = await invitesAPI.sendMessage(inviteId, text.trim()); setMessages(prev => [...prev, data.message]); setText(''); }
    catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ padding: '0.6rem 1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
        MESSAGE THREAD
      </div>
      <div style={{ height: 280, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-tertiary)' }}>
        {messages.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', margin: 'auto' }}>No messages yet. Start the conversation!</p>
        )}
        {messages.map(m => {
          const isMe = String(m.senderId?._id) === String(currentUserId);
          return (
            <div key={m._id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '0.6rem', alignItems: 'flex-end' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                {m.senderId?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ maxWidth: '70%', padding: '0.6rem 0.9rem', borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px', background: isMe ? 'var(--primary-600)' : 'var(--primary-100)', color: isMe ? '#fff' : 'var(--primary-800)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: '0.6rem', padding: '0.75rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
        <input className="form-input" style={{ flex: 1, marginBottom: 0 }} placeholder="Type a message..." value={text} onChange={e => setText(e.target.value)} disabled={sending} />
        <button className="btn btn-primary" type="submit" disabled={sending || !text.trim()}>
          <HiOutlinePaperAirplane size={18} />
        </button>
      </form>
    </div>
  );
};

/* --- Card Detail Modal (opens on click) --- */
const CardModal = ({ item, type, pmList, onAssignPM, onSendInvite, onClose, currentUserId }) => {
  const [assigning, setAssigning] = useState(false);
  const [selectedPM, setSelectedPM] = useState('');
  const toast = useToast();
  const person = type === 'shortlist' ? item.targetId : item.receiverId;

  const handleAssign = async () => {
    if (!selectedPM) return toast.warning('Select a PM first');
    setAssigning(true);
    try { await onAssignPM(item._id, selectedPM); toast.success('Handed off to PM!'); onClose(); }
    catch { toast.error('Failed to assign PM'); }
    finally { setAssigning(false); }
  };

  if (!person) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column' }}>

        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div className="avatar avatar-lg">
            {person.avatar ? <img src={person.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : person.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{person.name}</h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{person.title || person.role}</div>
            {type !== 'shortlist' && (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>📋 {item.projectTitle}</div>
            )}
          </div>
          {type !== 'shortlist' && (
            <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, background: item.status === 'pending' ? '#fef3c7' : item.status === 'accepted' ? '#d1fae5' : '#fee2e2', color: item.status === 'pending' ? '#92400e' : item.status === 'accepted' ? '#065f46' : '#991b1b' }}>
              {item.status}
            </span>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}>
            <HiOutlineX size={22} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Skills */}
          {person.skills?.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {person.skills.map(s => <span className="skill-tag" key={s}>{s}</span>)}
            </div>
          )}

          {/* Shortlist: send invite button */}
          {type === 'shortlist' && (
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => { onSendInvite(person); onClose(); }}>
              Send Invite to {person.name}
            </button>
          )}

          {/* Invite message */}
          {type !== 'shortlist' && item.message && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1rem', borderLeft: '3px solid var(--primary-400)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invite Message</div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontStyle: 'italic', margin: 0 }}>"{item.message}"</p>
            </div>
          )}

          {/* PM handoff */}
          {type !== 'shortlist' && item.status === 'accepted' && !item.assignedPM && (
            <div style={{ background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--primary-200)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-700)', marginBottom: '0.75rem' }}>🎯 Hand Off to Project Manager</div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <select className="form-select" style={{ flex: 1, marginBottom: 0 }} value={selectedPM} onChange={e => setSelectedPM(e.target.value)}>
                  <option value="">Select Project Manager...</option>
                  {pmList.map(pm => <option key={pm._id} value={pm._id}>{pm.name}</option>)}
                </select>
                <button className="btn btn-primary" onClick={handleAssign} disabled={assigning || !selectedPM}>
                  {assigning ? 'Assigning...' : 'Hand Off'}
                </button>
              </div>
            </div>
          )}

          {/* PM assigned badge */}
          {item.assignedPM && (
            <div style={{ background: '#d1fae5', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>✅</span>
              <span style={{ fontSize: '0.9rem', color: '#065f46', fontWeight: 600 }}>Handed off to PM: {item.assignedPM?.name}</span>
            </div>
          )}

          {/* Message thread */}
          {type !== 'shortlist' && (
            <MessageThread inviteId={item._id} currentUserId={currentUserId} />
          )}
        </div>
      </div>
    </div>
  );
};

/* --- Kanban Card (compact, click to open modal) --- */
const KanbanCard = ({ item, type, onOpen }) => {
  const person = type === 'shortlist' ? item.targetId : item.receiverId;
  if (!person) return null;

  const statusColors = { pending: '#f59e0b', accepted: '#10b981', declined: '#ef4444' };
  const statusBg = { pending: '#fef3c7', accepted: '#d1fae5', declined: '#fee2e2' };
  const statusText = { pending: '#92400e', accepted: '#065f46', declined: '#991b1b' };

  return (
    <div
      onClick={() => onOpen(item)}
      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--primary-300)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="avatar avatar-md">
          {person.avatar ? <img src={person.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : person.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.title || person.role}</div>
        </div>
        {type !== 'shortlist' && (
          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: statusBg[item.status], color: statusText[item.status], flexShrink: 0 }}>
            {item.status}
          </span>
        )}
      </div>

      {type !== 'shortlist' && (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.6rem', padding: '0.3rem 0.6rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          📋 {item.projectTitle}
        </div>
      )}

      {type === 'shortlist' && person.skills?.length > 0 && (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
          {person.skills.slice(0, 3).map(s => <span className="skill-tag" key={s}>{s}</span>)}
          {person.skills.length > 3 && <span className="skill-tag">+{person.skills.length - 3}</span>}
        </div>
      )}

      {item.assignedPM && (
        <div style={{ fontSize: '0.78rem', color: '#065f46', marginTop: '0.5rem', fontWeight: 600 }}>✅ PM: {item.assignedPM?.name}</div>
      )}

      <div style={{ fontSize: '0.75rem', color: 'var(--primary-600)', marginTop: '0.6rem', fontWeight: 600 }}>Click to open →</div>
    </div>
  );
};

/* --- Kanban Column --- */
const KanbanColumn = ({ title, icon: Icon, color, items, type, pmList, onAssignPM, onSendInvite, currentUserId }) => {
  const [activeItem, setActiveItem] = useState(null);

  return (
    <div style={{ flex: '1 1 0', minWidth: 240, display: 'flex', flexDirection: 'column' }}>
      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', background: `${color}15`, borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: `1px solid ${color}30` }}>
        <Icon size={18} color={color} />
        <span style={{ fontWeight: 700, fontSize: '0.875rem', color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        <span style={{ marginLeft: 'auto', background: color, color: '#fff', borderRadius: 99, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>{items.length}</span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
        {items.length === 0
          ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '2.5rem 1rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              No items yet
            </div>
          : items.map(item => (
            <KanbanCard key={item._id} item={item} type={type} onOpen={setActiveItem} />
          ))
        }
      </div>

      {/* Card detail modal */}
      {activeItem && (
        <CardModal
          item={activeItem}
          type={type}
          pmList={pmList}
          onAssignPM={onAssignPM}
          onSendInvite={onSendInvite}
          onClose={() => setActiveItem(null)}
          currentUserId={currentUserId}
        />
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 500, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><HiOutlineX size={20} /></button>
        <h3 style={{ marginBottom: '0.25rem' }}>Send Invite</h3>
        <p className="text-muted text-sm" style={{ marginBottom: '1.25rem' }}>To: <strong>{target?.name}</strong></p>
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Project Title *</label><input className="form-input" placeholder="e.g. Mobile App Development" value={form.projectTitle} onChange={e => setForm({ ...form, projectTitle: e.target.value })} required /></div>
          <div className="form-group"><label className="form-label">Message *</label><textarea className="form-input" rows={4} placeholder="Why are you reaching out?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required style={{ resize: 'vertical' }} /></div>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Sending...' : 'Send Invite'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --- Main --- */
const RecruiterDashboard = () => {
  const { user } = useAuth();
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

  const columns = [
    { title: 'Shortlisted', icon: HiOutlineHeart, color: '#6366f1', items: shortlisted, type: 'shortlist' },
    { title: 'Invited', icon: HiOutlineMail, color: '#f59e0b', items: invites.filter(i => i.status === 'pending'), type: 'invite' },
    { title: 'Accepted', icon: HiOutlineCheck, color: '#10b981', items: invites.filter(i => i.status === 'accepted' && !i.assignedPM), type: 'invite' },
    { title: 'Handed Off', icon: HiOutlineOfficeBuilding, color: '#0d9488', items: invites.filter(i => !!i.assignedPM), type: 'invite' },
  ];

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg"></div></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>Hiring Pipeline</h2>
        <p className="text-muted">Track your talent from shortlist to project handoff. Click any card to open details.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {columns.map(col => (
          <div key={col.title} style={{ flex: '1 1 140px', background: 'var(--bg-primary)', border: `1px solid ${col.color}44`, borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: `${col.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <col.icon size={22} color={col.color} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: col.color, lineHeight: 1 }}>{col.items.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{col.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
        {columns.map(col => (
          <KanbanColumn
            key={col.title}
            title={col.title}
            icon={col.icon}
            color={col.color}
            items={col.items}
            type={col.type}
            pmList={pmList}
            onAssignPM={handleAssignPM}
            onSendInvite={setInviteTarget}
            currentUserId={user?._id}
          />
        ))}
      </div>

      {inviteTarget && (
        <SendInviteModal target={inviteTarget} onClose={() => setInviteTarget(null)} onSent={load} />
      )}
    </div>
  );
};

export default RecruiterDashboard;
