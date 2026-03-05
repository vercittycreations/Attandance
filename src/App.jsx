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

// ─────────────────────────────────────────────
// Full screen loader shown while Firebase
// checks existing auth session
// ─────────────────────────────────────────────
function AppLoader() {
  return (
    <div className="fixed inset-0 bg-surface-950 flex flex-col items-center justify-center gap-4 z-50">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
          {/* Zap icon inline so no import needed */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <span className="font-bold text-white text-lg tracking-tight">WorkforcePro</span>
      </div>
      {/* Spinner */}
      <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      <p className="text-xs text-white/30 mt-1">Loading your workspace...</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Protected Route — waits for auth to resolve
// ─────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, userProfile, loading } = useAuth();

  // ← Wait for Firebase auth check to complete
  if (loading) return <AppLoader />;

  // Not logged in → redirect to login
  if (!currentUser) return <Navigate to="/login" replace />;

  // Admin only route — wait for profile too
  if (adminOnly) {
    if (!userProfile) return <AppLoader />;
    if (userProfile.role !== 'admin') return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ─────────────────────────────────────────────
// Public Route — redirects if already logged in
// ─────────────────────────────────────────────
function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();

  // Wait for auth check
  if (loading) return <AppLoader />;

  // Already logged in → go to dashboard
  if (currentUser) return <Navigate to="/dashboard" replace />;

  return children;
}

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"     element={<DashboardPage />} />
        <Route path="attendance"    element={<AttendancePage />} />
        <Route path="tasks"         element={<TasksPage />} />
        <Route path="leave"         element={<LeavePage />} />
        <Route path="leaderboard"   element={<LeaderboardPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="groups"        element={<TeamGroupsPage />} />
        <Route path="profile"       element={<ProfilePage />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ─────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────
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
                background:  '#1a1d2e',
                color:       '#fff',
                border:      '1px solid rgba(255,255,255,0.08)',
                borderRadius:'12px',
                fontFamily:  'Sora, sans-serif',
                fontSize:    '14px',
              }
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}