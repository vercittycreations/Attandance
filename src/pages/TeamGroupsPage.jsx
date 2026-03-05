import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToGroups, createGroup, updateGroup, deleteGroup
} from '../services/groupService';
import Modal from '../components/common/Modal';
import { MessageCircle, Plus, Edit2, Trash2, ExternalLink, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { name: '', link: '', description: '' };

export default function TeamGroupsPage() {
  const { userProfile, currentUser } = useAuth();
  const isAdmin = userProfile?.role === 'admin';
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToGroups(setGroups);
    return unsub;
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.link.trim()) return toast.error('Name and link are required');
    if (!form.link.startsWith('https://')) return toast.error('Link must start with https://');
    setSubmitting(true);
    try {
      if (editItem) {
        await updateGroup(editItem.id, form);
        toast.success('Group updated!');
      } else {
        await createGroup({ ...form, createdBy: currentUser.uid });
        toast.success('Group added!');
      }
      setShowModal(false);
      setEditItem(null);
      setForm(emptyForm);
    } catch {
      toast.error('Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteGroup(id);
      toast.success('Group deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, link: item.link, description: item.description || '' });
    setShowModal(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageCircle size={20} className="text-emerald-400" />
            Team Groups
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            {isAdmin ? 'Manage team WhatsApp groups' : 'Join team groups'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditItem(null); setForm(emptyForm); setShowModal(true); }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Add Group
          </button>
        )}
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groups.length === 0 ? (
          <div className="card p-14 text-center col-span-2">
            <MessageCircle size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">No groups added yet</p>
            {isAdmin && (
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">
                Add first group
              </button>
            )}
          </div>
        ) : groups.map(group => (
          <div key={group.id} className="card p-5 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={18} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{group.name}</p>
                  {group.description && (
                    <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{group.description}</p>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(group)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id, group.name)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
</div>

<a
  href={group.link}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-medium"
>
  <ExternalLink size={14} />
  Join Group
</a>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); setForm(emptyForm); }}
        title={editItem ? 'Edit Group' : 'Add Team Group'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Group Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Engineering Team"
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">WhatsApp Link *</label>
            <input
              type="url"
              value={form.link}
              onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
              placeholder="https://chat.whatsapp.com/..."
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What is this group for?"
              className="input resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowModal(false); setEditItem(null); setForm(emptyForm); }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Saving...' : editItem ? 'Update' : 'Add Group'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}