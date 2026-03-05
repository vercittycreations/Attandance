import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import TasksPage from './pages/TasksPage';
import LeavePage from './pages/LeavePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import TeamGroupsPage from './pages/TeamGroupsPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, userProfile } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (adminOnly && userProfile?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="groups" element={<TeamGroupsPage />} />
        <Route path="admin" element={
          <ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1d2e', color: '#fff',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', fontFamily: 'Sora, sans-serif', fontSize: '14px'
              }
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}