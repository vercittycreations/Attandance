import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCHOqyYDvjJGnlpqFjgiYhJgzkaaO3-OIM",
  authDomain: "attendance-b5457.firebaseapp.com",
  projectId: "attendance-b5457",
  storageBucket: "attendance-b5457.firebasestorage.app",
  messagingSenderId: "943173459360",
  appId: "1:943173459360:web:905b96cddb98c5fe3a18c5",
  measurementId: "G-TP8N7JJSYQ"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;