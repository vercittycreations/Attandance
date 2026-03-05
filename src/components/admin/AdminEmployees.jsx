import { useEffect, useState } from 'react';
import { getAllEmployees, updateEmployee, deactivateEmployee } from '../../services/employeeService';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import { PageLoader } from '../common/LoadingSpinner';
import { Plus, Search, Edit2, UserX, UserCheck, Shield, User, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const departments = ['Engineering','Design','Marketing','HR','Sales','Finance','Operations','General'];
const emptyForm = { name: '', email: '', password: '', role: 'employee', department: 'General' };

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState('all'); // all | active | inactive
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null); // { emp, action: 'deactivate' | 'activate' }
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    setLoading(true);
    const data = await getAllEmployees();
    setEmployees(data);
    setLoading(false);
  };

  // Filter logic
  const filtered = employees.filter(e => {
    const matchSearch =
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      showFilter === 'all' ? true :
      showFilter === 'active' ? e.isActive :
      !e.isActive;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: employees.length,
    active: employees.filter(e => e.isActive).length,
    inactive: employees.filter(e => !e.isActive).length,
  };

  // Add new employee
  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('Fill all required fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, 'employees', cred.user.uid), {
        uid: cred.user.uid,
        name: form.name,
        email: form.email,
        role: form.role,
        department: form.department,
        photoURL: '',
        joinDate: serverTimestamp(),
        isActive: true,
        productivityScore: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success(`✅ ${form.name} added successfully!`);
      setShowAdd(false);
      setForm(emptyForm);
      loadEmployees();
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') toast.error('Email already in use');
      else if (err.code === 'auth/weak-password') toast.error('Password too weak');
      else toast.error(err.message || 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit employee
  const handleEdit = async () => {
    if (!editForm.name?.trim()) return toast.error('Name is required');
    setSubmitting(true);
    try {
      await updateEmployee(showEdit.uid || showEdit.id, editForm);
      toast.success('✅ Employee updated!');
      setShowEdit(null);
      loadEmployees();
    } catch {
      toast.error('Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async () => {
    if (!showConfirm) return;
    const { emp, action } = showConfirm;
    const uid = emp.uid || emp.id;
    setTogglingId(uid);
    setShowConfirm(null);
    try {
      await updateEmployee(uid, { isActive: action === 'activate' });
      toast.success(
        action === 'activate'
          ? `✅ ${emp.name} is now Active`
          : `⛔ ${emp.name} has been Deactivated`
      );
      loadEmployees();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'all', label: 'Total', color: 'text-white' },
          { key: 'active', label: 'Active', color: 'text-emerald-400' },
          { key: 'inactive', label: 'Inactive', color: 'text-red-400' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setShowFilter(key)}
            className={`card p-4 text-center transition-all ${showFilter === key ? 'border-brand-500/30 bg-brand-500/5' : 'hover:border-white/10'}`}
          >
            <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, department..."
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-white/30" />
            <span className="text-sm text-white/50">{filtered.length} employee{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          {showFilter !== 'all' && (
            <button onClick={() => setShowFilter('all')} className="text-xs text-brand-400 hover:text-brand-300">
              Show all
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Employee', 'Department', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <Users size={32} className="text-white/10 mx-auto mb-3" />
                    <p className="text-sm text-white/30">No employees found</p>
                  </td>
                </tr>
              ) : filtered.map(emp => {
                const uid = emp.uid || emp.id;
                const isToggling = togglingId === uid;
                return (
                  <tr key={emp.id} className={`border-b border-white/3 hover:bg-white/2 transition-colors ${!emp.isActive ? 'opacity-60' : ''}`}>

                    {/* Employee info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar name={emp.name} size="sm" />
                          {/* Online/offline dot */}
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-900 ${emp.isActive ? 'bg-emerald-400' : 'bg-red-500'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{emp.name}</p>
                          <p className="text-xs text-white/40">{emp.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-5 py-3.5 text-sm text-white/60">{emp.department}</td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {emp.role === 'admin'
                          ? <Shield size={12} className="text-brand-400" />
                          : <User size={12} className="text-white/30" />
                        }
                        <span className="text-sm text-white/60 capitalize">{emp.role}</span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-3.5">
                      {isToggling ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="text-xs text-white/30">Updating...</span>
                        </div>
                      ) : (
                        <span className={`badge ${emp.isActive ? 'badge-present' : 'badge-absent'}`}>
                          {emp.isActive ? '● Active' : '● Inactive'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">

                        {/* Edit button */}
                        <button
                          onClick={() => {
                            setShowEdit(emp);
                            setEditForm({ name: emp.name, department: emp.department, role: emp.role });
                          }}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                        >
                          <Edit2 size={11} /> Edit
                        </button>

                        {/* Deactivate OR Activate button */}
                        {emp.isActive ? (
                          <button
                            onClick={() => setShowConfirm({ emp, action: 'deactivate' })}
                            disabled={isToggling}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1 disabled:opacity-40"
                          >
                            <UserX size={11} /> Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowConfirm({ emp, action: 'activate' })}
                            disabled={isToggling}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 disabled:opacity-40"
                          >
                            <UserCheck size={11} /> Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD EMPLOYEE MODAL ── */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setForm(emptyForm); }} title="Add New Employee">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Anushka Sharma"
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="anushka@company.com"
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Password *</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Min. 6 characters"
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Department</label>
              <select
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                className="input"
              >
                {departments.map(d => <option key={d} value={d} className="bg-surface-800">{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="input"
              >
                <option value="employee" className="bg-surface-800">Employee</option>
                <option value="admin" className="bg-surface-800">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowAdd(false); setForm(emptyForm); }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAdd} disabled={submitting} className="btn-primary flex-1">
              {submitting
                ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Adding...</span>
                : 'Add Employee'
              }
            </button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT EMPLOYEE MODAL ── */}
      <Modal isOpen={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Employee">
        <div className="space-y-4">
          {showEdit && (
            <div className="flex items-center gap-3 p-3 bg-white/3 rounded-xl mb-2">
              <Avatar name={showEdit.name} size="md" />
              <div>
                <p className="text-sm font-medium text-white">{showEdit.name}</p>
                <p className="text-xs text-white/40">{showEdit.email}</p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={editForm.name || ''}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Department</label>
              <select
                value={editForm.department || ''}
                onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                className="input"
              >
                {departments.map(d => <option key={d} value={d} className="bg-surface-800">{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Role</label>
              <select
                value={editForm.role || ''}
                onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                className="input"
              >
                <option value="employee" className="bg-surface-800">Employee</option>
                <option value="admin" className="bg-surface-800">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowEdit(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleEdit} disabled={submitting} className="btn-primary flex-1">
              {submitting
                ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
                : 'Save Changes'
              }
            </button>
          </div>
        </div>
      </Modal>

      {/* ── CONFIRM MODAL (Deactivate / Activate) ── */}
      <Modal
        isOpen={!!showConfirm}
        onClose={() => setShowConfirm(null)}
        title={showConfirm?.action === 'activate' ? 'Activate Employee' : 'Deactivate Employee'}
        size="sm"
      >
        {showConfirm && (
          <div className="space-y-4">
            {/* Employee preview */}
            <div className="flex items-center gap-3 p-4 bg-white/3 rounded-xl">
              <Avatar name={showConfirm.emp.name} size="md" />
              <div>
                <p className="text-sm font-semibold text-white">{showConfirm.emp.name}</p>
                <p className="text-xs text-white/40">{showConfirm.emp.email}</p>
                <p className="text-xs text-white/30">{showConfirm.emp.department}</p>
              </div>
            </div>

            {/* Warning message */}
            {showConfirm.action === 'deactivate' ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400 font-medium mb-1">⚠️ Deactivate karna chahte ho?</p>
                <p className="text-xs text-red-400/70">
                  Yeh employee app use nahi kar paayega. Unka data safe rahega. Baad mein wapis Activate kar sakte ho.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-sm text-emerald-400 font-medium mb-1">✅ Activate karna chahte ho?</p>
                <p className="text-xs text-emerald-400/70">
                  Yeh employee wapis app access kar paayega.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                className={`flex-1 font-semibold px-5 py-2.5 rounded-xl transition-all duration-150 active:scale-95 ${
                  showConfirm.action === 'deactivate'
                    ? 'bg-red-500 hover:bg-red-400 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                }`}
              >
                {showConfirm.action === 'activate' ? '✅ Activate' : '⛔ Deactivate'}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}