import {
  collection, addDoc, query, where, getDocs,
  updateDoc, doc, serverTimestamp, orderBy, deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const createTask = async (task) => {
  const ref = await addDoc(collection(db, 'tasks'), {
    ...task, status: 'pending', completedAt: null,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  return ref.id;
};

export const updateTaskStatus = async (taskId, status) => {
  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  const { db } = await import('../firebase/config');
  await updateDoc(doc(db, 'tasks', taskId), {
    status,
    updatedAt: serverTimestamp(),
    ...(status === 'completed' ? { completedAt: serverTimestamp() } : {})
  });
};

export const deleteTask = async (taskId) => { await deleteDoc(doc(db, 'tasks', taskId)); };

export const getEmployeeTasks = async (employeeId) => {
  const q = query(collection(db, 'tasks'), where('assignedTo', '==', employeeId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAllTasks = async () => {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getTodayCompletedTasks = async () => {
  const q = query(collection(db, 'tasks'), where('status', '==', 'completed'));
  const snap = await getDocs(q);
  const today = new Date().toDateString();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(t => t.completedAt?.toDate?.().toDateString() === today);
};