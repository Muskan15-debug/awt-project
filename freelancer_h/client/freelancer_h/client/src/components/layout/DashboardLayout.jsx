import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

const pageTitles = {
  // Admin
  '/admin': 'Overview Panel',
  '/admin/users': 'User Management',
  '/admin/agencies': 'Agency Approval Queue',
  '/admin/disputes': 'Dispute Management',
  '/admin/projects': 'All Projects',

  // Recruiter
  '/recruiter': 'Talent Discovery',
  '/recruiter/shortlist': 'Shortlist',
  '/recruiter/invites': 'Invites & Messages',
  '/recruiter/pipeline': 'Hiring Pipeline View',

  // Project Manager
  '/pm': 'My Projects',

  // Freelancer
  '/freelancer': 'My Tasks',
  '/freelancer/invites': 'Invites Inbox',
  '/freelancer/earnings': 'Earnings',
  '/freelancer/profile': 'Profile Management',

  // Agency
  '/agency': 'Agency Dashboard',
  '/agency/invites': 'Invites Inbox',
  '/agency/earnings': 'Earnings',
  '/agency/team': 'Team Management',
};

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] || 'FreelanceHub';

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
