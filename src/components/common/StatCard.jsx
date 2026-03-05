export default function StatCard({ title, value, icon: Icon, color = 'brand', trend, loading }) {
  const colorMap = {
    brand: { bg: 'bg-brand-500/10', text: 'text-brand-400', border: 'border-brand-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  };
  const c = colorMap[color] || colorMap.brand;
  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">{title}</p>
          {loading ? <div className="h-8 w-16 bg-white/5 rounded-lg animate-pulse" /> : <p className="text-3xl font-bold text-white tracking-tight">{value}</p>}
          {trend && <p className="text-xs text-white/30 mt-1.5">{trend}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className={c.text} />
        </div>
      </div>
    </div>
  );
}