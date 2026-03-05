import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Clock, CheckSquare, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
const typeMap = {
  task_assigned: { icon: CheckSquare, color: 'text-brand-400', bg: 'bg-brand-500/10' },
  leave_approved: { icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  leave_rejected: { icon: Calendar, color: 'text-red-400', bg: 'bg-red-500/10' },
  deadline_approaching: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};
export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(8));
    const unsub = onSnapshot(q, snap => { setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return unsub;
  }, []);
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.length === 0 ? <p className="text-sm text-white/30 text-center py-8">No recent activity</p>
          : activities.map(a => {
          const cfg = typeMap[a.type] || typeMap.task_assigned;
          const Icon = cfg.icon;
          return (
            <div key={a.id} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon size={13} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{a.title}</p>
                <p className="text-xs text-white/30 mt-0.5">
                  {a.createdAt?.toDate ? formatDistanceToNow(a.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}