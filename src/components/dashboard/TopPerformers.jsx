import Avatar from '../common/Avatar';
import { Trophy } from 'lucide-react';
const medalColors = ['text-yellow-400', 'text-slate-400', 'text-amber-600'];
export default function TopPerformers({ employees }) {
  const sorted = [...employees].sort((a, b) => (b.productivityScore || 0) - (a.productivityScore || 0)).slice(0, 5);
  return (
    <div className="card p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={16} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Top Performers</h3>
      </div>
      <div className="space-y-3">
        {sorted.length === 0 ? <p className="text-sm text-white/30 text-center py-8">No data yet</p>
          : sorted.map((emp, i) => (
          <div key={emp.id} className="flex items-center gap-3">
            <span className={`text-xs font-bold w-4 ${medalColors[i] || 'text-white/30'}`}>{i + 1}</span>
            <Avatar src={emp.photoURL} name={emp.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{emp.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${emp.productivityScore || 0}%` }} />
                </div>
                <span className="text-xs text-white/40 font-mono">{emp.productivityScore || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}