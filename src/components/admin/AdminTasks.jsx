import { useEffect, useState } from 'react';
import { getAllTasks, createTask, deleteTask } from '../../services/taskService';
import { getAllEmployees } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { sendPushToUser } from '../../services/oneSignalService';
import Modal from '../common/Modal';
import { PageLoader } from '../common/LoadingSpinner';
import { Plus, Search, Trash2, AlertCircle } from 'lucide-react';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const priorities = ['low', 'medium', 'high', 'urgent'];
const emptyForm = { title: '', description: '', priority: 'medium', deadline: '', assignedTo: '' };

export default function AdminTasks() {
  const { currentUser } = useAuth();
  const { createNotification } = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [t, e] = await Promise.all([getAllTasks(), getAllEmployees()]);
    setTasks(t);
    setEmployees(e.filter(emp => emp.isActive));
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !form.assignedTo || !form.deadline) {
      return toast.error('Fill all required fields');
    }
    setSubmitting(true);
    try {
      const emp = employees.find(
        e => e.uid === form.assignedTo || e.id === form.assignedTo
      );

      const { Timestamp } = await import('firebase/firestore');

      await createTask({
        ...form,
        assignedToName: emp?.name || '',
        assignedBy: currentUser.uid,
        deadline: Timestamp.fromDate(new Date(form.deadline))
      });

      // ✅ OneSignal browser push
      await sendPushToUser(
        form.assignedTo,
        '✅ New Task Assigned',
        `You have a new task: "${form.title}"`,
        '/tasks'
      );

      // ✅ In-app bell notification (Firestore)
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

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
      loadData();
    } catch {
      toast.error('Failed to delete');
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

      {/* Filters + Add button */}
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

      {/* Task list */}
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

          return (
            <div key={task.id} className="card p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-white">{task.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      → <span className="text-white/60">{task.assignedToName}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    <span className={`badge badge-${task.status}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {task.description && (
                  <p className="text-xs text-white/40 mt-1.5 line-clamp-2">{task.description}</p>
                )}
                {task.deadline?.toDate && (
                  <div className={`flex items-center gap-1.5 mt-2 text-xs ${isOverdue ? 'text-red-400' : 'text-white/30'}`}>
                    {isOverdue && <AlertCircle size={11} />}
                    Due: {format(task.deadline.toDate(), 'MMM d, yyyy')}
                    {isOverdue && <span className="font-semibold ml-1">— Overdue</span>}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(task.id)}
                className="text-white/20 hover:text-red-400 transition-colors p-1 flex-shrink-0 mt-0.5"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Assign Task Modal */}
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
                <option
                  key={e.id}
                  value={e.uid || e.id}
                  className="bg-surface-800"
                >
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