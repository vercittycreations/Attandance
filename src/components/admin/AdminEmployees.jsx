import { useEffect, useState } from 'react';
import { getAllEmployees, updateEmployee, deactivateEmployee } from '../../services/employeeService';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import { PageLoader } from '../common/LoadingSpinner';
import { Plus, Search, Edit2, UserX, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';

const departments = ['Engineering','Design','Marketing','HR','Sales','Finance','Operations','General'];
const emptyForm = { name: '', email: '', password: '', role: 'employee', department: 'General' };

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => { setLoading(true); const data = await getAllEmployees(); setEmployees(data); setLoading(false); };

  const filtered = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('Fill all required fields');
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, 'employees', cred.user.uid), {
        uid: cred.user.uid, name: form.name, email: form.email, role: form.role,
        department: form.department, photoURL: '', joinDate: serverTimestamp(),
        isActive: true, productivityScore: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      toast.success('Employee added!'); setShowAdd(false); setForm(emptyForm); loadEmployees();
    } catch (err) { toast.error(err.message || 'Failed to add employee'); } finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    setSubmitting(true);
    try { await updateEmployee(showEdit.uid || showEdit.id, editForm); toast.success('Employee updated!'); setShowEdit(null); loadEmployees(); }
    catch { toast.error('Failed to update'); } finally { setSubmitting(false); }
  };

  const handleDeactivate = async (emp) => {
    if (!confirm(`Deactivate ${emp.name}?`)) return;
    try { await deactivateEmployee(emp.uid || emp.id); toast.success('Employee deactivated'); loadEmployees(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." className="input pl-10" />
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"><Plus size={16} /> Add Employee</button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Employee','Department','Role','Status','Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar src={emp.photoURL} name={emp.name} size="sm" />
                      <div><p className="text-sm font-medium text-white">{emp.name}</p><p className="text-xs text-white/40">{emp.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-white/60">{emp.department}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {emp.role === 'admin' ? <Shield size={12} className="text-brand-400" /> : <User size={12} className="text-white/30" />}
                      <span className="text-sm text-white/60 capitalize">{emp.role}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><span className={`badge ${emp.isActive ? 'badge-present' : 'badge-absent'}`}>{emp.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setShowEdit(emp); setEditForm({ name: emp.name, department: emp.department, role: emp.role }); }}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1">
                        <Edit2 size={11} /> Edit
                      </button>
                      {emp.isActive && (
                        <button onClick={() => handleDeactivate(emp)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                          <UserX size={11} /> Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-white/30">No employees found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Employee">
        <div className="space-y-4">
          {[{ label: 'Full Name', field: 'name', type: 'text', placeholder: 'John Doe' }, { label: 'Email', field: 'email', type: 'email', placeholder: 'john@company.com' }, { label: 'Password', field: 'password', type: 'password', placeholder: '••••••••' }].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">{label}</label>
              <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className="input" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Department</label>
            <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="input">
              {departments.map(d => <option key={d} value={d} className="bg-surface-800">{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input">
              <option value="employee" className="bg-surface-800">Employee</option>
              <option value="admin" className="bg-surface-800">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAdd} disabled={submitting} className="btn-primary flex-1">{submitting ? 'Adding...' : 'Add Employee'}</button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Employee">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Full Name</label>
            <input type="text" value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Department</label>
            <select value={editForm.department || ''} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} className="input">
              {departments.map(d => <option key={d} value={d} className="bg-surface-800">{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Role</label>
            <select value={editForm.role || ''} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="input">
              <option value="employee" className="bg-surface-800">Employee</option>
              <option value="admin" className="bg-surface-800">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowEdit(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleEdit} disabled={submitting} className="btn-primary flex-1">{submitting ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}