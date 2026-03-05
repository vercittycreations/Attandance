import { useEffect, useState } from 'react';
import { getAllLeaves, reviewLeave } from '../../services/leaveService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { PageLoader } from '../common/LoadingSpinner';
import { CheckCircle, XCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const leaveTypeLabels = { sick: 'Sick Leave', casual: 'Casual Leave', half_day: 'Half Day', wfh: 'Work From Home', emergency: 'Emergency Leave' };

export default function AdminLeaves() {
  const { currentUser } = useAuth();
  const { createNotification } = useNotifications();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState(null);

  useEffect(() => { loadLeaves(); }, []);
  const loadLeaves = async () => { setLoading(true); const data = await getAllLeaves(); setLeaves(data); setLoading(false); };

  const handleReview = async (leave, status) => {
    setProcessing(leave.id);
    try {
      await reviewLeave(leave.id, status, currentUser.uid);
      await createNotification(leave.employeeId, `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`, `Your ${leaveTypeLabels[leave.leaveType]} request for ${leave.date} has been ${status}.`, status === 'approved' ? 'leave_approved' : 'leave_rejected', leave.id);
      toast.success(`Leave ${status}!`); loadLeaves();
    } catch { toast.error('Failed'); } finally { setProcessing(null); }
  };

  const counts = { all: leaves.length, pending: leaves.filter(l => l.status === 'pending').length, approved: leaves.filter(l => l.status === 'approved').length, rejected: leaves.filter(l => l.status === 'rejected').length };
  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-surface-900 rounded-xl border border-white/5 w-fit">
        {['all','pending','approved','rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20' : 'text-white/40 hover:text-white'}`}>{f} ({counts[f]})</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? <div className="card p-12 text-center"><Calendar size={32} className="text-white/10 mx-auto mb-3" /><p className="text-sm text-white/30">No leave requests</p></div>
          : filtered.map(leave => (
          <div key={leave.id} className="card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1"><p className="text-sm font-semibold text-white">{leave.employeeName}</p><span className="badge bg-white/5 text-white/50">{leaveTypeLabels[leave.leaveType]}</span></div>
                <p className="text-xs text-white/40"><Calendar size={11} className="inline mr-1" />{leave.date}</p>
                <p className="text-sm text-white/60 mt-2">{leave.reason}</p>
                <p className="text-xs text-white/20 mt-2">Submitted: {leave.createdAt?.toDate ? format(leave.createdAt.toDate(), 'MMM d, yyyy HH:mm') : '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                {leave.status === 'pending' ? (
                  <>
                    <button onClick={() => handleReview(leave, 'approved')} disabled={processing === leave.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm transition-colors"><CheckCircle size={13} /> Approve</button>
                    <button onClick={() => handleReview(leave, 'rejected')} disabled={processing === leave.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm transition-colors"><XCircle size={13} /> Reject</button>
                  </>
                ) : <span className={`badge ${leave.status === 'approved' ? 'badge-present' : 'badge-absent'} capitalize`}>{leave.status}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}