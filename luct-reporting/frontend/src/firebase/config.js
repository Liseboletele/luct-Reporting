import { initializeApp, getApp, getApps } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBO5dEd-g5KpTyJwKzilDLo3BKsUkWYRRQ',
  authDomain: 'luctreporting.firebaseapp.com',
  projectId: 'luctreporting',
  storageBucket: 'luctreporting.firebasestorage.app',
  messagingSenderId: '706457763525',
  appId: '1:706457763525:web:a16f37a1034ec78d0fbaac',
  measurementId: 'G-QF65ZJ76CQ',
};

// Prevent duplicate initialization
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth with AsyncStorage persistence so login survives app restarts
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Already initialized — just get the existing instance
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
}

export const db = getFirestore(app);
export { auth };
export default app;