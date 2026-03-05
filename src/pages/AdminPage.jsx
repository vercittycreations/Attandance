import { useState } from 'react';
import { Users, CheckSquare, Calendar, Clock, Settings } from 'lucide-react';
import AdminEmployees from '../components/admin/AdminEmployees';
import AdminTasks from '../components/admin/AdminTasks';
import AdminLeaves from '../components/admin/AdminLeaves';
import AdminAttendance from '../components/admin/AdminAttendance';
import AdminSettings from '../components/admin/AdminSettings';

const tabs = [
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'leaves', label: 'Leave Requests', icon: Calendar },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('employees');
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex gap-1 p-1 bg-surface-900 rounded-xl border border-white/5 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === id ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <Icon size={15} /><span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
      <div>
        {activeTab === 'employees' && <AdminEmployees />}
        {activeTab === 'tasks' && <AdminTasks />}
        {activeTab === 'leaves' && <AdminLeaves />}
        {activeTab === 'attendance' && <AdminAttendance />}
        {activeTab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}