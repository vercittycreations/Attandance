import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateEmployeeProfile } from '../services/authService';
import { getEmployeeAttendance } from '../services/attendanceService';
import { getTodayFocusTime, getEmployeeFocusSessions } from '../services/focusService';
import { calculateStreak } from '../services/streakService';
import Avatar from '../components/common/Avatar';
import StreakBadge from '../components/streak/StreakBadge';
import { Save, User, Mail, Building2, Briefcase, Brain, Flame } from 'lucide-react';
import toast from 'react-hot-toast';

const departments = ['Engineering','Design','Marketing','HR','Sales','Finance','Operations','General'];

export default function ProfilePage() {
  const { userProfile, currentUser, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: userProfile?.name || '',
    department: userProfile?.department || 'General',
  });
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);
  const [todayFocus, setTodayFocus] = useState(0);
  const [totalFocusSessions, setTotalFocusSessions] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [att, todayMins, sessions] = await Promise.all([
      getEmployeeAttendance(currentUser.uid, 60),
      getTodayFocusTime(currentUser.uid),
      getEmployeeFocusSessions(currentUser.uid)
    ]);
    setStreak(calculateStreak(att));
    setTodayFocus(todayMins);
    setTotalFocusSessions(sessions.length);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      await updateEmployeeProfile(currentUser.uid, form);
      await refreshProfile();
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const formatFocus = (mins) => {
    if (!mins) return '0m';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Profile Header */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-white mb-5">Your Profile</h3>
        <div className="flex items-center gap-4 sm:gap-5">
          <Avatar name={userProfile?.name} size="xl" />
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-white truncate">{userProfile?.name}</p>
            <p className="text-xs text-white/40 mt-0.5 capitalize">
              {userProfile?.role} • {userProfile?.department}
            </p>
            <p className="text-xs text-white/30 mt-0.5 truncate">{userProfile?.email}</p>
            {streak > 0 && <div className="mt-2"><StreakBadge streak={streak} /></div>}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand-400">{userProfile?.productivityScore || 0}</p>
          <p className="text-xs text-white/40 mt-0.5">Productivity</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{streak}</p>
          <p className="text-xs text-white/40 mt-0.5">Day Streak 🔥</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{formatFocus(todayFocus)}</p>
          <p className="text-xs text-white/40 mt-0.5">Focus Today</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{totalFocusSessions}</p>
          <p className="text-xs text-white/40 mt-0.5">Focus Sessions</p>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-white mb-5">Personal Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              <User size={11} className="inline mr-1" />Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              <Mail size={11} className="inline mr-1" />Email
            </label>
            <input type="email" value={userProfile?.email || ''} disabled className="input opacity-50 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              <Building2 size={11} className="inline mr-1" />Department
            </label>
            <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="input">
              {departments.map(d => <option key={d} value={d} className="bg-surface-800">{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              <Briefcase size={11} className="inline mr-1" />Role
            </label>
            <input type="text" value={userProfile?.role || ''} disabled className="input opacity-50 cursor-not-allowed capitalize" />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary mt-5 flex items-center gap-2">
          <Save size={15} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}