import { useFocusTimer } from '../../hooks/useFocusTimer';
import { Brain, Square, Play, Clock } from 'lucide-react';

export default function FocusWidget({ compact = false }) {
  const { isActive, elapsed, todayMinutes, loading, startFocus, stopFocus, formatTimer, formatMinutes } = useFocusTimer();

  if (loading) return null;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
        isActive
          ? 'bg-brand-500/15 border-brand-500/30'
          : 'bg-white/5 border-white/10'
      }`}>
        <Brain size={14} className={isActive ? 'text-brand-400' : 'text-white/40'} />
        {isActive ? (
          <>
            <span className="text-xs font-mono text-brand-400 font-bold">{formatTimer(elapsed)}</span>
            <button
              onClick={stopFocus}
              className="text-xs px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Stop
            </button>
          </>
        ) : (
          <>
            <span className="text-xs text-white/40">{formatMinutes(todayMinutes)} today</span>
            <button
              onClick={startFocus}
              className="text-xs px-2 py-0.5 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors"
            >
              Focus
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`card p-5 border transition-all ${
      isActive ? 'border-brand-500/30 bg-brand-500/5' : 'border-white/5'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isActive ? 'bg-brand-500/20' : 'bg-white/5'
          }`}>
            <Brain size={16} className={isActive ? 'text-brand-400' : 'text-white/40'} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Focus Mode</p>
            <p className="text-xs text-white/40">Track productive work time</p>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
            <span className="text-xs text-brand-400 font-medium">Active</span>
          </div>
        )}
      </div>

      {/* Timer display */}
      <div className={`rounded-xl p-4 mb-4 text-center ${
        isActive ? 'bg-brand-500/10 border border-brand-500/20' : 'bg-white/3'
      }`}>
        {isActive ? (
          <>
            <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">Focus Timer</p>
            <p className="text-3xl font-bold font-mono text-brand-400 tracking-widest">
              {formatTimer(elapsed)}
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">Today's Focus Time</p>
            <p className="text-2xl font-bold text-white">
              {formatMinutes(todayMinutes)}
            </p>
          </>
        )}
      </div>

      {/* Today stats */}
      <div className="flex items-center gap-2 mb-4">
        <Clock size={12} className="text-white/30" />
        <span className="text-xs text-white/40">
          Total today: <span className="text-white/70 font-medium">{formatMinutes(todayMinutes)}</span>
        </span>
      </div>

      {/* Button */}
      {isActive ? (
        <button
          onClick={stopFocus}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all font-medium text-sm"
        >
          <Square size={14} fill="currentColor" />
          Stop Focus Session
        </button>
      ) : (
        <button
          onClick={startFocus}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all font-medium text-sm active:scale-95"
        >
          <Play size={14} fill="currentColor" />
          Start Focus Session
        </button>
      )}
    </div>
  );
}