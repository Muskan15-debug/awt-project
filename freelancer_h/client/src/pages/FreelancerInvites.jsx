import { useState, useEffect, useRef, useCallback } from 'react';
import { invitesAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  HiOutlineCheck, HiOutlineX, HiOutlineChevronDown, HiOutlineChevronUp,
  HiOutlinePaperAirplane, HiOutlineClock,
} from 'react-icons/hi';

const statusColor = { pending: '#f59e0b', accepted: '#10b981', declined: '#ef4444' };

const MessageThread = ({ inviteId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const { data } = await invitesAPI.getMessages(inviteId);
      setMessages(data.messages);
    } catch { /* silent */ }
  }, [inviteId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await invitesAPI.sendMessage(inviteId, text.trim());
      setText('');
      await load();
    } catch {
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ marginTop: 'var(--space-md)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ background: 'var(--surface)', padding: 'var(--space-xs) var(--space-md)', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        MESSAGE THREAD
      </div>
      <div style={{ maxHeight: 220, overflowY: 'auto', padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', background: 'var(--surface-minus-1)' }}>
        {messages.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: 'auto' }}>No messages yet.</p>
        )}
        {messages.map(m => {
          const isMe = String(m.senderId?._id) === String(currentUserId);
          return (
            <div key={m._id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 'var(--space-xs)', alignItems: 'flex-end' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#fff', flexShrink: 0 }}>
                {m.senderId?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ maxWidth: '70%', padding: '0.5rem 0.75rem', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: isMe ? 'var(--primary)' : 'var(--surface)', color: isMe ? '#fff' : 'var(--text)', fontSize: '0.875rem', boxShadow: 'var(--shadow-sm)' }}>
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: 'var(--space-xs)', padding: 'var(--space-sm)', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <input
          className="form-input"
          style={{ flex: 1, marginBottom: 0 }}
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={sending}
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={sending || !text.trim()}>
          <HiOutlinePaperAirplane size={16} />
        </button>
      </form>
    </div>
  );
};

const InviteInboxCard = ({ invite, onRespond, currentUserId }) => {
  const [expanded, setExpanded] = useState(false);
  const [responding, setResponding] = useState(false);

  const recruiter = invite.recruiterId;

  const respond = async (status) => {
    setResponding(true);
    try {
      await onRespond(invite._id, status);
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1 }}>
          <div className="avatar avatar-md">
            {recruiter?.avatar ? <img src={recruiter.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : recruiter?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{recruiter?.name}</div>
            <div className="text-muted text-sm">Recruiter</div>
            <div style={{ fontSize: '0.85rem', marginTop: 2 }}>📋 {invite.projectTitle}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, background: `${statusColor[invite.status]}22`, color: statusColor[invite.status] }}>
            {invite.status}
          </span>
          {invite.status === 'pending' && (
            <>
              <button className="btn btn-sm" style={{ background: '#10b981', color: '#fff', border: 'none' }} onClick={() => respond('accepted')} disabled={responding}>
                <HiOutlineCheck size={14} /> Accept
              </button>
              <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={() => respond('declined')} disabled={responding}>
                <HiOutlineX size={14} /> Decline
              </button>
            </>
          )}
          {invite.status === 'accepted' && invite.assignedPM && (
            <span className="text-muted text-sm">PM: {invite.assignedPM?.name}</span>
          )}
          <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            {expanded ? <HiOutlineChevronUp size={18} /> : <HiOutlineChevronDown size={18} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', background: 'var(--surface-minus-1)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', fontStyle: 'italic', marginBottom: 'var(--space-md)' }}>
            "{invite.message}"
          </p>
          {invite.status !== 'declined' && (
            <MessageThread inviteId={invite._id} currentUserId={currentUserId} />
          )}
        </div>
      )}
    </div>
  );
};

const FreelancerInvites = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const { data } = await invitesAPI.getAll();
      setInvites(data.invites);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRespond = async (id, status) => {
    try {
      await invitesAPI.respond(id, status);
      showToast(status === 'accepted' ? 'Invite accepted! A project has been created.' : 'Invite declined.', status === 'accepted' ? 'success' : 'info');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const filtered = filter === 'all' ? invites : invites.filter(i => i.status === filter);

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg"></div></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-xs)' }}>Invites 📩</h2>
        <p className="text-muted">Recruiters have reached out to you for their projects.</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xl)' }}>
        {['all', 'pending', 'accepted', 'declined'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className="btn btn-sm" style={{ fontWeight: 600, background: filter === s ? 'var(--primary)' : 'var(--surface)', color: filter === s ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📩</div>
          <div className="empty-state-title">No invites {filter !== 'all' ? `(${filter})` : ''}</div>
          <p className="text-muted text-sm">Keep your profile complete so recruiters can find you.</p>
        </div>
      ) : (
        filtered.map(invite => (
          <InviteInboxCard
            key={invite._id}
            invite={invite}
            onRespond={handleRespond}
            currentUserId={user?._id}
          />
        ))
      )}
    </div>
  );
};

export default FreelancerInvites;
