import {
  doc, updateDoc, getDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { format, subDays } from 'date-fns';
import { getEmployeeAttendance } from './attendanceService';

export const calculateStreak = (attendanceRecords) => {
  if (!attendanceRecords || attendanceRecords.length === 0) return 0;

  // Sort by date descending
  const sorted = [...attendanceRecords]
    .filter(r => r.status === 'present' || r.status === 'late')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) return 0;

  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  // Allow today or yesterday as starting point
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const mostRecent = sorted[0]?.date;

  if (mostRecent !== today && mostRecent !== yesterday) return 0;

  let expectedDate = mostRecent === today
    ? format(new Date(), 'yyyy-MM-dd')
    : format(subDays(new Date(), 1), 'yyyy-MM-dd');

  for (const record of sorted) {
    if (record.date === expectedDate) {
      streak++;
      expectedDate = format(subDays(new Date(expectedDate), 1), 'yyyy-MM-dd');
    } else {
      break;
    }
  }

  return streak;
};

export const updateEmployeeStreak = async (employeeId, streak) => {
  try {
    await updateDoc(doc(db, 'employees', employeeId), {
      streak,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Streak update error:', err);
  }
};