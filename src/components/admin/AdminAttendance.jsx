import { useEffect, useState } from 'react';
import { getAttendanceByDate } from '../../services/attendanceService';
import { PageLoader } from '../common/LoadingSpinner';
import { format } from 'date-fns';
import { Search } from 'lucide-react';

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { loadAttendance(); }, [date]);
  const loadAttendance = async () => { setLoading(true); const data = await getAttendanceByDate(date); setRecords(data); setLoading(false); };

  const filtered = records.filter(r => {
    const matchSearch = r.employeeName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const summary = { present: records.filter(r => r.status === 'present').length, late: records.filter(r => r.status === 'late').length, absent: records.filter(r => r.status === 'absent').length };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input sm:w-44" />
        <div className="relative flex-1"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee..." className="input pl-10" /></div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input sm:w-40">
          {['all','present','late','absent'].map(s => <option key={s} value={s} className="bg-surface-800 capitalize">{s === 'all' ? 'All Status' : s}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center"><p className="text-xl font-bold text-emerald-400">{summary.present}</p><p className="text-xs text-white/40 mt-0.5">Present</p></div>
        <div className="card p-4 text-center"><p className="text-xl font-bold text-amber-400">{summary.late}</p><p className="text-xs text-white/40 mt-0.5">Late</p></div>
        <div className="card p-4 text-center"><p className="text-xl font-bold text-red-400">{summary.absent}</p><p className="text-xs text-white/40 mt-0.5">Absent</p></div>
      </div>
      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Employee','Check In','Check Out','Hours','Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-white/30">No records for this date</td></tr>
                  : filtered.map(r => (
                  <tr key={r.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-white">{r.employeeName}</td>
                    <td className="px-5 py-3.5 text-sm text-white/60 font-mono">{r.checkInTime?.toDate ? format(r.checkInTime.toDate(), 'HH:mm') : '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-white/60 font-mono">{r.checkOutTime?.toDate ? format(r.checkOutTime.toDate(), 'HH:mm') : '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-white/60">{r.totalHours > 0 ? `${r.totalHours}h` : '—'}</td>
                    <td className="px-5 py-3.5"><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}