import {
  collection, addDoc, getDocs, updateDoc,
  deleteDoc, doc, query, orderBy, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const createGroup = async (data) => {
  await addDoc(collection(db, 'team_groups'), {
    ...data,
    createdAt: serverTimestamp()
  });
};

export const updateGroup = async (id, data) => {
  await updateDoc(doc(db, 'team_groups', id), data);
};

export const deleteGroup = async (id) => {
  await deleteDoc(doc(db, 'team_groups', id));
};

export const subscribeToGroups = (callback) => {
  const q = query(collection(db, 'team_groups'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};