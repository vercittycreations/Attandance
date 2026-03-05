import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-white/60 capitalize">{p.name}:</span>
          <span className="text-white font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};
export default function WeeklyAttendanceChart({ data }) {
  return (
    <div className="card p-5 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Weekly Attendance</h3>
        <p className="text-xs text-white/30">Last 7 days overview</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={8} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="present" fill="#6470f1" radius={[4,4,0,0]} />
          <Bar dataKey="late" fill="#f59e0b" radius={[4,4,0,0]} />
          <Bar dataKey="absent" fill="#ef4444" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2">
        {[['present','#6470f1'],['late','#f59e0b'],['absent','#ef4444']].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-xs text-white/40 capitalize">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}