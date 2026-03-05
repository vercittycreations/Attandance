import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEmployeeTasks, updateTaskStatus } from '../services/taskService';
import { CheckSquare, Clock, AlertCircle, Circle, PlayCircle, CheckCircle2 } from 'lucide-react';
import { PageLoader } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';

const statusIcons = { pending: Circle, in_progress: PlayCircle, completed: CheckCircle2 };
const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function TasksPage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  useEffect(() => { if (userProfile) loadTasks(); }, [userProfile]);

  const loadTasks = async () => {
    setLoading(true);
    const data = await getEmployeeTasks(userProfile.uid);
    setTasks(data.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)));
    setLoading(false);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdating(taskId);
    try {
      await updateTaskStatus(taskId, newStatus);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toast.success(`Task marked as ${newStatus.replace('_', ' ')}`);
    } catch { toast.error('Failed to update task'); } finally { setUpdating(null); }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const counts = { all: tasks.length, pending: tasks.filter(t => t.status === 'pending').length, in_progress: tasks.filter(t => t.status === 'in_progress').length, completed: tasks.filter(t => t.status === 'completed').length };

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ key: 'all', label: 'Total Tasks', color: 'text-white' }, { key: 'pending', label: 'Pending', color: 'text-amber-400' }, { key: 'in_progress', label: 'In Progress', color: 'text-blue-400' }, { key: 'completed', label: 'Completed', color: 'text-emerald-400' }].map(({ key, label, color }) => (
          <button key={key} onClick={() => setFilter(key)} className={`card p-4 text-left transition-all ${filter === key ? 'border-brand-500/30 bg-brand-500/5' : 'hover:border-white/10'}`}>
            <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-12 text-center"><CheckSquare size={32} className="text-white/10 mx-auto mb-3" /><p className="text-sm text-white/30">No tasks found</p></div>
        ) : filtered.map(task => {
          const Icon = statusIcons[task.status] || Circle;
          const isOverdue = task.deadline?.toDate && isPast(task.deadline.toDate()) && task.status !== 'completed';
          return (
            <div key={task.id} className="card p-5 hover:border-white/10 transition-all">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  <Icon size={20} className={`${task.status === 'completed' ? 'text-emerald-400' : task.status === 'in_progress' ? 'text-blue-400' : 'text-white/30'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h3 className={`text-sm font-semibold ${task.status === 'completed' ? 'text-white/40 line-through' : 'text-white'}`}>{task.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {task.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{task.description}</p>}
                  {task.deadline?.toDate && (
                    <div className={`flex items-center gap-1.5 mt-3 text-xs ${isOverdue ? 'text-red-400' : 'text-white/30'}`}>
                      {isOverdue && <AlertCircle size={12} />}<Clock size={12} />
                      <span>{format(task.deadline.toDate(), 'MMM d, yyyy')}</span>
                      {isOverdue && <span className="font-semibold">Overdue!</span>}
                    </div>
                  )}
                  {task.status !== 'completed' && (
                    <div className="flex items-center gap-2 mt-3">
                      {task.status === 'pending' && (
                        <button onClick={() => handleStatusChange(task.id, 'in_progress')} disabled={updating === task.id} className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">Start Progress</button>
                      )}
                      <button onClick={() => handleStatusChange(task.id, 'completed')} disabled={updating === task.id} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">Mark Complete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}