import { useNotifications } from '../../context/NotificationContext';
import { Bell, CheckCheck, Zap, Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeIcons = {
  task_assigned: { icon: Zap, color: 'text-brand-400', bg: 'bg-brand-500/10' },
  leave_approved: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  leave_rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  deadline_approaching: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

export default function NotificationPanel({ onClose }) {
  const { notifications, markAsRead, markAllRead } = useNotifications();
  return (
    <div className="absolute right-0 top-12 w-80 card border border-white/8 shadow-2xl shadow-black/40 z-50 animate-slide-up overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-white/50" />
          <span className="text-sm font-semibold text-white">Notifications</span>
          <span className="text-xs text-white/30">({notifications.length})</span>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllRead} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
            <CheckCheck size={13} />Mark all read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Bell size={28} className="text-white/10" />
            <p className="text-sm text-white/30">No notifications</p>
          </div>
        ) : notifications.slice(0, 20).map(n => {
          const cfg = typeIcons[n.type] || typeIcons.task_assigned;
          const Icon = cfg.icon;
          return (
            <button key={n.id} onClick={() => markAsRead(n.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/3 last:border-0 ${!n.isRead ? 'bg-brand-500/3' : ''}`}>
              <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon size={14} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${n.isRead ? 'text-white/60' : 'text-white'}`}>{n.title}</p>
                <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-white/20 mt-1">
                  {n.createdAt?.toDate ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                </p>
              </div>
              {!n.isRead && <div className="w-2 h-2 bg-brand-500 rounded-full mt-2 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}