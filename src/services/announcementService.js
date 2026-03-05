import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const createAnnouncement = async (data) => {
  await addDoc(collection(db, 'announcements'), {
    ...data,
    isPinned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateAnnouncement = async (id, data) => {
  await updateDoc(doc(db, 'announcements', id), {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteAnnouncement = async (id) => {
  await deleteDoc(doc(db, 'announcements', id));
};

export const subscribeToAnnouncements = (callback) => {
  const q = query(
    collection(db, 'announcements'),
    orderBy('isPinned', 'desc'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};