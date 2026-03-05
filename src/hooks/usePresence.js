import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { setOnline, setOffline } from '../services/presenceService';

export function usePresence() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    setOnline(currentUser.uid);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setOffline(currentUser.uid);
      } else {
        setOnline(currentUser.uid);
      }
    };

    const handleBeforeUnload = () => {
      setOffline(currentUser.uid);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      setOffline(currentUser.uid);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);
}