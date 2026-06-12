'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { User } from 'firebase/auth';
import {
  onAuthStateChange,
  prepareTabSession,
} from '@/app/lib/auth-service';
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
  isAdmin: boolean;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountStatus, setAccountStatus] = useState<
    'ACTIVE' | 'SUSPENDED' | null
  >(null);
  const authChangeId = useRef(0);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    let observerStarted = false;

    const initializationTimeout = window.setTimeout(() => {
      if (!active || observerStarted) return;
      setUser(null);
      setUserType(null);
      setIsAdmin(false);
      setAccountStatus(null);
      setError(
        'Authentication initialization timed out. Please refresh and try again.'
      );
      setLoading(false);
    }, 8000);

    const startObserver = () => {
      if (!active) return;
      unsubscribe = onAuthStateChange(async (currentUser) => {
        observerStarted = true;
        window.clearTimeout(initializationTimeout);
        const changeId = ++authChangeId.current;
        setLoading(true);
        setUser(currentUser);
        setUserType(null);
        setError(null);
        setIsAdmin(false);
        setAccountStatus(null);

        if (currentUser) {
          try {
            const token = await currentUser.getIdTokenResult();
            if (changeId !== authChangeId.current) return;
            setIsAdmin(token.claims.admin === true);
            const account = await getUserAccount(currentUser.uid);
            const storedUserType = localStorage.getItem(
              `userType_${currentUser.uid}`
            );

            if (account) {
              if (changeId !== authChangeId.current) return;
              setUserType(account.userType);
              setAccountStatus(account.accountStatus);
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
              setAccountStatus('ACTIVE');
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
      }, (authError) => {
        if (!active) return;
        observerStarted = true;
        window.clearTimeout(initializationTimeout);
        setUser(null);
        setUserType(null);
        setIsAdmin(false);
        setAccountStatus(null);
        setError(getErrorMessage(authError, 'Failed to initialize authentication'));
        setLoading(false);
      });
    };

    void prepareTabSession()
      .catch((err: unknown) => {
        if (!active) return;
        setError(getErrorMessage(err, 'Failed to initialize authentication'));
      })
      .finally(() => {
        if (!active) return;
        try {
          startObserver();
        } catch (err: unknown) {
          window.clearTimeout(initializationTimeout);
          setError(getErrorMessage(err, 'Failed to initialize authentication'));
          setLoading(false);
        }
      });

    return () => {
      active = false;
      window.clearTimeout(initializationTimeout);
      unsubscribe?.();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, userType, loading, error, isAdmin, accountStatus }}
    >
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
