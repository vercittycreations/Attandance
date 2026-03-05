import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkIn, checkOut, getTodayAttendance, getEmployeeAttendance, getSettings } from '../services/attendanceService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Clock, LogIn, LogOut, CheckCircle } from 'lucide-react';
import { PageLoader } from '../components/common/LoadingSpinner';
import AttendanceHistoryTable from '../components/attendance/AttendanceHistoryTable';

export default function AttendancePage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState({ defaultCheckInDeadline: '10:00' });
  const [actionLoading, setActionLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (userProfile) loadData(); }, [userProfile]);

  const loadData = async () => {
    setLoading(true);
    const [todayData, hist, cfg] = await Promise.all([
      getTodayAttendance(userProfile.uid), getEmployeeAttendance(userProfile.uid, 30), getSettings()
    ]);
    setToday(todayData); setHistory(hist); setSettings(cfg); setLoading(false);
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const deadline = settings.dayOverrides?.[format(new Date(), 'yyyy-MM-dd')] || settings.defaultCheckInDeadline;
      const result = await checkIn(userProfile.uid, userProfile.name, deadline);
      setToday(result);
      toast.success(result.status === 'late' ? '⚠️ Checked in — marked as Late' : '✅ Checked in successfully!');
      loadData();
    } catch { toast.error('Check-in failed'); } finally { setActionLoading(false); }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await checkOut(today.id, today.checkInTime);
      toast.success('✅ Checked out successfully!'); loadData();
    } catch { toast.error('Check-out failed'); } finally { setActionLoading(false); }
  };

  if (loading) return <PageLoader />;
  const deadline = settings.dayOverrides?.[format(new Date(), 'yyyy-MM-dd')] || settings.defaultCheckInDeadline;
  const checkedIn = !!today?.checkInTime;
  const checkedOut = !!today?.checkOutTime;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Current Time</p>
          <p className="text-4xl font-bold text-white font-mono tracking-tight">{format(now, 'HH:mm:ss')}</p>
          <p className="text-sm text-white/40 mt-1">{format(now, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-white/30" />
          <span className="text-sm text-white/40">Check-in deadline: <span className="text-amber-400 font-medium">{deadline}</span></span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Today's Status</p>
          {!today ? <div className="flex items-center gap-2"><div className="w-2 h-2 bg-white/20 rounded-full" /><span className="text-sm text-white/50">Not checked in</span></div>
            : <div className="space-y-2">
                <span className={`badge badge-${today.status} text-sm`}>{today.status.charAt(0).toUpperCase() + today.status.slice(1)}</span>
                {today.checkInTime && <p className="text-xs text-white/40">In: <span className="text-white/70">{today.checkInTime?.toDate ? format(today.checkInTime.toDate(), 'HH:mm') : '--'}</span></p>}
                {today.checkOutTime && <p className="text-xs text-white/40">Out: <span className="text-white/70">{today.checkOutTime?.toDate ? format(today.checkOutTime.toDate(), 'HH:mm') : '--'}</span></p>}
                {today.totalHours > 0 && <p className="text-xs text-white/40">Total: <span className="text-emerald-400 font-medium">{today.totalHours}h</span></p>}
              </div>}
        </div>
        <div className="card p-5 flex flex-col items-center justify-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${checkedIn ? 'bg-emerald-500/15' : 'bg-white/5'}`}>
            <LogIn size={24} className={checkedIn ? 'text-emerald-400' : 'text-white/30'} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">Check In</p>
            {checkedIn && <p className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5 justify-center"><CheckCircle size={11} /> Done</p>}
          </div>
          <button onClick={handleCheckIn} disabled={checkedIn || actionLoading} className="btn-primary w-full text-sm">
            {actionLoading && !checkedIn ? 'Processing...' : checkedIn ? '✓ Checked In' : 'Check In'}
          </button>
        </div>
        <div className="card p-5 flex flex-col items-center justify-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${checkedOut ? 'bg-blue-500/15' : 'bg-white/5'}`}>
            <LogOut size={24} className={checkedOut ? 'text-blue-400' : 'text-white/30'} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">Check Out</p>
            {checkedOut && <p className="text-xs text-blue-400 flex items-center gap-1 mt-0.5 justify-center"><CheckCircle size={11} /> Done</p>}
          </div>
          <button onClick={handleCheckOut} disabled={!checkedIn || checkedOut || actionLoading} className="btn-primary w-full text-sm">
            {actionLoading && checkedIn && !checkedOut ? 'Processing...' : checkedOut ? '✓ Checked Out' : 'Check Out'}
          </button>
        </div>
      </div>
      <AttendanceHistoryTable records={history} />
    </div>
  );
}