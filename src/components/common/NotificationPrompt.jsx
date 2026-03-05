import { useState, useEffect } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if (!('Notification' in window)) return;

    const perm = Notification.permission;
    setPermission(perm);

    // Show banner only if denied
    // (default = browser popup already handles it)
    if (perm === 'denied') {
      // Show after 3 seconds so it doesn't feel abrupt
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  // Detect browser for correct instructions
  const getBrowserGuide = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      return {
        name: 'Chrome',
        steps: 'Address bar mein 🔒 Lock icon → Site settings → Notifications → Allow'
      };
    }
    if (ua.includes('Firefox')) {
      return {
        name: 'Firefox',
        steps: 'Address bar mein 🔒 Lock icon → Connection secure → More info → Permissions → Notifications → Allow'
      };
    }
    if (ua.includes('Edg')) {
      return {
        name: 'Edge',
        steps: 'Address bar mein 🔒 Lock icon → Permissions → Notifications → Allow'
      };
    }
    if (ua.includes('Safari')) {
      return {
        name: 'Safari',
        steps: 'Safari menu → Settings for this website → Notifications → Allow'
      };
    }
    return {
      name: 'Browser',
      steps: 'Browser settings → Site permissions → Notifications → Allow karo'
    };
  };

  if (!show || permission !== 'denied') return null;

  const guide = getBrowserGuide();

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-slide-up">
      <div className="card border border-amber-500/20 bg-amber-500/5 p-4 shadow-2xl shadow-black/40">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Bell size={16} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white mb-1">
              Notifications Blocked
            </p>
            <p className="text-xs text-white/50 leading-relaxed mb-2">
              Push notifications blocked hain. Enable karne ke liye:
            </p>
            <p className="text-xs text-amber-300/80 leading-relaxed bg-amber-500/10 rounded-lg p-2 border border-amber-500/15">
              {guide.steps}
            </p>
          </div>
          <button
            onClick={() => setShow(false)}
            className="text-white/30 hover:text-white transition-colors flex-shrink-0 p-0.5"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}