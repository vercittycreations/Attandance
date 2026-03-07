import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck, UserX, Clock, CheckSquare } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import WeeklyAttendanceChart from '../components/dashboard/WeeklyAttendanceChart';
import ProductivityChart from '../components/dashboard/ProductivityChart';
import TopPerformers from '../components/dashboard/TopPerformers';
import ActivityTimeline from '../components/timeline/ActivityTimeline';
import FocusWidget from '../components/focus/FocusWidget';
import StreakBadge from '../components/streak/StreakBadge';
import AttendanceCalendar from '../components/calendar/AttendanceCalendar';
import { getAttendanceByDate } from '../services/attendanceService';
import { getAllEmployees } from '../services/employeeService';
import { getTodayCompletedTasks } from '../services/taskService';
import { calculateStreak } from '../services/streakService';
import { getEmployeeAttendance } from '../services/attendanceService';
import { format, subDays } from 'date-fns';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

// ✅ Cache key helper
const CACHE_KEY = (uid) => `dashboard_cache_${uid}`;

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState({
    total: 0, present: 0, absent: 0, late: 0, tasksCompleted: 0
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [myStreak, setMyStreak]     = useState(0);

  useEffect(() => {
    if (!userProfile?.uid) return;

    // ✅ Pehle cache dikhao — zero nahi dikhega
    try {
      const cached = sessionStorage.getItem(CACHE_KEY(userProfile.uid));
      if (cached) {
        const { stats, weeklyData, employees, myStreak } = JSON.parse(cached);
        setStats(stats);
        setWeeklyData(weeklyData);
        setEmployees(employees);
        setMyStreak(myStreak);
        setLoading(false); // ← cache se data aa gaya, loader hatao
      }
    } catch {}

    // Fresh data fetch karo background mein
    loadDashboard();
  }, [userProfile?.uid]);

  const loadDashboard = async () => {
    // Agar cache nahi hai tabhi loader dikhao
    const cached = sessionStorage.getItem(CACHE_KEY(userProfile.uid));
    if (!cached) setLoading(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [todayAtt, allEmployees, completedTasks, myAtt] = await Promise.all([
        getAttendanceByDate(today),
        getAllEmployees(),
        getTodayCompletedTasks(),
        getEmployeeAttendance(userProfile.uid, 60)
      ]);

      const active   = allEmployees.filter(e => e.isActive);
      const present  = todayAtt.filter(a => a.status === 'present').length;
      const late     = todayAtt.filter(a => a.status === 'late').length;
      const streak   = calculateStreak(myAtt);

      const newStats = {
        total:          active.length,
        present:        present + late,
        absent:         Math.max(0, active.length - present - late),
        late,
        tasksCompleted: completedTasks.length
      };

      const weekly = await Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
          return getAttendanceByDate(d).then(att => ({
            day:     format(subDays(new Date(), 6 - i), 'EEE'),
            present: att.filter(a => a.status === 'present').length,
            late:    att.filter(a => a.status === 'late').length,
            absent:  att.filter(a => a.status === 'absent').length,
          }));
        })
      );

      // ✅ State update
      setStats(newStats);
      setWeeklyData(weekly);
      setEmployees(active);
      setMyStreak(streak);

      // ✅ Cache save karo
      try {
        sessionStorage.setItem(CACHE_KEY(userProfile.uid), JSON.stringify({
          stats:      newStats,
          weeklyData: weekly,
          employees:  active,
          myStreak:   streak
        }));
      } catch {}

    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Welcome row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">
            Good {getGreeting()}, {userProfile?.name?.split(' ')[0]}! 👋
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-white/40">Here's your team today.</p>
            {myStreak > 0 && <StreakBadge streak={myStreak} size="sm" />}
          </div>
        </div>
        <FocusWidget compact />
      </div>

      {/* Stats — skeleton while loading */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-3 w-20 bg-white/5 rounded mb-3" />
              <div className="h-8 w-12 bg-white/5 rounded" />
            </div>
          ))
        ) : (
          <>
            <StatCard title="Total Employees" value={stats.total}          icon={Users}       color="brand"   />
            <StatCard title="Present Today"   value={stats.present}        icon={UserCheck}   color="emerald" />
            <StatCard title="Absent Today"    value={stats.absent}         icon={UserX}       color="red"     />
            <StatCard title="Late Arrivals"   value={stats.late}           icon={Clock}       color="amber"   />
            <StatCard title="Tasks Done"      value={stats.tasksCompleted} icon={CheckSquare} color="violet"  />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <WeeklyAttendanceChart data={weeklyData} />
        </div>
        <TopPerformers employees={employees} />
      </div>

      {/* Focus + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <FocusWidget />
          <ProductivityChart employees={employees} />
        </div>
        <div className="lg:col-span-2">
          <ActivityTimeline limit={15} />
        </div>
      </div>

      {/* Calendar */}
      <AttendanceCalendar />
    </div>
  );
}