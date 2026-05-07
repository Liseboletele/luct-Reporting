import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { authAPI } from '../services/api';
import { storage } from '../services/storage';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    ),
  ]);

const persistSession = async (user, token) => {
  try {
    await withTimeout(
      Promise.all([
        storage.setItem('authToken', token),
        storage.setItem('userData', JSON.stringify(user)),
      ]),
      5000,
      'Saving session'
    );
  } catch (error) {
    console.warn('Session storage skipped:', error.message);
  }
};

function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return { ...state, user: action.user, token: action.token, isAuthenticated: !!action.token, isLoading: false };
    case 'LOGIN':
      return { ...state, user: action.user, token: action.token, isAuthenticated: true, isLoading: false };
    case 'LOGOUT':
      return { ...state, user: null, token: null, isAuthenticated: false, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.user } };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await storage.getItem('authToken');
        const userStr = await storage.getItem('userData');
        if (token && userStr) {
          const user = JSON.parse(userStr);
          dispatch({ type: 'RESTORE_TOKEN', token, user });
        } else {
          dispatch({ type: 'RESTORE_TOKEN', token: null, user: null });
        }
      } catch {
        dispatch({ type: 'RESTORE_TOKEN', token: null, user: null });
      }
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user, token } = res.data.data;
    dispatch({ type: 'LOGIN', user, token });
    persistSession(user, token);
    return user;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { user, token } = res.data.data;
    dispatch({ type: 'LOGIN', user, token });
    persistSession(user, token);
    return user;
  };

  const logout = async () => {
    dispatch({ type: 'LOGOUT' });
    try {
      await authAPI.logout();
      await withTimeout(
        Promise.all([
          storage.deleteItem('authToken'),
          storage.deleteItem('userData'),
        ]),
        3000,
        'Clearing session'
      );
    } catch (error) {
      console.warn('Session clear skipped:', error.message);
    }
  };

  const updateUser = (updates) => {
    dispatch({ type: 'UPDATE_USER', user: updates });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
