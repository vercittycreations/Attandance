import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { initializeFCM, onForegroundMessage, sendLocalNotification } from '../services/fcmService';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';

export function useFCM() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Request permission + save token
    initializeFCM(currentUser.uid);

    // Handle messages when app is OPEN
    let unsubscribe;
    onForegroundMessage((payload) => {
      const title = payload.notification?.title || 'WorkforcePro';
      const body  = payload.notification?.body  || 'New notification';

      // Show toast inside app
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-slide-up' : 'opacity-0'}
          flex items-start gap-3 bg-surface-800 border border-white/10
          rounded-2xl shadow-2xl p-4 max-w-sm cursor-pointer`}
          onClick={() => toast.dismiss(t.id)}
        >
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
            <Bell size={15} className="text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{title}</p>
            <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{body}</p>
          </div>
        </div>
      ), { duration: 5000, position: 'top-right' });

    }).then(unsub => { unsubscribe = unsub; });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser]);
}