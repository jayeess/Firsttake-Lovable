'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/lib/auth-service';
import {
  getRecruiterProfile,
  getUserAccount,
} from '@/app/lib/firestore-service';
import { hasRecruiterApproval } from '@/app/lib/recruiter-access';
import { useAuth } from '@/context/auth-context';
import { getErrorMessage } from '@/app/lib/error-utils';
import { AuthFrame } from '@/components/auth-frame';
import {
  DevTestCases,
  type TestCredentials,
} from '@/components/dev-test-cases';

export default function Login() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const openCorrectWorkspace = useCallback(
    async (uid: string) => {
      const account = await getUserAccount(uid);

      if (!account) {
        throw new Error(
          'This Firebase user has no Nata Connect role. Create the account again as Talent or Recruiter.'
        );
      }

      if (account.userType === 'TALENT') {
        router.replace('/dashboard');
        return;
      }

      const profile = await getRecruiterProfile(uid);
      if (!profile) {
        router.replace('/recruiter/profile');
        return;
      }

      router.replace(
        hasRecruiterApproval(uid, profile)
          ? '/dashboard'
          : '/recruiter/verification'
      );
    },
    [router]
  );

  const applyTestCase = (credentials: TestCredentials) => {
    setEmail(credentials.email);
    setPassword(credentials.password);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      const signedInUser = await login({ email, password });
      await openCorrectWorkspace(signedInUser.uid);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame
      eyebrow="Welcome back"
      title="Continue your casting journey."
      description="Sign in to manage your profile, opportunities, and applications."
    >
        <DevTestCases mode="login" onSelect={applyTestCase} />
        {error && (
          <div className="mb-5 border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!authLoading && user && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-[#b8dce3] bg-[#edf9fb] p-4 text-sm">
            <div className="min-w-0">
              <p className="font-black text-[#07111f]">Current tab session</p>
              <p className="mt-1 truncate text-[#526874]">{user.email}</p>
            </div>
            <button
              type="button"
              className="secondary-button min-h-10 px-4 text-sm"
              onClick={() => void openCorrectWorkspace(user.uid)}
            >
              Continue
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-bold">
              Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field mt-2"
              placeholder="your@email.com"
              required
            />
          </label>

          <label className="block text-sm font-bold">
              Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field mt-2"
              placeholder="Your password"
              required
            />
          </label>

          <div className="flex items-center justify-end">
            <a href="/auth/forgot-password" className="text-sm font-bold text-[#008ca6]">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full disabled:opacity-50"
          >
            {loading
              ? 'Opening workspace...'
              : user
                ? 'Use this account in this tab'
                : 'Log in'}
          </button>
        </form>

          <p className="mt-6 text-sm text-[#657176]">
            Don&apos;t have an account?{' '}
            <a href="/auth/signup" className="font-bold text-[#008ca6]">
              Create one
            </a>
          </p>
    </AuthFrame>
  );
}
