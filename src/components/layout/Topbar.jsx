import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Avatar from '../common/Avatar';
import NotificationPanel from '../notifications/NotificationPanel';

const pageTitles = {
  '/dashboard': 'Dashboard', '/attendance': 'Attendance', '/tasks': 'My Tasks',
  '/leave': 'Leave Requests', '/leaderboard': 'Leaderboard',
  '/profile': 'Profile', '/admin': 'Admin Panel',
};

export default function Topbar({ onMenuClick }) {
  const { userProfile, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const pageTitle = pageTitles[location.pathname] || 'WorkforcePro';

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <header className="h-16 bg-surface-900 border-b border-white/5 flex items-center px-4 md:px-6 gap-4 flex-shrink-0 z-10">
      <button onClick={onMenuClick} className="lg:hidden text-white/50 hover:text-white p-1 -ml-1"><Menu size={22} /></button>
      <div className="flex-1">
        <h1 className="text-base md:text-lg font-semibold text-white">{pageTitle}</h1>
        <p className="text-xs text-white/30 hidden md:block">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative" ref={notifRef}>
          <button onClick={() => { setShowNotifs(!showNotifs); setShowUser(false); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
        </div>
        <div className="relative" ref={userRef}>
          <button onClick={() => { setShowUser(!showUser); setShowNotifs(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <Avatar src={userProfile?.photoURL} name={userProfile?.name} size="xs" />
            <span className="text-sm font-medium text-white hidden sm:block max-w-[100px] truncate">
              {userProfile?.name?.split(' ')[0]}
            </span>
            <ChevronDown size={14} className="text-white/40 hidden sm:block" />
          </button>
          {showUser && (
            <div className="absolute right-0 top-12 w-48 card border border-white/8 shadow-2xl shadow-black/40 py-1 z-50 animate-slide-up">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-sm font-medium text-white truncate">{userProfile?.name}</p>
                <p className="text-xs text-white/40 truncate">{userProfile?.email}</p>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut size={15} />Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}