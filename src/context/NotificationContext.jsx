import { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    });
    return unsub;
  }, [currentUser]);

  const markAsRead = async (notifId) => {
    await updateDoc(doc(db, 'notifications', notifId), { isRead: true });
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { isRead: true })));
  };

  const createNotification = async (userId, title, message, type, relatedId = null) => {
    await addDoc(collection(db, 'notifications'), {
      userId, title, message, type, isRead: false, relatedId, createdAt: serverTimestamp()
    });
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead, createNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);