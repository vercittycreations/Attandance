import {
  collection, addDoc, query, where, getDocs,
  updateDoc, doc, serverTimestamp, orderBy, getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';

export const getTodayAttendance = async (employeeId) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const q = query(collection(db, 'attendance'), where('employeeId', '==', employeeId), where('date', '==', today));
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const checkIn = async (employeeId, employeeName, deadline) => {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const [dh, dm] = deadline.split(':').map(Number);
  const deadlineTime = new Date(); deadlineTime.setHours(dh, dm, 0, 0);
  const status = now > deadlineTime ? 'late' : 'present';
  const existing = await getTodayAttendance(employeeId);
  if (existing) return existing;
  const docRef = await addDoc(collection(db, 'attendance'), {
    employeeId, employeeName, date: today,
    checkInTime: serverTimestamp(), checkOutTime: null,
    totalHours: 0, status, createdAt: serverTimestamp()
  });
  return { id: docRef.id, employeeId, date: today, status };
};

export const checkOut = async (attendanceId, checkInTime) => {
  const now = new Date();
  const cin = checkInTime?.toDate ? checkInTime.toDate() : new Date(checkInTime);
  const totalHours = parseFloat(((now - cin) / 3600000).toFixed(2));
  await updateDoc(doc(db, 'attendance', attendanceId), { checkOutTime: serverTimestamp(), totalHours });
};

export const getAttendanceByDate = async (date) => {
  const q = query(collection(db, 'attendance'), where('date', '==', date), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getEmployeeAttendance = async (employeeId, days = 30) => {
  const q = query(collection(db, 'attendance'), where('employeeId', '==', employeeId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.slice(0, days).map(d => ({ id: d.id, ...d.data() }));
};

export const getAllAttendance = async () => {
  const q = query(collection(db, 'attendance'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getSettings = async () => {
  const snap = await getDoc(doc(db, 'settings', 'global'));
  return snap.exists() ? snap.data() : { defaultCheckInDeadline: '10:00', dayOverrides: {} };
};

export const updateSettings = async (data) => {
  const { setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'settings', 'global'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const markAbsent = async (employeeId, employeeName, date) => {
  const existing = await getTodayAttendance(employeeId);
  if (existing) return;
  await addDoc(collection(db, 'attendance'), {
    employeeId, employeeName, date, checkInTime: null, checkOutTime: null,
    totalHours: 0, status: 'absent', createdAt: serverTimestamp()
  });
};