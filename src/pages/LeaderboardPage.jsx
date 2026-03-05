import { useEffect, useState } from 'react';
import { getAllEmployees } from '../services/employeeService';
import { getAllAttendance } from '../services/attendanceService';
import { getAllTasks } from '../services/taskService';
import { getAllFocusSessions } from '../services/focusService';
import { calculateStreak } from '../services/streakService';
import { Trophy, TrendingUp, Brain, Flame } from 'lucide-react';
import Avatar from '../components/common/Avatar';
import StreakBadge from '../components/streak/StreakBadge';
import OnlineBadge from '../components/presence/OnlineBadge';
import { PageLoader } from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

// Score formula:
// Attendance (present=10pts, late=5pts) max 40pts
// Tasks completed (3pts each) max 30pts
// Streak bonus (1pt per day) max 15pts
// Focus time (1pt per 30min) max 15pts
function computeScore(attendance, tasks, streak, focusMinutes) {
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const attendanceScore = Math.min((presentCount * 10) + (lateCount * 5), 40);
  const taskScore = Math.min(completedCount * 3, 30);
  const streakScore = Math.min(streak, 15);
  const focusScore = Math.min(Math.floor(focusMinutes / 30), 15);

  return attendanceScore + taskScore + streakScore + focusScore;
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [ranked, setRanked] = useState([]);

  useEffect(() => { loadLeaderboard(); }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const [employees, attendance, tasks, focusSessions] = await Promise.all([
      getAllEmployees(),
      getAllAttendance(),
      getAllTasks(),
      getAllFocusSessions()
    ]);

    const scored = employees.filter(e => e.isActive).map(emp => {
      const uid = emp.uid || emp.id;
      const empAtt = attendance.filter(a => a.employeeId === uid);
      const empTasks = tasks.filter(t => t.assignedTo === uid);
      const empFocus = focusSessions.filter(f => f.employeeId === uid);
      const streak = calculateStreak(empAtt);
      const focusMinutes = empFocus.reduce((acc, f) => acc + (f.focusDuration || 0), 0);
      const score = computeScore(empAtt, empTasks, streak, focusMinutes);

      return {
        ...emp,
        score,
        streak,
        focusMinutes,
        completedTasks: empTasks.filter(t => t.status === 'completed').length,
        presentDays: empAtt.filter(a => a.status === 'present').length,
      };
    }).sort((a, b) => b.score - a.score);

    setRanked(scored);
    setLoading(false);
  };

  if (loading) return <PageLoader />;

  const top3 = ranked.slice(0, 3);
  const medalColors = [
    { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '🥇' },
    { bg: 'bg-slate-500/15',  border: 'border-slate-500/30',  text: 'text-slate-400',  icon: '🥈' },
    { bg: 'bg-amber-600/15',  border: 'border-amber-600/30',  text: 'text-amber-600',  icon: '🥉' },
  ];

  const formatFocus = (mins) => {
    if (!mins) return '0m';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy size={24} className="text-yellow-400" />
          <h2 className="text-xl font-bold text-white">Productivity Leaderboard</h2>
        </div>
        <p className="text-sm text-white/40">Score = Attendance + Tasks + Streak + Focus Time</p>
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
          {/* 2nd */}
          {top3[1] ? (
            <div className={`card p-3 sm:p-4 text-center border ${medalColors[1].border} ${medalColors[1].bg} order-1`}>
              <span className="text-xl sm:text-2xl block mb-1.5">{medalColors[1].icon}</span>
              <div className="relative inline-block mb-2">
                <Avatar name={top3[1].name} size="lg" className="mx-auto" />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <OnlineBadge isOnline={top3[1].isOnline} lastSeen={top3[1].lastSeen} />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white truncate">{top3[1].name.split(' ')[0]}</p>
              {top3[1].streak > 0 && <StreakBadge streak={top3[1].streak} size="sm" />}
              <p className={`text-lg font-bold font-mono mt-1 ${medalColors[1].text}`}>{top3[1].score}</p>
            </div>
          ) : <div />}

          {/* 1st */}
          {top3[0] && (
            <div className={`card p-4 sm:p-5 text-center border ${medalColors[0].border} ${medalColors[0].bg} order-2 -mt-4`}>
              <span className="text-2xl sm:text-3xl block mb-2">{medalColors[0].icon}</span>
              <div className="relative inline-block mb-2">
                <Avatar name={top3[0].name} size="xl" className="mx-auto ring-4 ring-yellow-500/30" />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <OnlineBadge isOnline={top3[0].isOnline} lastSeen={top3[0].lastSeen} />
                </div>
              </div>
              <p className="text-sm font-bold text-white truncate">{top3[0].name.split(' ')[0]}</p>
              {top3[0].streak > 0 && <StreakBadge streak={top3[0].streak} size="sm" />}
              <p className={`text-2xl font-bold font-mono mt-1 ${medalColors[0].text}`}>{top3[0].score}</p>
              <p className="text-xs text-white/30 mt-1">{top3[0].completedTasks} tasks done</p>
            </div>
          )}

          {/* 3rd */}
          {top3[2] ? (
            <div className={`card p-3 sm:p-4 text-center border ${medalColors[2].border} ${medalColors[2].bg} order-3`}>
              <span className="text-xl sm:text-2xl block mb-1.5">{medalColors[2].icon}</span>
              <div className="relative inline-block mb-2">
                <Avatar name={top3[2].name} size="lg" className="mx-auto" />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <OnlineBadge isOnline={top3[2].isOnline} lastSeen={top3[2].lastSeen} />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white truncate">{top3[2].name.split(' ')[0]}</p>
              {top3[2].streak > 0 && <StreakBadge streak={top3[2].streak} size="sm" />}
              <p className={`text-lg font-bold font-mono mt-1 ${medalColors[2].text}`}>{top3[2].score}</p>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Full Rankings Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">All Rankings</h3>
          <p className="text-xs text-white/30">{ranked.length} employees</p>
        </div>
        <div>
          {ranked.map((emp, idx) => (
            <div key={emp.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-white/3 hover:bg-white/2 transition-colors last:border-0">
              <span className={`w-5 sm:w-6 text-sm font-bold text-center flex-shrink-0 ${idx < 3 ? 'text-yellow-400' : 'text-white/20'}`}>
                {idx + 1}
              </span>
              <div className="relative flex-shrink-0">
                <Avatar name={emp.name} size="sm" />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <OnlineBadge isOnline={emp.isOnline} lastSeen={emp.lastSeen} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{emp.name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-white/30 truncate">{emp.department}</p>
                  {emp.streak > 0 && <StreakBadge streak={emp.streak} size="sm" />}
                </div>
              </div>
              {/* Stats - hidden on tiny screens */}
              <div className="hidden sm:flex items-center gap-3 text-xs text-white/30">
                <span title="Tasks">{emp.completedTasks} tasks</span>
                <span title="Focus"><Brain size={10} className="inline mr-0.5" />{formatFocus(emp.focusMinutes)}</span>
              </div>
              {/* Score bar */}
              <div className="flex items-center gap-2 min-w-[80px] sm:min-w-[100px]">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(emp.score, 100)}%` }} />
                </div>
                <span className="text-sm font-bold text-white font-mono w-7 sm:w-8 text-right">{emp.score}</span>
              </div>
            </div>
          ))}
          {ranked.length === 0 && (
            <div className="py-12 text-center">
              <TrendingUp size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">No employees found</p>
            </div>
          )}
        </div>
      </div>

      {/* Score legend */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Score Breakdown</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Attendance', desc: 'Present=10, Late=5', max: '40pts', color: 'text-emerald-400' },
            { label: 'Tasks',      desc: '3pts per task',       max: '30pts', color: 'text-brand-400' },
            { label: 'Streak',     desc: '1pt per day',         max: '15pts', color: 'text-orange-400' },
            { label: 'Focus Time', desc: '1pt per 30min',       max: '15pts', color: 'text-violet-400' },
          ].map(({ label, desc, max, color }) => (
            <div key={label} className="bg-white/3 rounded-xl p-3">
              <p className={`text-xs font-semibold ${color}`}>{label}</p>
              <p className="text-xs text-white/30 mt-0.5">{desc}</p>
              <p className="text-xs text-white/50 mt-1 font-mono">max {max}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}