import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Clock, CheckSquare, Calendar, Trophy, User, Shield, X, Zap } from 'lucide-react';
import Avatar from '../common/Avatar';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/attendance', icon: Clock, label: 'Attendance' },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
  { to: '/leave', icon: Calendar, label: 'Leave Requests' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar({ onClose }) {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="h-full bg-surface-900 border-r border-white/5 flex flex-col">
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">WorkforcePro</span>
        </div>
        <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white p-1"><X size={18} /></button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-1.5 text-xs font-semibold text-white/30 uppercase tracking-wider mb-1">Menu</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            <Icon size={18} className="flex-shrink-0" />{label}
          </NavLink>
        ))}
        {isAdmin && (
          <>
            <p className="px-3 py-1.5 text-xs font-semibold text-white/30 uppercase tracking-wider mt-4 mb-1">Admin</p>
            <NavLink to="/admin" onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
              <Shield size={18} className="flex-shrink-0" />Admin Panel
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-3 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-800">
          <Avatar src={userProfile?.photoURL} name={userProfile?.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userProfile?.name}</p>
            <p className="text-xs text-white/40 truncate capitalize">{userProfile?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}