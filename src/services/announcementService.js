import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, onSnapshot,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const createAnnouncement = async (data) => {
  const ref = await addDoc(collection(db, 'announcements'), {
    ...data,
    isPinned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
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

// Simple query — no composite index needed
export const subscribeToAnnouncements = (callback) => {
  const q = query(
    collection(db, 'announcements'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort pinned first on client side — no composite index needed
    const sorted = [
      ...items.filter(i => i.isPinned),
      ...items.filter(i => !i.isPinned)
    ];
    callback(sorted);
  });
};