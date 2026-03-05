import { useEffect, useState } from 'react';
import { getAllLeaves, reviewLeave } from '../../services/leaveService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { sendPushToUser } from '../../services/oneSignalService';
import { PageLoader } from '../common/LoadingSpinner';
import { CheckCircle, XCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const leaveTypeLabels = {
  sick:      'Sick Leave',
  casual:    'Casual Leave',
  half_day:  'Half Day',
  wfh:       'Work From Home',
  emergency: 'Emergency Leave'
};

export default function AdminLeaves() {
  const { currentUser } = useAuth();
  const { createNotification } = useNotifications();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState(null);

  useEffect(() => { loadLeaves(); }, []);

  const loadLeaves = async () => {
    setLoading(true);
    const data = await getAllLeaves();
    setLeaves(data);
    setLoading(false);
  };

  const handleReview = async (leave, status) => {
    setProcessing(leave.id);
    try {
      // 1. Update Firestore
      await reviewLeave(leave.id, status, currentUser.uid);

      // 2. OneSignal browser push to employee
      await sendPushToUser(
        leave.employeeId,
        status === 'approved' ? '✅ Leave Approved!' : '❌ Leave Rejected',
        `Your leave request for ${leave.date} has been ${status}.`,
        '/leave'
      );

      // 3. In-app bell notification (Firestore)
      await createNotification(
        leave.employeeId,
        `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        `Your ${leaveTypeLabels[leave.leaveType] || leave.leaveType} request for ${leave.date} has been ${status}.`,
        status === 'approved' ? 'leave_approved' : 'leave_rejected',
        leave.id
      );

      toast.success(
        status === 'approved'
          ? '✅ Leave approved & employee notified!'
          : '❌ Leave rejected & employee notified!'
      );

      loadLeaves();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update leave status');
    } finally {
      setProcessing(null);
    }
  };

  const counts = {
    all:      leaves.length,
    pending:  leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  const filtered = filter === 'all'
    ? leaves
    : leaves.filter(l => l.status === filter);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-surface-900 rounded-xl border border-white/5 w-fit overflow-x-auto">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium capitalize transition-all whitespace-nowrap ${
              filter === f
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20'
                : 'text-white/40 hover:text-white'
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Leave cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Calendar size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">No leave requests found</p>
          </div>
        ) : filtered.map(leave => (
          <div key={leave.id} className="card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">

                {/* Employee + Leave type */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold text-white">
                    {leave.employeeName}
                  </p>
                  <span className="badge bg-white/5 text-white/50">
                    {leaveTypeLabels[leave.leaveType] || leave.leaveType}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
                  <Calendar size={11} />
                  {leave.date}
                </div>

                {/* Reason */}
                <p className="text-sm text-white/60 leading-relaxed">
                  {leave.reason}
                </p>

                {/* Submitted at */}
                <p className="text-xs text-white/20 mt-2">
                  Submitted:{' '}
                  {leave.createdAt?.toDate
                    ? format(leave.createdAt.toDate(), 'MMM d, yyyy • HH:mm')
                    : '—'}
                </p>

                {/* Reviewed info */}
                {leave.status !== 'pending' && leave.reviewedAt?.toDate && (
                  <p className="text-xs text-white/20 mt-0.5">
                    Reviewed:{' '}
                    {format(leave.reviewedAt.toDate(), 'MMM d, yyyy • HH:mm')}
                  </p>
                )}
              </div>

              {/* Action buttons / Status badge */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {leave.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleReview(leave, 'approved')}
                      disabled={processing === leave.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {processing === leave.id ? (
                        <div className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                      ) : (
                        <CheckCircle size={13} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(leave, 'rejected')}
                      disabled={processing === leave.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {processing === leave.id ? (
                        <div className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <XCircle size={13} />
                      )}
                      Reject
                    </button>
                  </>
                ) : (
                  <span className={`badge capitalize ${
                    leave.status === 'approved' ? 'badge-present' : 'badge-absent'
                  }`}>
                    {leave.status === 'approved' ? '✅' : '❌'} {leave.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}