import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user?.role) return '/login';
    if (user.role === 'projectManager') return '/pm';
    return `/${user.role}`;
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="#0D9488"/>
          <path d="M8 20V8h4.5c2.5 0 4 1.5 4 3.5S15 15 12.5 15H11v5H8zm3-7.5h1.3c.9 0 1.2-.5 1.2-1.2 0-.7-.3-1.3-1.2-1.3H11v2.5z" fill="white"/>
        </svg>
        <span>FreelanceHub</span>
      </Link>

      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/talent">Find Talent</Link></li>
      </ul>

      <div className="navbar-actions">
        {user ? (
          <button className="btn btn-primary" onClick={() => navigate(getDashboardPath())}>
            Dashboard
          </button>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={() => navigate('/login')}>Log In</button>
            <button className="btn btn-primary" onClick={() => navigate('/register')}>Sign Up Free</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
