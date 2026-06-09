'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '@/app/lib/auth-service';
import {
  getRecruiterProfile,
  getTalentProfile,
} from '@/app/lib/firestore-service';
import { getErrorMessage } from '@/app/lib/error-utils';

interface AuthContextType {
  user: User | null;
  userType: string | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = onAuthStateChange(async (currentUser) => {
        setUser(currentUser);
        setError(null);

        if (currentUser) {
          try {
            const storedUserType = localStorage.getItem(
              `userType_${currentUser.uid}`
            );
            if (storedUserType) {
              setUserType(storedUserType);
            } else {
              const talentProfile = await getTalentProfile(currentUser.uid);
              if (talentProfile) {
                setUserType('TALENT');
                localStorage.setItem(`userType_${currentUser.uid}`, 'TALENT');
              } else {
                const recruiterProfile = await getRecruiterProfile(
                  currentUser.uid
                );
                if (recruiterProfile) {
                  setUserType('RECRUITER');
                  localStorage.setItem(
                    `userType_${currentUser.uid}`,
                    'RECRUITER'
                  );
                }
              }
            }
          } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load user profile'));
          }
        } else {
          setUserType(null);
        }

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
