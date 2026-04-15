import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const ROLES = [
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'projectManager', label: 'Project Manager' },
  { value: 'agency', label: 'Agency' },
];

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'freelancer' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const getDashboardPath = (role) => {
    if (role === 'projectManager') return '/pm';
    return `/${role}`;
  };

  const selectRole = (role) => {
    setForm(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) return toast.error('Select a role');
    setLoading(true);
    try {
      const data = await register(form);
      toast.success('Account created! Welcome aboard.');
      navigate(getDashboardPath(data.user?.role || form.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        <div className="auth-header">
          <Link to="/" className="navbar-brand" style={{ justifyContent: 'center', marginBottom: 'var(--space-md)' }}>
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="8" fill="#0D9488"/><path d="M8 20V8h4.5c2.5 0 4 1.5 4 3.5S15 15 12.5 15H11v5H8zm3-7.5h1.3c.9 0 1.2-.5 1.2-1.2 0-.7-.3-1.3-1.2-1.3H11v2.5z" fill="white"/></svg>
            <span>FreelanceHub</span>
          </Link>
          <h1>Create Account</h1>
          <p>Start your freelancing journey</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" placeholder="John Doe" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="you@example.com" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Min 6 characters" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">I want to...</label>
            <div className="role-picker">
              {ROLES.map(r => (
                <button key={r.value} type="button" className={`role-option ${form.role === r.value ? 'selected' : ''}`} onClick={() => selectRole(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span> : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
