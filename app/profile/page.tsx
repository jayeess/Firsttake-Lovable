'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/async-state';
import { BrandLogo } from '@/components/brand-logo';
import { useAuth } from '@/context/auth-context';

export default function ProfileBridgePage() {
  const router = useRouter();
  const { isAdmin, user, userType, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    if (isAdmin) {
      router.replace('/admin');
      return;
    }
    if (userType === 'RECRUITER') {
      router.replace('/recruiter/profile');
      return;
    }
    if (userType === 'TALENT') {
      router.replace('/talent/profile');
      return;
    }
    router.replace('/dashboard');
  }, [isAdmin, loading, router, user, userType]);

  return (
    <main className="min-h-screen bg-[#eef4f7] px-4 py-5 text-[#07111f]">
      <div className="mx-auto max-w-lg">
        <BrandLogo />
        <LoadingState label="Opening your profile..." />
      </div>
    </main>
  );
}
