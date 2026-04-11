import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  HiOutlineHome, HiOutlineBriefcase, HiOutlineDocumentText,
  HiOutlineChatAlt2, HiOutlineExclamationCircle, HiOutlineCreditCard,
  HiOutlineUser, HiOutlineUserGroup, HiOutlineSearch,
  HiOutlineChartBar, HiOutlineUsers, HiOutlineOfficeBuilding,
  HiOutlineLogout, HiOutlineViewBoards, HiOutlineCash,
  HiOutlineClipboardList
} from 'react-icons/hi';

const ROLES_MENU = {
  admin: [
    { section: 'Admin Metrics' },
    { to: '/admin', icon: HiOutlineChartBar, label: 'Overview' },
    { to: '/admin/users', icon: HiOutlineUsers, label: 'User Management' },
    { to: '/admin/agencies', icon: HiOutlineOfficeBuilding, label: 'Agency Approvals' },
    { to: '/admin/disputes', icon: HiOutlineExclamationCircle, label: 'Disputes' },
    { to: '/admin/projects', icon: HiOutlineBriefcase, label: 'Projects' },
  ],
  recruiter: [
    { section: 'Recruitment' },
    { to: '/recruiter', icon: HiOutlineSearch, label: 'Talent Discovery' },
    { to: '/recruiter/shortlist', icon: HiOutlineClipboardList, label: 'Shortlist' },
    { to: '/recruiter/invites', icon: HiOutlineChatAlt2, label: 'Invites & Messages' },
    { to: '/recruiter/pipeline', icon: HiOutlineViewBoards, label: 'Hiring Pipeline' },
  ],
  projectManager: [
    { section: 'Project Management' },
    { to: '/pm', icon: HiOutlineHome, label: 'Dashboard' },
  ],
  freelancer: [
    { section: 'Freelance Work' },
    { to: '/freelancer', icon: HiOutlineClipboardList, label: 'My Tasks' },
    { to: '/freelancer/invites', icon: HiOutlineChatAlt2, label: 'Invites Inbox' },
    { to: '/freelancer/earnings', icon: HiOutlineCash, label: 'Earnings' },
    { section: 'Settings' },
    { to: '/freelancer/profile', icon: HiOutlineUser, label: 'Profile' },
  ],
  agency: [
    { section: 'Agency Management' },
    { to: '/agency', icon: HiOutlineOfficeBuilding, label: 'Dashboard' },
    { to: '/agency/invites', icon: HiOutlineChatAlt2, label: 'Invites Inbox' },
    { to: '/agency/earnings', icon: HiOutlineCash, label: 'Earnings' },
    { to: '/agency/team', icon: HiOutlineUserGroup, label: 'Team Management' },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = user?.role ? ROLES_MENU[user.role] : [];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="#0D9488"/>
          <path d="M8 20V8h4.5c2.5 0 4 1.5 4 3.5S15 15 12.5 15H11v5H8zm3-7.5h1.3c.9 0 1.2-.5 1.2-1.2 0-.7-.3-1.3-1.2-1.3H11v2.5z" fill="white"/>
        </svg>
        FreelanceHub
      </div>

      <nav className="sidebar-nav">
        {navItems?.map((item, idx) => {
          if (item.section) {
            return <div key={idx} className="sidebar-section">{item.section}</div>;
          }
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
              <item.icon size={20} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-user">
        <div className="avatar avatar-sm">
          {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-role" style={{textTransform: 'capitalize'}}>{user?.role === 'projectManager' ? 'Project Manager' : user?.role}</div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout" style={{ marginLeft: 'auto', color: 'var(--gray-400)' }}>
          <HiOutlineLogout size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
