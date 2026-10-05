import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we are using the dummy API key
    if (import.meta.env.VITE_FIREBASE_API_KEY === 'AIzaSyDummyKeyForLocalTesting1234567890') {
      setCurrentUser({
        uid: 'dummy-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      } as User);
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    if (import.meta.env.VITE_FIREBASE_API_KEY === 'AIzaSyDummyKeyForLocalTesting1234567890') {
      setCurrentUser(null);
      return;
    }
    await firebaseSignOut(auth);
  };

  const value = {
    currentUser,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
