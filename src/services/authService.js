import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// No Firebase Storage — photo upload disabled
export const uploadProfilePhoto = async (uid, file) => {
  // To enable photos later, add Firebase Storage and implement here
  console.warn('Photo upload not configured — Firebase Storage is disabled');
  return null;
};

export const updateEmployeeProfile = async (uid, data) => {
  await updateDoc(doc(db, 'employees', uid), {
    ...data,
    updatedAt: serverTimestamp()
  });
};