import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import { setOneSignalUser, logoutOneSignal } from '../services/oneSignalService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]   = useState(null);
  const [userProfile, setUserProfile]   = useState(null);
  const [loading, setLoading]           = useState(true);  // ← KEY FIX

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = () =>
    signInWithPopup(auth, googleProvider);

  const logout = async () => {
    await logoutOneSignal();
    return signOut(auth);
  };

  const register = async (email, password, name, role = 'employee') => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'employees', cred.user.uid), {
      uid:              cred.user.uid,
      name,
      email,
      role,
      department:       'General',
      photoURL:         '',
      joinDate:         serverTimestamp(),
      isActive:         true,
      productivityScore: 0,
      streak:           0,
      isOnline:         false,
      createdAt:        serverTimestamp(),
      updatedAt:        serverTimestamp()
    });
    return cred;
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    try {
      const snap = await getDoc(doc(db, 'employees', currentUser.uid));
      if (snap.exists()) setUserProfile(snap.data());
    } catch (err) {
      console.error('Refresh profile error:', err);
    }
  };

  useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (user) => {
    try {
      if (user) {
        setCurrentUser(user);
        const snap = await getDoc(doc(db, 'employees', user.uid));

        if (snap.exists()) {
          setUserProfile(snap.data());
        } else {
          const profile = {
            uid:               user.uid,
            name:              user.displayName || 'User',
            email:             user.email,
            role:              'employee',
            department:        'General',
            photoURL:          user.photoURL || '',
            joinDate:          serverTimestamp(),
            isActive:          true,
            productivityScore: 0,
            streak:            0,
            isOnline:          false,
            createdAt:         serverTimestamp(),
            updatedAt:         serverTimestamp()
          };
          await setDoc(doc(db, 'employees', user.uid), profile);
          setUserProfile(profile);
        }

        // ✅ Fire and forget — auth ko kabhi block nahi karega
        setOneSignalUser(user.uid, user.displayName, user.email).catch(() => {});

      } else {
        setCurrentUser(null);
        setUserProfile(null);
        logoutOneSignal().catch(() => {});
      }
    } catch (err) {
      console.error('Auth state error:', err);
      setCurrentUser(null);
      setUserProfile(null);
    } finally {
      // ✅ Ye HAMESHA chalega — OneSignal ka wait nahi
      setLoading(false);
    }
  });

  return unsub;
}, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      login,
      loginWithGoogle,
      logout,
      register,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);