'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/lib/auth-service';
import { useAuth } from '@/context/auth-context';
import { getErrorMessage } from '@/app/lib/error-utils';
import { AuthFrame } from '@/components/auth-frame';

export default function Login() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [router, user]);

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
      await login({ email, password, rememberMe });

      // Redirect to dashboard
      router.push('/dashboard');
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
        {error && (
          <div className="mb-5 border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
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

          <div className="flex items-center justify-between gap-4">
            <label className="flex min-h-11 items-center gap-3 text-sm text-[#59666b]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Remember me
            </label>
            <a href="/auth/forgot-password" className="text-sm font-bold text-[#0d766e]">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full disabled:opacity-50"
          >
            {loading ? 'Opening workspace...' : 'Log in'}
          </button>
        </form>

          <p className="mt-6 text-sm text-[#657176]">
            Don&apos;t have an account?{' '}
            <a href="/auth/signup" className="font-bold text-[#0d766e]">
              Create one
            </a>
          </p>
    </AuthFrame>
  );
}
