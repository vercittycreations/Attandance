import { format } from 'date-fns';
export default function AttendanceHistoryTable({ records }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Attendance History</h3>
        <span className="text-xs text-white/30">{records.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Date','Check In','Check Out','Hours','Status'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-white/30">No attendance records yet</td></tr>
            ) : records.map(r => (
              <tr key={r.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                <td className="px-5 py-3.5 text-sm text-white/70">{r.date}</td>
                <td className="px-5 py-3.5 text-sm text-white/70 font-mono">{r.checkInTime?.toDate ? format(r.checkInTime.toDate(), 'HH:mm') : '—'}</td>
                <td className="px-5 py-3.5 text-sm text-white/70 font-mono">{r.checkOutTime?.toDate ? format(r.checkOutTime.toDate(), 'HH:mm') : '—'}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-white/70">{r.totalHours > 0 ? `${r.totalHours}h` : '—'}</td>
                <td className="px-5 py-3.5"><span className={`badge badge-${r.status}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}