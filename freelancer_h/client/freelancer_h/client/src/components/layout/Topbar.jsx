import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBell, HiOutlineUser } from 'react-icons/hi';

const Topbar = ({ title }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const unread = user?.notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="topbar">
      <h1 className="topbar-title">{title || 'Dashboard'}</h1>
      <div className="flex items-center gap-md">
        <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }} onClick={() => navigate('/profile')}>
          <HiOutlineBell size={20} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              width: 16, height: 16, borderRadius: '50%',
              background: 'var(--error)', color: 'white',
              fontSize: '0.625rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontWeight: 700,
            }}>{unread}</span>
          )}
        </button>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/profile')}>
          <HiOutlineUser size={20} />
        </button>
      </div>
    </div>
  );
};

export default Topbar;
