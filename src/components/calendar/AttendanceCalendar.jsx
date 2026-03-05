import { useEffect, useState, useRef } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isToday, isSameMonth,
  subMonths, addMonths, getDay, parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, Clock, LogIn, LogOut } from 'lucide-react';
import { getAllEmployees } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

const statusColors = {
  present: { bg: 'bg-emerald-500',     light: 'bg-emerald-500/20 border-emerald-500/30', dot: 'bg-emerald-400', label: 'Present',  text: 'text-emerald-400' },
  late:    { bg: 'bg-amber-500',       light: 'bg-amber-500/20 border-amber-500/30',     dot: 'bg-amber-400',   label: 'Late',     text: 'text-amber-400' },
  absent:  { bg: 'bg-red-500',         light: 'bg-red-500/20 border-red-500/30',         dot: 'bg-red-400',     label: 'Absent',   text: 'text-red-400' },
  none:    { bg: 'bg-white/5',         light: 'bg-white/3 border-white/5',               dot: 'bg-white/10',    label: 'No Data',  text: 'text-white/30' },
};

export default function AttendanceCalendar() {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [attendanceMap, setAttendanceMap] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null);

  // Load employees for admin
  useEffect(() => {
    if (isAdmin) {
      getAllEmployees().then(list => {
        const active = list.filter(e => e.isActive);
        setEmployees(active);
        if (active.length > 0) setSelectedEmployee(active[0].uid || active[0].id);
      });
    } else {
      setSelectedEmployee(userProfile?.uid);
    }
  }, [isAdmin]);

  // Load attendance when month/employee changes
  useEffect(() => {
    if (!selectedEmployee) return;
    loadAttendance();
  }, [selectedEmployee, currentMonth]);

  const loadAttendance = async () => {
    setLoading(true);
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const q = query(
      collection(db, 'attendance'),
      where('employeeId', '==', selectedEmployee)
    );
    const snap = await getDocs(q);
    const map = {};
    snap.docs.forEach(d => {
      const data = d.data();
      if (data.date >= start && data.date <= end) {
        map[data.date] = { id: d.id, ...data };
      }
    });
    setAttendanceMap(map);
    setLoading(false);
  };

  // Close popup on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setSelectedDay(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDayClick = (date, e) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = attendanceMap[dateStr];
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPos({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
    setSelectedDay({ date: dateStr, record });
  };

  // Build days array for month view
  const buildMonthDays = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  // Build days for week view (current week containing today)
  const buildWeekDays = () => {
    const start = startOfWeek(currentMonth, { weekStartsOn: 1 });
    const end = endOfWeek(currentMonth, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const days = viewMode === 'month' ? buildMonthDays() : buildWeekDays();
  const weekHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getStatus = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = attendanceMap[dateStr];
    if (!record) return 'none';
    return record.status || 'none';
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return format(d, 'hh:mm a');
  };

  // Legend items
  const legend = [
    { status: 'present', label: 'Present' },
    { status: 'late',    label: 'Late' },
    { status: 'absent',  label: 'Absent' },
    { status: 'none',    label: 'No Data' },
  ];

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-4 border-b border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Attendance Calendar</h3>
            <p className="text-xs text-white/30 mt-0.5">Click any day to see details</p>
          </div>

          {/* Employee selector (admin only) */}
          {isAdmin && employees.length > 0 && (
            <select
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              className="input text-sm w-full sm:w-48"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.uid || emp.id} className="bg-surface-800">
                  {emp.name}
                </option>
              ))}
            </select>
          )}

          {/* View toggle */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
            {['month', 'week'].map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  viewMode === v
                    ? 'bg-brand-600 text-white'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-sm font-semibold text-white">
            {format(currentMonth, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
          </p>
          <button
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-3 sm:p-5 relative">
        {loading && (
          <div className="absolute inset-0 bg-surface-900/60 flex items-center justify-center z-10 rounded-xl">
            <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Week headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekHeaders.map(h => (
            <div key={h} className="text-center text-xs font-medium text-white/30 py-1">{h}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const status = getStatus(day);
            const cfg = statusColors[status];
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);

            return (
              <button
                key={i}
                onClick={(e) => handleDayClick(day, e)}
                className={`
                  relative aspect-square sm:aspect-auto sm:h-10 flex items-center justify-center
                  rounded-lg border text-xs font-medium transition-all hover:scale-105 active:scale-95
                  ${isCurrentMonth || viewMode === 'week' ? 'opacity-100' : 'opacity-30'}
                  ${cfg.light}
                  ${isTodayDate ? 'ring-2 ring-brand-500/60' : ''}
                `}
              >
                <span className={`${cfg.text} text-xs font-semibold`}>
                  {format(day, 'd')}
                </span>
                {/* Small dot on mobile */}
                {status !== 'none' && (
                  <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${cfg.dot} sm:hidden`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 flex-wrap">
          {legend.map(({ status, label }) => {
            const cfg = statusColors[status];
            return (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${cfg.bg}`} />
                <span className="text-xs text-white/40">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Popup */}
      {selectedDay && (
        <div
          ref={popupRef}
          className="fixed z-50 w-64 card border border-white/10 shadow-2xl shadow-black/50 animate-slide-up p-4"
          style={{
            top: Math.min(popupPos.top, window.innerHeight - 220),
            left: Math.min(Math.max(popupPos.left, 8), window.innerWidth - 272),
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">
                {format(parseISO(selectedDay.date), 'EEEE, MMM d')}
              </p>
              {selectedDay.record && (
                <span className={`badge badge-${selectedDay.record.status} mt-1`}>
                  {selectedDay.record.status}
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-white/30 hover:text-white p-1"
            >
              <X size={14} />
            </button>
          </div>

          {selectedDay.record ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <LogIn size={13} className="text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-white/40">Check In</p>
                  <p className="text-sm font-medium text-white">
                    {formatTime(selectedDay.record.checkInTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LogOut size={13} className="text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-white/40">Check Out</p>
                  <p className="text-sm font-medium text-white">
                    {formatTime(selectedDay.record.checkOutTime)}
                  </p>
                </div>
              </div>
              {selectedDay.record.totalHours > 0 && (
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-brand-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-white/40">Total Hours</p>
                    <p className="text-sm font-medium text-white">
                      {selectedDay.record.totalHours}h
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-white/30">No attendance data</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}