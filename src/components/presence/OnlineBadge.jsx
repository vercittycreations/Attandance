import { formatDistanceToNow } from 'date-fns';

export default function OnlineBadge({ isOnline, lastSeen, showLabel = false }) {
  const lastSeenText = lastSeen?.toDate
    ? formatDistanceToNow(lastSeen.toDate(), { addSuffix: true })
    : '';

  if (showLabel) {
    return (
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'
        }`} />
        <span className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-white/30'}`}>
          {isOnline ? 'Online' : lastSeenText ? `Last seen ${lastSeenText}` : 'Offline'}
        </span>
      </div>
    );
  }

  return (
    <div
      title={isOnline ? 'Online' : lastSeenText ? `Last seen ${lastSeenText}` : 'Offline'}
      className={`w-2.5 h-2.5 rounded-full border-2 border-surface-900 flex-shrink-0 ${
        isOnline ? 'bg-emerald-400' : 'bg-white/20'
      }`}
    />
  );
}