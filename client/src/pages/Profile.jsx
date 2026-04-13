import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { usersAPI } from '../api/index.js';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || '',
    title: user?.title || '',
    bio: user?.bio || '',
    hourlyRate: user?.hourlyRate || '',
    availability: user?.availability || 'available',
    experienceLevel: user?.experienceLevel || '',
    location: {
      city: user?.location?.city || '',
      country: user?.location?.country || '',
    },
  });
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState(user?.portfolioLinks || []);
  const [linkInput, setLinkInput] = useState('');
  const [loading, setLoading] = useState(false);

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const addLink = () => {
    if (linkInput.trim() && !portfolioLinks.includes(linkInput.trim())) {
      setPortfolioLinks([...portfolioLinks, linkInput.trim()]);
      setLinkInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        skills,
        portfolioLinks,
        hourlyRate: Number(form.hourlyRate) || undefined,
        experienceLevel: form.experienceLevel || undefined,
      };
      const { data } = await usersAPI.updateMe(payload);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      <h2 style={{ marginBottom: 'var(--space-xl)' }}>Edit Profile</h2>
      <form className="flex flex-col gap-lg" onSubmit={handleSubmit}>
        <div className="flex items-center gap-lg mb-md">
          <div className="avatar avatar-xl">
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h3>{user?.name}</h3>
            <p className="text-muted text-sm">{user?.email}</p>
            {user?.role && (
              <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                {user.role === 'projectManager' ? 'Project Manager' : user.role}
              </span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Professional Title</label>
          <input className="form-input" placeholder="e.g. Full Stack Developer" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Bio</label>
          <textarea className="form-textarea" rows={4} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Hourly Rate ($)</label>
            <input type="number" min="0" step="1" className="form-input" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Availability</label>
            <select className="form-select" value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })}>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Experience Level</label>
          <select className="form-select" value={form.experienceLevel} onChange={e => setForm({ ...form, experienceLevel: e.target.value })}>
            <option value="">Select...</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" value={form.location.city} onChange={e => setForm({ ...form, location: { ...form.location, city: e.target.value } })} />
          </div>
          <div className="form-group">
            <label className="form-label">Country</label>
            <input className="form-input" value={form.location.country} onChange={e => setForm({ ...form, location: { ...form.location, country: e.target.value } })} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Skills</label>
          <div className="flex gap-sm">
            <input className="form-input" value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="Add skill" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
            <button type="button" className="btn btn-secondary" onClick={addSkill}>Add</button>
          </div>
          <div className="flex gap-xs mt-sm" style={{ flexWrap: 'wrap' }}>
            {skills.map(s => (
              <span className="skill-tag" key={s} style={{ cursor: 'pointer' }} onClick={() => setSkills(skills.filter(sk => sk !== s))}>
                {s} x
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Portfolio Links</label>
          <div className="flex gap-sm">
            <input className="form-input" value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="https://github.com/..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} />
            <button type="button" className="btn btn-secondary" onClick={addLink}>Add</button>
          </div>
          <div className="flex flex-col gap-xs mt-sm">
            {portfolioLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-sm">
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ wordBreak: 'break-all', flex: 1 }}>{link}</a>
                <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)', padding: '2px 6px' }} onClick={() => setPortfolioLinks(portfolioLinks.filter((_, idx) => idx !== i))}>
                  x
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
