import {
  doc, updateDoc, serverTimestamp, onSnapshot, collection, getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const setOnline = async (uid) => {
  try {
    await updateDoc(doc(db, 'employees', uid), {
      isOnline: true,
      lastSeen: serverTimestamp()
    });
  } catch (err) {
    console.error('Presence online error:', err);
  }
};

export const setOffline = async (uid) => {
  try {
    await updateDoc(doc(db, 'employees', uid), {
      isOnline: false,
      lastSeen: serverTimestamp()
    });
  } catch (err) {
    console.error('Presence offline error:', err);
  }
};

export const subscribeToEmployeePresence = (callback) => {
  return onSnapshot(collection(db, 'employees'), (snap) => {
    const data = {};
    snap.docs.forEach(d => {
      data[d.id] = {
        isOnline: d.data().isOnline || false,
        lastSeen: d.data().lastSeen
      };
    });
    callback(data);
  });
};