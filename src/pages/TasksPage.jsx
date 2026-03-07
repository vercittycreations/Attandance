import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEmployeeTasks, updateTaskStatus } from '../services/taskService';
import { FocusWidget } from '../components/focus/FocusWidget';
import Modal from '../components/common/Modal';
import {
  CheckCircle2, Clock, PlayCircle,
  AlertCircle, ChevronRight, User, Calendar
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',      color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20'  },
  in_progress: { label: 'In Progress',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
  completed:   { label: 'Completed',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

const PRIORITY_CONFIG = {
  low:    { color: 'text-slate-400',  bg: 'bg-slate-500/10'  },
  medium: { color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  high:   { color: 'text-orange-400', bg: 'bg-orange-500/10' },
  urgent: { color: 'text-red-400',    bg: 'bg-red-500/10'    },
};

export default function TasksPage() {
  const { currentUser, userProfile } = useAuth();
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [updating, setUpdating]         = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    loadTasks();
  }, [currentUser]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await getEmployeeTasks(currentUser.uid);
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    setUpdating(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      setTasks(prev =>
        prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
      );
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(
        newStatus === 'in_progress' ? '▶️ Task started!'
        : newStatus === 'completed' ? '✅ Task completed!'
        : '↩️ Task reset to pending'
      );
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const counts = {
    total:       tasks.length,
    pending:     tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed:   tasks.filter(t => t.status === 'completed').length,
  };

  const filtered = filter === 'all'
    ? tasks
    : tasks.filter(t => t.status === filter);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">My Tasks</h2>
        <p className="text-xs text-white/40 mt-0.5">
          Tap any task to view details and update progress
        </p>
      </div>

      {/* Focus Widget */}
      <FocusWidget />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total',       value: counts.total,       color: 'text-white'         },
          { label: 'Pending',     value: counts.pending,     color: 'text-yellow-400'    },
          { label: 'In Progress', value: counts.in_progress, color: 'text-blue-400'      },
          { label: 'Completed',   value: counts.completed,   color: 'text-emerald-400'   },
        ].map(s => (
          <div
            key={s.label}
            onClick={() => setFilter(
              s.label === 'Total' ? 'all'
              : s.label === 'In Progress' ? 'in_progress'
              : s.label.toLowerCase()
            )}
            className={`card p-3 text-center cursor-pointer hover:border-white/10 transition-all ${
              filter === (
                s.label === 'Total' ? 'all'
                : s.label === 'In Progress' ? 'in_progress'
                : s.label.toLowerCase()
              ) ? 'border-brand-500/25 bg-brand-500/5' : ''
            }`}
          >
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/30 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-2/3 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="card p-14 text-center">
            <CheckCircle2 size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-sm font-medium text-white/30">
              {filter === 'all' ? 'No tasks assigned yet' : `No ${filter.replace('_', ' ')} tasks`}
            </p>
          </div>
        ) : filtered.map((task, idx) => {
          const isOverdue =
            task.deadline?.toDate &&
            isPast(task.deadline.toDate()) &&
            task.status !== 'completed';

          const sc = STATUS_CONFIG[task.status]    || STATUS_CONFIG.pending;
          const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

          return (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="card p-4 cursor-pointer hover:border-white/15 hover:bg-white/[0.02] active:scale-[0.99] transition-all animate-slide-up"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex items-center gap-3">
                {/* Status icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${sc.bg} ${sc.border} border`}>
                  {task.status === 'completed'   ? <CheckCircle2 size={14} className="text-emerald-400" /> :
                   task.status === 'in_progress' ? <PlayCircle   size={14} className="text-blue-400"    /> :
                                                   <Clock        size={14} className="text-yellow-400"  />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    task.status === 'completed' ? 'line-through text-white/40' : 'text-white'
                  }`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {task.deadline?.toDate && (
                      <span className={`text-xs flex items-center gap-1 ${
                        isOverdue ? 'text-red-400' : 'text-white/30'
                      }`}>
                        {isOverdue && <AlertCircle size={10} />}
                        {format(task.deadline.toDate(), 'MMM d')}
                      </span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${pc.bg} ${pc.color} capitalize`}>
                      {task.priority}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight size={14} className="text-white/20 flex-shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Task Detail Popup ─── */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Task Details"
      >
        {selectedTask && (() => {
          const sc = STATUS_CONFIG[selectedTask.status]    || STATUS_CONFIG.pending;
          const pc = PRIORITY_CONFIG[selectedTask.priority] || PRIORITY_CONFIG.medium;
          const isOverdue =
            selectedTask.deadline?.toDate &&
            isPast(selectedTask.deadline.toDate()) &&
            selectedTask.status !== 'completed';

          return (
            <div className="space-y-5">

              {/* Title + Description */}
              <div>
                <h3 className={`text-base font-semibold leading-snug ${
                  selectedTask.status === 'completed'
                    ? 'line-through text-white/50'
                    : 'text-white'
                }`}>
                  {selectedTask.title}
                </h3>
                {selectedTask.description && (
                  <p className="text-sm text-white/55 mt-2 leading-relaxed">
                    {selectedTask.description}
                  </p>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-xs text-white/30 mb-1">Status</p>
                  <span className={`text-sm font-semibold ${sc.color}`}>
                    {sc.label}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-xs text-white/30 mb-1">Priority</p>
                  <span className={`text-sm font-semibold capitalize ${pc.color}`}>
                    {selectedTask.priority}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border col-span-2 ${
                  isOverdue
                    ? 'bg-red-500/5 border-red-500/15'
                    : 'bg-white/[0.03] border-white/5'
                }`}>
                  <p className="text-xs text-white/30 mb-1 flex items-center gap-1">
                    <Calendar size={10} /> Deadline
                  </p>
                  <div className="flex items-center gap-1.5">
                    {isOverdue && <AlertCircle size={12} className="text-red-400" />}
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                      {selectedTask.deadline?.toDate
                        ? format(selectedTask.deadline.toDate(), 'EEEE, MMM d, yyyy')
                        : 'No deadline'}
                    </p>
                    {isOverdue && (
                      <span className="text-xs text-red-400 font-semibold">— Overdue!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <p className="text-xs text-white/30 uppercase tracking-wider">Update Progress</p>

                {selectedTask.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(selectedTask, 'in_progress')}
                    disabled={updating}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-40"
                  >
                    {updating
                      ? <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                      : <PlayCircle size={18} />
                    }
                    <span className="text-sm font-medium">Start Working on This</span>
                  </button>
                )}

                {selectedTask.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange(selectedTask, 'completed')}
                    disabled={updating}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-40"
                  >
                    {updating
                      ? <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                      : <CheckCircle2 size={18} />
                    }
                    <span className="text-sm font-medium">Mark as Completed ✅</span>
                  </button>
                )}

                {selectedTask.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(selectedTask, 'completed')}
                    disabled={updating}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-40"
                  >
                    {updating
                      ? <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                      : <CheckCircle2 size={18} />
                    }
                    <span className="text-sm font-medium">Mark as Completed ✅</span>
                  </button>
                )}

                {selectedTask.status === 'completed' && (
                  <div className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">
                      Task Completed! 🎉
                    </span>
                  </div>
                )}

                {selectedTask.status !== 'pending' && (
                  <button
                    onClick={() => handleStatusChange(selectedTask, 'pending')}
                    disabled={updating}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-white/30 hover:text-white/50 hover:bg-white/5 transition-all active:scale-[0.98] disabled:opacity-40"
                  >
                    <Clock size={16} />
                    <span className="text-sm">Reset to Pending</span>
                  </button>
                )}
              </div>

            </div>
          );
        })()}
      </Modal>

    </div>
  );
}