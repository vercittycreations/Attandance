import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateEmployeeProfile } from '../services/authService';
import Avatar from '../components/common/Avatar';
import { Save, User, Mail, Building2, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const departments = ['Engineering','Design','Marketing','HR','Sales','Finance','Operations','General'];

export default function ProfilePage() {
  const { userProfile, currentUser, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: userProfile?.name || '',
    department: userProfile?.department || 'General',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      await updateEmployeeProfile(currentUser.uid, form);
      await refreshProfile();
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

      {/* Profile Header */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-white mb-5">Your Profile</h3>
        <div className="flex items-center gap-5">
          <Avatar name={userProfile?.name} size="xl" />
          <div>
            <p className="text-lg font-bold text-white">{userProfile?.name}</p>
            <p className="text-xs text-white/40 mt-0.5 capitalize">
              {userProfile?.role} • {userProfile?.department}
            </p>
            <p className="text-xs text-white/30 mt-1">{userProfile?.email}</p>
          </div>
        </div>
      </div>

      {/* Edit Info */}
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
            <input
              type="email"
              value={userProfile?.email || ''}
              disabled
              className="input opacity-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              <Building2 size={11} className="inline mr-1" />Department
            </label>
            <select
              value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              className="input"
            >
              {departments.map(d => (
                <option key={d} value={d} className="bg-surface-800">{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              <Briefcase size={11} className="inline mr-1" />Role
            </label>
            <input
              type="text"
              value={userProfile?.role || ''}
              disabled
              className="input opacity-50 cursor-not-allowed capitalize"
            />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary mt-5 flex items-center gap-2">
          <Save size={15} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Stats */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Performance Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/3 rounded-xl p-4">
            <p className="text-2xl font-bold text-brand-400">{userProfile?.productivityScore || 0}</p>
            <p className="text-xs text-white/40 mt-0.5">Productivity Score</p>
          </div>
          <div className="bg-white/3 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-400 capitalize">{userProfile?.role || '—'}</p>
            <p className="text-xs text-white/40 mt-0.5">Account Role</p>
          </div>
        </div>
      </div>
    </div>
  );
}