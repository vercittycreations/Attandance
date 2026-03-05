import { useEffect, useState } from 'react';
import { subscribeToActivityFeed } from '../../services/activityService';
import { formatDistanceToNow } from 'date-fns';
import {
  LogIn, LogOut, CheckSquare, Calendar,
  Brain, CheckCircle2, Activity
} from 'lucide-react';

const typeConfig = {
  check_in:       { icon: LogIn,       color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Checked In' },
  check_out:      { icon: LogOut,      color: 'text-blue-400',    bg: 'bg-blue-500/10',    label: 'Checked Out' },
  task_assigned:  { icon: CheckSquare, color: 'text-brand-400',   bg: 'bg-brand-500/10',   label: 'Task Assigned' },
  task_completed: { icon: CheckCircle2,color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Task Done' },
  leave_requested:{ icon: Calendar,    color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Leave Request' },
  focus_start:    { icon: Brain,       color: 'text-violet-400',  bg: 'bg-violet-500/10',  label: 'Focus Started' },
  focus_stop:     { icon: Brain,       color: 'text-violet-400',  bg: 'bg-violet-500/10',  label: 'Focus Ended' },
};

export default function ActivityTimeline({ limit = 10 }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const unsub = subscribeToActivityFeed(setActivities, limit);
    return unsub;
  }, [limit]);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-brand-400" />
        <h3 className="text-sm font-semibold text-white">Activity Timeline</h3>
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
        {activities.length === 0 ? (
          <div className="py-10 text-center">
            <Activity size={28} className="text-white/10 mx-auto mb-2" />
            <p className="text-sm text-white/30">No activity yet</p>
          </div>
        ) : activities.map((a, i) => {
          const cfg = typeConfig[a.type] || typeConfig.check_in;
          const Icon = cfg.icon;
          return (
            <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-white/3 last:border-0">
              {/* Timeline line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                  <Icon size={13} className={cfg.color} />
                </div>
                {i < activities.length - 1 && (
                  <div className="w-px h-3 bg-white/5 mt-1" />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm text-white/80 leading-snug">{a.message}</p>
                <p className="text-xs text-white/25 mt-0.5">
                  {a.createdAt?.toDate
                    ? formatDistanceToNow(a.createdAt.toDate(), { addSuffix: true })
                    : 'Just now'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}