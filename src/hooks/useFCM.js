import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { initializeFCM, onForegroundMessage } from '../services/fcmService';
import toast from 'react-hot-toast';

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

      // Simple toast — no JSX needed
      toast.success(`${title}: ${body}`, {
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#1a1d2e',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          fontFamily: 'Sora, sans-serif',
          fontSize: '14px',
          maxWidth: '380px',
        },
        icon: '🔔',
      });

    }).then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser]);
}