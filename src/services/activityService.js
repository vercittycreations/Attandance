import {
  collection, addDoc, query, orderBy,
  limit, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const logActivity = async (employeeId, employeeName, type, message, metadata = {}) => {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      employeeId,
      employeeName,
      type,
      message,
      metadata,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Activity log error:', err);
  }
};

export const subscribeToActivityFeed = (callback, limitCount = 20) => {
  const q = query(
    collection(db, 'activity_logs'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};