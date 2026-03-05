import {
  collection, addDoc, query, where, getDocs,
  updateDoc, doc, serverTimestamp, orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const submitLeave = async (data) => {
  const ref = await addDoc(collection(db, 'leaves'), {
    ...data, status: 'pending', reviewedBy: null, reviewedAt: null, createdAt: serverTimestamp()
  });
  return ref.id;
};

export const reviewLeave = async (leaveId, status, adminId) => {
  await updateDoc(doc(db, 'leaves', leaveId), { status, reviewedBy: adminId, reviewedAt: serverTimestamp() });
};

export const getEmployeeLeaves = async (employeeId) => {
  const q = query(collection(db, 'leaves'), where('employeeId', '==', employeeId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAllLeaves = async () => {
  const q = query(collection(db, 'leaves'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getPendingLeaves = async () => {
  const q = query(collection(db, 'leaves'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};