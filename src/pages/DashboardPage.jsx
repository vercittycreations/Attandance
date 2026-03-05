import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck, UserX, Clock, CheckSquare } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { PageLoader } from '../components/common/LoadingSpinner';
import WeeklyAttendanceChart from '../components/dashboard/WeeklyAttendanceChart';
import ProductivityChart from '../components/dashboard/ProductivityChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import TopPerformers from '../components/dashboard/TopPerformers';
import { getAttendanceByDate } from '../services/attendanceService';
import { getAllEmployees } from '../services/employeeService';
import { getTodayCompletedTasks } from '../services/taskService';
import { format, subDays } from 'date-fns';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning'; if (h < 17) return 'afternoon'; return 'evening';
}

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, tasksCompleted: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [todayAttendance, allEmployees, completedTasks] = await Promise.all([
        getAttendanceByDate(today), getAllEmployees(), getTodayCompletedTasks()
      ]);
      const active = allEmployees.filter(e => e.isActive);
      const present = todayAttendance.filter(a => a.status === 'present').length;
      const late = todayAttendance.filter(a => a.status === 'late').length;
      setStats({ total: active.length, present: present + late, absent: Math.max(0, active.length - present - late), late, tasksCompleted: completedTasks.length });
      setEmployees(active);
      const weekly = await Promise.all(Array.from({ length: 7 }, (_, i) => {
        const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
        return getAttendanceByDate(d).then(att => ({
          day: format(subDays(new Date(), 6 - i), 'EEE'),
          present: att.filter(a => a.status === 'present').length,
          late: att.filter(a => a.status === 'late').length,
          absent: att.filter(a => a.status === 'absent').length,
        }));
      }));
      setWeeklyData(weekly);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">Good {getGreeting()}, {userProfile?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-sm text-white/40 mt-0.5">Here's what's happening with your team today.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard title="Total Employees" value={stats.total} icon={Users} color="brand" />
        <StatCard title="Present Today" value={stats.present} icon={UserCheck} color="emerald" />
        <StatCard title="Absent Today" value={stats.absent} icon={UserX} color="red" />
        <StatCard title="Late Arrivals" value={stats.late} icon={Clock} color="amber" />
        <StatCard title="Tasks Done" value={stats.tasksCompleted} icon={CheckSquare} color="violet" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><WeeklyAttendanceChart data={weeklyData} /></div>
        <TopPerformers employees={employees} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProductivityChart employees={employees} />
        <RecentActivity />
      </div>
    </div>
  );
}