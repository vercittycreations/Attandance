import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitLeave, getEmployeeLeaves } from '../services/leaveService';
import { Calendar, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PageLoader } from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const leaveTypes = [
  { value: 'sick', label: 'Sick Leave' }, { value: 'casual', label: 'Casual Leave' },
  { value: 'half_day', label: 'Half Day' }, { value: 'wfh', label: 'Work From Home' },
  { value: 'emergency', label: 'Emergency Leave' },
];
const statusIcons = {
  pending: { icon: Clock, color: 'text-amber-400' },
  approved: { icon: CheckCircle, color: 'text-emerald-400' },
  rejected: { icon: XCircle, color: 'text-red-400' },
};

export default function LeavePage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ leaveType: 'sick', date: format(new Date(), 'yyyy-MM-dd'), reason: '' });

  useEffect(() => { if (userProfile) loadLeaves(); }, [userProfile]);
  const loadLeaves = async () => {
    setLoading(true); const data = await getEmployeeLeaves(userProfile.uid); setLeaves(data); setLoading(false);
  };
  const handleSubmit = async () => {
    if (!form.date || !form.reason.trim()) return toast.error('Please fill all fields');
    setSubmitting(true);
    try {
      await submitLeave({ ...form, employeeId: userProfile.uid, employeeName: userProfile.name });
      toast.success('Leave request submitted!'); setShowModal(false);
      setForm({ leaveType: 'sick', date: format(new Date(), 'yyyy-MM-dd'), reason: '' }); loadLeaves();
    } catch { toast.error('Failed to submit leave request'); } finally { setSubmitting(false); }
  };

  if (loading) return <PageLoader />;
  const counts = { pending: leaves.filter(l => l.status === 'pending').length, approved: leaves.filter(l => l.status === 'approved').length, rejected: leaves.filter(l => l.status === 'rejected').length };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold text-white">Leave Requests</h2><p className="text-xs text-white/40 mt-0.5">Submit and track your leave requests</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> Request Leave</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: 'Pending', count: counts.pending, color: 'text-amber-400' }, { label: 'Approved', count: counts.approved, color: 'text-emerald-400' }, { label: 'Rejected', count: counts.rejected, color: 'text-red-400' }].map(({ label, count, color }) => (
          <div key={label} className="card p-4 text-center"><p className={`text-2xl font-bold ${color}`}>{count}</p><p className="text-xs text-white/40 mt-0.5">{label}</p></div>
        ))}
      </div>
      <div className="space-y-3">
        {leaves.length === 0 ? (
          <div className="card p-12 text-center"><Calendar size={32} className="text-white/10 mx-auto mb-3" /><p className="text-sm text-white/30">No leave requests yet</p></div>
        ) : leaves.map(leave => {
          const cfg = statusIcons[leave.status] || statusIcons.pending;
          const Icon = cfg.icon;
          const leaveLabel = leaveTypes.find(t => t.value === leave.leaveType)?.label || leave.leaveType;
          return (
            <div key={leave.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-white/40" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{leaveLabel}</p>
                    <p className="text-xs text-white/40 mt-0.5">{leave.date}</p>
                    <p className="text-xs text-white/50 mt-2 line-clamp-2">{leave.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Icon size={14} className={cfg.color} />
                  <span className={`text-xs font-medium ${cfg.color} capitalize`}>{leave.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Request Leave">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Leave Type</label>
            <select value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))} className="input">
              {leaveTypes.map(t => <option key={t.value} value={t.value} className="bg-surface-800">{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Reason</label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Describe the reason..." className="input resize-none" rows={4} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">{submitting ? 'Submitting...' : 'Submit Request'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}