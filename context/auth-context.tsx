'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '@/app/lib/auth-service';
import {
  ensureUserAccount,
  getUserAccount,
} from '@/app/lib/firestore-service';
import type { UserType } from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';

interface AuthContextType {
  user: User | null;
  userType: UserType | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authChangeId = useRef(0);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = onAuthStateChange(async (currentUser) => {
        const changeId = ++authChangeId.current;
        setLoading(true);
        setUser(currentUser);
        setUserType(null);
        setError(null);

        if (currentUser) {
          try {
            const account = await getUserAccount(currentUser.uid);
            const storedUserType = localStorage.getItem(
              `userType_${currentUser.uid}`
            );

            if (account) {
              if (changeId !== authChangeId.current) return;
              setUserType(account.userType);
              localStorage.setItem(
                `userType_${currentUser.uid}`,
                account.userType
              );
            } else if (
              storedUserType === 'TALENT' ||
              storedUserType === 'RECRUITER'
            ) {
              await ensureUserAccount(
                currentUser.uid,
                currentUser.email,
                storedUserType
              );
              if (changeId !== authChangeId.current) return;
              setUserType(storedUserType);
            } else {
              if (changeId !== authChangeId.current) return;
              setUserType(null);
              setError(
                'This account has no role assigned. Create a new Talent or Recruiter account.'
              );
            }
          } catch (err: unknown) {
            if (changeId !== authChangeId.current) return;
            const message = getErrorMessage(
              err,
              'Failed to load user account'
            );
            setError(
              message.includes('client is offline')
                ? 'Authentication is working, but Firestore is unavailable. Create the Firestore database in Firebase Console and check its security rules.'
                : message
            );
          }
        } else {
          if (changeId !== authChangeId.current) return;
          setUserType(null);
        }

        if (changeId !== authChangeId.current) return;
        setLoading(false);
      });
    } catch (err: unknown) {
      queueMicrotask(() => {
        setError(getErrorMessage(err, 'Failed to initialize authentication'));
        setLoading(false);
      });
    }

    return () => unsubscribe?.();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userType, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
