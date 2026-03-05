import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../services/announcementService';
import { logActivity } from '../services/activityService';
import { useNotifications } from '../context/NotificationContext';
import { getAllEmployees } from '../services/employeeService';
import Modal from '../components/common/Modal';
import {
  Megaphone, Plus, Pin, Edit2, Trash2,
  Calendar, Bell, Users
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { sendLocalNotification } from '../services/fcmService';
const emptyForm = { title: '', message: '' };

export default function AnnouncementsPage() {
  const { userProfile, currentUser } = useAuth();
  const { createNotification } = useNotifications();
  const isAdmin = userProfile?.role === 'admin';

  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAnnouncements(setAnnouncements);
    return unsub;
  }, []);

  const handleSubmit = async () => {
  if (!form.title.trim() || !form.message.trim()) {
    return toast.error('Fill all fields');
  }
  setSubmitting(true);
  try {
    if (editItem) {
      await updateAnnouncement(editItem.id, {
        title: form.title,
        message: form.message
      });
      toast.success('Announcement updated!');
    } else {
      // 1. Save to Firestore
      await createAnnouncement({
        title: form.title,
        message: form.message,
        createdBy: currentUser.uid,
        createdByName: userProfile?.name
      });

      // 2. Activity log
      await logActivity(
        currentUser.uid, userProfile?.name, 'task_assigned',
        `📢 ${userProfile?.name} posted: "${form.title}"`,
        { type: 'announcement' }
      );

      // 3. In-app notification to all employees (bell icon)
      try {
        const employees = await getAllEmployees();
        const others = employees.filter(
          e => e.isActive && (e.uid || e.id) !== currentUser.uid
        );
        await Promise.all(
          others.map(emp =>
            createNotification(
              emp.uid || emp.id,
              `📢 ${form.title}`,
              form.message.length > 80
                ? form.message.slice(0, 80) + '...'
                : form.message,
              'task_assigned'
            )
          )
        );

        // 4. Browser notification (for users who have app open)
        sendLocalNotification(
          `📢 ${form.title}`,
          form.message,
          '/announcements'
        );

        toast.success(`✅ Posted & notified ${others.length} employee${others.length !== 1 ? 's' : ''}!`);
      } catch {
        toast.success('✅ Posted!');
      }
    }

    setShowModal(false);
    setEditItem(null);
    setForm(emptyForm);
  } catch (err) {
    console.error(err);
    toast.error('Failed to post');
  } finally {
    setSubmitting(false);
  }
};

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteAnnouncement(id);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handlePin = async (item) => {
    await updateAnnouncement(item.id, { isPinned: !item.isPinned });
    toast.success(item.isPinned ? 'Unpinned' : '📌 Pinned!');
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title, message: item.message });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Megaphone size={20} className="text-brand-400" />
            Company Updates
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            {isAdmin
              ? 'Post announcements — all employees get notified'
              : 'Stay updated with company news'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Post Update
          </button>
        )}
      </div>

      {/* Count badge */}
      {announcements.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-white/30">
          <Megaphone size={12} />
          <span>{announcements.length} update{announcements.length !== 1 ? 's' : ''}</span>
          {announcements.filter(a => a.isPinned).length > 0 && (
            <span className="text-brand-400">
              · {announcements.filter(a => a.isPinned).length} pinned
            </span>
          )}
        </div>
      )}

      {/* Announcements list */}
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="card p-14 text-center">
            <Megaphone size={36} className="text-white/10 mx-auto mb-3" />
            <p className="text-sm font-medium text-white/30">No announcements yet</p>
            {isAdmin && (
              <button onClick={openAdd} className="btn-primary mt-4 text-sm">
                Post first update
              </button>
            )}
          </div>
        ) : (
          announcements.map((item, idx) => (
            <div
              key={item.id}
              className={`card p-5 transition-all animate-slide-up ${
                item.isPinned
                  ? 'border-brand-500/25 bg-brand-500/4'
                  : 'hover:border-white/10'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Pinned badge + title */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {item.isPinned && (
                      <span className="inline-flex items-center gap-1 text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-white leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap break-words">
                    {item.message}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-white/25">
                      <Calendar size={11} />
                      {item.createdAt?.toDate
                        ? format(item.createdAt.toDate(), 'MMM d, yyyy • h:mm a')
                        : 'Just now'}
                    </div>
                    <span className="text-white/20 text-xs">
                      by {item.createdByName || 'Admin'}
                    </span>
                  </div>
                </div>

                {/* Admin actions */}
                {isAdmin && (
                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => handlePin(item)}
                      title={item.isPinned ? 'Unpin' : 'Pin to top'}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                        item.isPinned
                          ? 'bg-brand-500/20 text-brand-400'
                          : 'bg-white/5 text-white/30 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Pin size={12} />
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); setForm(emptyForm); }}
        title={editItem ? 'Edit Announcement' : 'Post Company Update'}
      >
        <div className="space-y-4">
          {!editItem && (
            <div className="flex items-center gap-2 p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl">
              <Bell size={14} className="text-brand-400 flex-shrink-0" />
              <p className="text-xs text-brand-300">
                All employees will receive an in-app notification when you post.
              </p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. New AI Tool Available for Team"
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              Message *
            </label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Write your announcement here..."
              className="input resize-none"
              rows={5}
            />
            <p className="text-xs text-white/20 mt-1">
              {form.message.length} characters
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setShowModal(false); setEditItem(null); setForm(emptyForm); }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {editItem ? 'Updating...' : 'Posting...'}
                </span>
              ) : (
                editItem ? 'Update' : '📢 Post & Notify All'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}