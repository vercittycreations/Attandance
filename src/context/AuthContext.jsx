import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword, signInWithPopup, signOut,
  onAuthStateChanged, createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  const register = async (email, password, name, role = 'employee') => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'employees', cred.user.uid), {
      uid: cred.user.uid, name, email, role, department: 'General',
      photoURL: '', joinDate: serverTimestamp(), isActive: true,
      productivityScore: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    return cred;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const snap = await getDoc(doc(db, 'employees', user.uid));
        if (snap.exists()) {
          setUserProfile(snap.data());
        } else {
          const profile = {
            uid: user.uid, name: user.displayName || 'User', email: user.email,
            role: 'employee', department: 'General', photoURL: user.photoURL || '',
            joinDate: serverTimestamp(), isActive: true, productivityScore: 0,
            createdAt: serverTimestamp(), updatedAt: serverTimestamp()
          };
          await setDoc(doc(db, 'employees', user.uid), profile);
          setUserProfile(profile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
      const snap = await getDoc(doc(db, 'employees', currentUser.uid));
      if (snap.exists()) setUserProfile(snap.data());
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, login, loginWithGoogle, logout, register, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);