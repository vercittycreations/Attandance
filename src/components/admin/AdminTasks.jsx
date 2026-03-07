import { useEffect, useState } from 'react';
import { getAllTasks, createTask, deleteTask, updateTaskStatus } from '../../services/taskService';
import { getAllEmployees } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { sendPushToUser } from '../../services/pushService';
import Modal from '../common/Modal';
import { PageLoader } from '../common/LoadingSpinner';
import {
  Plus, Search, Trash2, AlertCircle,
  Clock, CheckCircle2, PlayCircle, ChevronRight, User
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const priorities = ['low', 'medium', 'high', 'urgent'];
const emptyForm = {
  title: '', description: '', priority: 'medium',
  deadline: '', assignedTo: ''
};

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  in_progress: { label: 'In Progress', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
  completed:   { label: 'Completed',   color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20'},
};

const PRIORITY_CONFIG = {
  low:    { color: 'text-slate-400',  bg: 'bg-slate-500/10'  },
  medium: { color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  high:   { color: 'text-orange-400', bg: 'bg-orange-500/10' },
  urgent: { color: 'text-red-400',    bg: 'bg-red-500/10'    },
};

export default function AdminTasks() {
  const { currentUser } = useAuth();
  const { createNotification } = useNotifications();
  const [tasks, setTasks]           = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd]       = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // ← task detail popup
  const [form, setForm]             = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating]     = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [t, e] = await Promise.all([getAllTasks(), getAllEmployees()]);
    setTasks(t);
    setEmployees(e.filter(emp => emp.isActive));
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !form.assignedTo || !form.deadline)
      return toast.error('Fill all required fields');

    setSubmitting(true);
    try {
      const emp = employees.find(e => e.uid === form.assignedTo || e.id === form.assignedTo);
      const { Timestamp } = await import('firebase/firestore');

      await createTask({
        ...form,
        assignedToName: emp?.name || '',
        assignedBy:     currentUser.uid,
        deadline:       Timestamp.fromDate(new Date(form.deadline))
      });

      sendPushToUser(
        form.assignedTo,
        '✅ New Task Assigned',
        `You have a new task: "${form.title}"`,
        '/tasks'
      ).catch(() => {});

      await createNotification(
        form.assignedTo,
        'New Task Assigned',
        `You have been assigned: "${form.title}"`,
        'task_assigned'
      );

      toast.success('✅ Task created & employee notified!');
      setShowAdd(false);
      setForm(emptyForm);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
      setSelectedTask(null);
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    setUpdating(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      // Update selected task in popup too
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
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

  const filtered = tasks.filter(t => {
    const matchSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedToName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">

      {/* Filters + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks or employee..."
            className="input pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input sm:w-44"
        >
          {['all', 'pending', 'in_progress', 'completed'].map(s => (
            <option key={s} value={s} className="bg-surface-800 capitalize">
              {s === 'all' ? 'All Status' : s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"
        >
          <Plus size={16} /> Assign Task
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-sm text-white/30">No tasks found</p>
          </div>
        ) : filtered.map(task => {
          const isOverdue =
            task.deadline?.toDate &&
            isPast(task.deadline.toDate()) &&
            task.status !== 'completed';

          const sc = STATUS_CONFIG[task.status]   || STATUS_CONFIG.pending;
          const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

          return (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="card p-4 flex items-center gap-3 cursor-pointer hover:border-white/15 hover:bg-white/[0.02] active:scale-[0.99] transition-all"
            >
              {/* Status dot */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                task.status === 'completed'  ? 'bg-emerald-400' :
                task.status === 'in_progress'? 'bg-blue-400' :
                isOverdue                    ? 'bg-red-400' : 'bg-yellow-400'
              }`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-white/35 truncate">
                    → {task.assignedToName}
                  </span>
                  {isOverdue && (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={10} /> Overdue
                    </span>
                  )}
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${pc.bg} ${pc.color}`}>
                  {task.priority}
                </span>
                <ChevronRight size={14} className="text-white/20" />
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
          const sc = STATUS_CONFIG[selectedTask.status] || STATUS_CONFIG.pending;
          const pc = PRIORITY_CONFIG[selectedTask.priority] || PRIORITY_CONFIG.medium;
          const isOverdue =
            selectedTask.deadline?.toDate &&
            isPast(selectedTask.deadline.toDate()) &&
            selectedTask.status !== 'completed';

          return (
            <div className="space-y-5">

              {/* Title */}
              <div>
                <h3 className="text-base font-semibold text-white leading-snug">
                  {selectedTask.title}
                </h3>
                {selectedTask.description && (
                  <p className="text-sm text-white/55 mt-2 leading-relaxed">
                    {selectedTask.description}
                  </p>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-xs text-white/30 mb-1">Assigned To</p>
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-white/40" />
                    <p className="text-sm font-medium text-white truncate">
                      {selectedTask.assignedToName || '—'}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-xs text-white/30 mb-1">Priority</p>
                  <span className={`text-sm font-semibold capitalize ${pc.color}`}>
                    {selectedTask.priority}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-xs text-white/30 mb-1">Status</p>
                  <span className={`text-sm font-semibold ${sc.color}`}>
                    {sc.label}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isOverdue
                    ? 'bg-red-500/5 border-red-500/15'
                    : 'bg-white/[0.03] border-white/5'
                }`}>
                  <p className="text-xs text-white/30 mb-1">Deadline</p>
                  <div className="flex items-center gap-1">
                    {isOverdue && <AlertCircle size={11} className="text-red-400" />}
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                      {selectedTask.deadline?.toDate
                        ? format(selectedTask.deadline.toDate(), 'MMM d, yyyy')
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-2">
                <p className="text-xs text-white/30 uppercase tracking-wider">Update Status</p>
                <div className="flex flex-col gap-2">

                  {selectedTask.status !== 'in_progress' && selectedTask.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(selectedTask, 'in_progress')}
                      disabled={updating}
                      className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-40"
                    >
                      <PlayCircle size={18} />
                      <span className="text-sm font-medium">Mark as In Progress</span>
                    </button>
                  )}

                  {selectedTask.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(selectedTask, 'completed')}
                      disabled={updating}
                      className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-40"
                    >
                      <CheckCircle2 size={18} />
                      <span className="text-sm font-medium">Mark as Completed</span>
                    </button>
                  )}

                  {selectedTask.status === 'completed' && (
                    <button
                      onClick={() => handleStatusChange(selectedTask, 'pending')}
                      disabled={updating}
                      className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-all active:scale-[0.98] disabled:opacity-40"
                    >
                      <Clock size={18} />
                      <span className="text-sm font-medium">Reset to Pending</span>
                    </button>
                  )}

                </div>
              </div>

              {/* Delete */}
              <div className="pt-1 border-t border-white/5">
                <button
                  onClick={(e) => handleDelete(selectedTask.id, e)}
                  className="flex items-center gap-2 text-sm text-red-400/60 hover:text-red-400 transition-colors py-1"
                >
                  <Trash2 size={14} />
                  Delete this task
                </button>
              </div>

            </div>
          );
        })()}
      </Modal>

      {/* ─── Assign Task Modal ─── */}
      <Modal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setForm(emptyForm); }}
        title="Assign New Task"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              Task Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Task title..."
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the task..."
              className="input resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="input"
              >
                {priorities.map(p => (
                  <option key={p} value={p} className="bg-surface-800 capitalize">{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                Deadline *
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              Assign To *
            </label>
            <select
              value={form.assignedTo}
              onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
              className="input"
            >
              <option value="" className="bg-surface-800">Select employee...</option>
              {employees.map(e => (
                <option key={e.id} value={e.uid || e.id} className="bg-surface-800">
                  {e.name} — {e.department}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setShowAdd(false); setForm(emptyForm); }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Assigning...
                </span>
              ) : 'Assign Task'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}