import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Listen to Firebase Auth state — this is what drives navigation
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get extra profile data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const firestoreData = userDoc.exists() ? userDoc.data() : {};
          const fullUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...firestoreData,
          };
          setUser(fullUser);
          setIsAuthenticated(true);
        } catch (e) {
          // Firestore read failed — still authenticate with basic info
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // LOGIN — Firebase Auth signs in, onAuthStateChanged handles the rest
  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    } catch (e) {
      const messages = {
        'auth/user-not-found': 'No account found with this email. Please register first.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/invalid-credential': 'Incorrect email or password. Please try again.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your internet connection.',
      };
      throw new Error(messages[e.code] || e.message);
    }
  };

  // REGISTER — creates Firebase Auth account + Firestore profile, then signs out
  const register = async (form) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);

      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        facultyName: form.facultyName || '',
        staffId: form.staffId || '',
        studentId: form.studentId || '',
        programName: form.programName || '',
        createdAt: serverTimestamp(),
      });

      // Sign out so user must log in manually after registration
      await signOut(auth);
      return cred.user;
    } catch (e) {
      const messages = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/network-request-failed': 'Network error. Check your internet connection.',
      };
      throw new Error(messages[e.code] || e.message);
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Logout error:', e.message);
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  // UPDATE USER PROFILE
  const updateUser = async (updates) => {
    try {
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), updates);
      }
      setUser((prev) => ({ ...prev, ...updates }));
    } catch (e) {
      console.warn('Update user error:', e.message);
      setUser((prev) => ({ ...prev, ...updates }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        token: user?.uid || null,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};