import { useEffect, useState } from 'react';
import { getAllEmployees, calculateProductivityScore } from '../services/employeeService';
import { getAllAttendance } from '../services/attendanceService';
import { getAllTasks } from '../services/taskService';
import { Trophy, TrendingUp } from 'lucide-react';
import Avatar from '../components/common/Avatar';
import { PageLoader } from '../components/common/LoadingSpinner';

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [ranked, setRanked] = useState([]);

  useEffect(() => { loadLeaderboard(); }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const [employees, attendance, tasks] = await Promise.all([getAllEmployees(), getAllAttendance(), getAllTasks()]);
    const scored = employees.filter(e => e.isActive).map(emp => {
      const empAttendance = attendance.filter(a => a.employeeId === emp.uid || a.employeeId === emp.id);
      const empTasks = tasks.filter(t => t.assignedTo === emp.uid || t.assignedTo === emp.id);
      const score = calculateProductivityScore(empAttendance, empTasks);
      return { ...emp, score, completedTasks: empTasks.filter(t => t.status === 'completed').length };
    }).sort((a, b) => b.score - a.score);
    setRanked(scored); setLoading(false);
  };

  if (loading) return <PageLoader />;
  const top3 = ranked.slice(0, 3);
  const medalColors = [
    { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '🥇' },
    { bg: 'bg-slate-500/15', border: 'border-slate-500/30', text: 'text-slate-400', icon: '🥈' },
    { bg: 'bg-amber-600/15', border: 'border-amber-600/30', text: 'text-amber-600', icon: '🥉' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2"><Trophy size={24} className="text-yellow-400" /><h2 className="text-xl font-bold text-white">Productivity Leaderboard</h2></div>
        <p className="text-sm text-white/40">Ranked by attendance, punctuality & tasks completed</p>
      </div>
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3 items-end">
          {top3[1] ? (
            <div className={`card p-4 text-center border ${medalColors[1].border} ${medalColors[1].bg} order-1`}>
              <span className="text-2xl block mb-2">{medalColors[1].icon}</span>
              <Avatar src={top3[1].photoURL} name={top3[1].name} size="lg" className="mx-auto mb-2" />
              <p className="text-sm font-semibold text-white truncate">{top3[1].name.split(' ')[0]}</p>
              <p className="text-xs text-white/40 truncate mb-2">{top3[1].department}</p>
              <p className={`text-lg font-bold font-mono ${medalColors[1].text}`}>{top3[1].score}</p>
            </div>
          ) : <div />}
          {top3[0] && (
            <div className={`card p-5 text-center border ${medalColors[0].border} ${medalColors[0].bg} order-2 -mt-4`}>
              <span className="text-3xl block mb-2">{medalColors[0].icon}</span>
              <Avatar src={top3[0].photoURL} name={top3[0].name} size="xl" className="mx-auto mb-3 ring-4 ring-yellow-500/30" />
              <p className="text-sm font-bold text-white truncate">{top3[0].name.split(' ')[0]}</p>
              <p className="text-xs text-white/40 truncate mb-2">{top3[0].department}</p>
              <p className={`text-2xl font-bold font-mono ${medalColors[0].text}`}>{top3[0].score}</p>
              <p className="text-xs text-white/30 mt-1">{top3[0].completedTasks} tasks done</p>
            </div>
          )}
          {top3[2] ? (
            <div className={`card p-4 text-center border ${medalColors[2].border} ${medalColors[2].bg} order-3`}>
              <span className="text-2xl block mb-2">{medalColors[2].icon}</span>
              <Avatar src={top3[2].photoURL} name={top3[2].name} size="lg" className="mx-auto mb-2" />
              <p className="text-sm font-semibold text-white truncate">{top3[2].name.split(' ')[0]}</p>
              <p className="text-xs text-white/40 truncate mb-2">{top3[2].department}</p>
              <p className={`text-lg font-bold font-mono ${medalColors[2].text}`}>{top3[2].score}</p>
            </div>
          ) : <div />}
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5"><h3 className="text-sm font-semibold text-white">All Rankings</h3></div>
        <div>
          {ranked.map((emp, idx) => (
            <div key={emp.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/3 hover:bg-white/2 transition-colors last:border-0">
              <span className={`w-6 text-sm font-bold text-center ${idx < 3 ? 'text-yellow-400' : 'text-white/20'}`}>{idx + 1}</span>
              <Avatar src={emp.photoURL} name={emp.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{emp.name}</p>
                <p className="text-xs text-white/30 truncate">{emp.department}</p>
              </div>
              <div className="text-right hidden sm:block"><p className="text-xs text-white/30">{emp.completedTasks} tasks</p></div>
              <div className="flex items-center gap-2 min-w-[100px]">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${emp.score}%` }} />
                </div>
                <span className="text-sm font-bold text-white font-mono w-8 text-right">{emp.score}</span>
              </div>
            </div>
          ))}
          {ranked.length === 0 && <div className="py-12 text-center"><TrendingUp size={32} className="text-white/10 mx-auto mb-3" /><p className="text-sm text-white/30">No employees found</p></div>}
        </div>
      </div>
    </div>
  );
}