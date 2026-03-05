import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
const mockMetrics = [
  { subject: 'Attendance', A: 85 }, { subject: 'Punctuality', A: 70 },
  { subject: 'Tasks', A: 90 }, { subject: 'Completion', A: 75 }, { subject: 'Efficiency', A: 80 },
];
export default function ProductivityChart() {
  return (
    <div className="card p-5">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-white">Team Productivity</h3>
        <p className="text-xs text-white/30">Average performance metrics</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={mockMetrics}>
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <Radar name="Team" dataKey="A" stroke="#6470f1" fill="#6470f1" fillOpacity={0.15} strokeWidth={2} />
          <Tooltip contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: 12 }} labelStyle={{ color: 'white' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}