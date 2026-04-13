import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

import PublicLayout from './components/layout/PublicLayout.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import TalentSearch from './pages/TalentSearch.jsx';
import RecruiterDashboard from './pages/RecruiterDashboard.jsx';
import FreelancerInvites from './pages/FreelancerInvites.jsx';
import AgencyInvites from './pages/AgencyInvites.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PMDashboard from './pages/PMDashboard.jsx';
import PMProjectDetail from './pages/PMProjectDetail.jsx';
import AgencyDashboard from './pages/AgencyDashboard.jsx';
import AgencyTeam from './pages/AgencyTeam.jsx';
import Earnings from './pages/Earnings.jsx';
import Profile from './pages/Profile.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminAgencies from './pages/AdminAgencies.jsx';
import AdminDisputes from './pages/AdminDisputes.jsx';
import AdminProjects from './pages/AdminProjects.jsx';
import AdminActivity from './pages/AdminActivity.jsx';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/talent" element={<TalentSearch />} />
            </Route>

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Protected routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/agencies" element={<AdminAgencies />} />
                <Route path="/admin/disputes" element={<AdminDisputes />} />
                <Route path="/admin/projects" element={<AdminProjects />} />
                <Route path="/admin/activity" element={<AdminActivity />} />
                <Route path="/admin/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Recruiter Protected routes */}
            <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/recruiter" element={<TalentSearch />} />
                <Route path="/recruiter/pipeline" element={<RecruiterDashboard />} />
                <Route path="/recruiter/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* PM Protected routes */}
            <Route element={<ProtectedRoute allowedRoles={['projectManager']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/pm" element={<PMDashboard />} />
                <Route path="/pm/projects/:id" element={<PMProjectDetail />} />
                <Route path="/pm/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Freelancer Protected routes */}
            <Route element={<ProtectedRoute allowedRoles={['freelancer']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/freelancer" element={<Dashboard />} />
                <Route path="/freelancer/invites" element={<FreelancerInvites />} />
                <Route path="/freelancer/earnings" element={<Earnings />} />
                <Route path="/freelancer/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Agency Protected routes */}
            <Route element={<ProtectedRoute allowedRoles={['agency']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/agency" element={<AgencyDashboard />} />
                <Route path="/agency/invites" element={<AgencyInvites />} />
                <Route path="/agency/earnings" element={<Earnings />} />
                <Route path="/agency/team" element={<AgencyTeam />} />
                <Route path="/agency/profile" element={<Profile />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
