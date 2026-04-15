import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const getDashboardPath = (role) => {
    if (role === 'projectManager') return '/pm';
    return `/${role}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      toast.success('Welcome back!');
      navigate(getDashboardPath(res.user?.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="you@example.com" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Enter your password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span> : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
