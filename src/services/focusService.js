import {
  collection, addDoc, query, where, getDocs,
  updateDoc, doc, serverTimestamp, orderBy, onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';

export const startFocusSession = async (employeeId, employeeName, taskId = null) => {
  const ref = await addDoc(collection(db, 'focus_sessions'), {
    employeeId,
    employeeName,
    taskId,
    focusStartTime: serverTimestamp(),
    focusEndTime: null,
    focusDuration: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    createdAt: serverTimestamp()
  });
  return ref.id;
};

export const stopFocusSession = async (sessionId, startTime) => {
  const now = new Date();
  const start = startTime?.toDate ? startTime.toDate() : new Date(startTime);
  const durationMinutes = Math.round((now - start) / 60000);
  await updateDoc(doc(db, 'focus_sessions', sessionId), {
    focusEndTime: serverTimestamp(),
    focusDuration: durationMinutes
  });
  return durationMinutes;
};

export const getTodayFocusTime = async (employeeId) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const q = query(
    collection(db, 'focus_sessions'),
    where('employeeId', '==', employeeId),
    where('date', '==', today)
  );
  const snap = await getDocs(q);
  const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const total = sessions.reduce((acc, s) => acc + (s.focusDuration || 0), 0);
  return total; // in minutes
};

export const getActiveFocusSession = async (employeeId) => {
  const q = query(
    collection(db, 'focus_sessions'),
    where('employeeId', '==', employeeId),
    where('focusEndTime', '==', null)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const getAllFocusSessions = async () => {
  const q = query(collection(db, 'focus_sessions'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getEmployeeFocusSessions = async (employeeId) => {
  const q = query(
    collection(db, 'focus_sessions'),
    where('employeeId', '==', employeeId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};