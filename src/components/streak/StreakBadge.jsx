export default function StreakBadge({ streak = 0, size = 'md' }) {
  if (!streak || streak === 0) return null;

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const getFlame = () => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 14) return '🔥🔥';
    return '🔥';
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold
      bg-orange-500/15 text-orange-400 border border-orange-500/20 ${sizes[size]}`}>
      {getFlame()} {streak} day{streak !== 1 ? 's' : ''}
    </span>
  );
}