import {
  collection, getDocs, doc, getDoc, updateDoc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const getAllEmployees = async () => {
  const q = query(collection(db, 'employees'), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getEmployee = async (uid) => {
  const snap = await getDoc(doc(db, 'employees', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateEmployee = async (uid, data) => {
  await updateDoc(doc(db, 'employees', uid), { ...data, updatedAt: serverTimestamp() });
};

export const deactivateEmployee = async (uid) => {
  await updateDoc(doc(db, 'employees', uid), { isActive: false, updatedAt: serverTimestamp() });
};

export const calculateProductivityScore = (attendance, tasks) => {
  const total = attendance.length;
  if (total === 0) return 0;
  const present = attendance.filter(a => a.status === 'present').length;
  const late = attendance.filter(a => a.status === 'late').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const attendanceScore = ((present * 100 + late * 50) / (total * 100)) * 60;
  const taskScore = Math.min(completed * 5, 40);
  return Math.round(attendanceScore + taskScore);
};