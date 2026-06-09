'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/lib/auth-service';
import { useAuth } from '@/context/auth-context';
import { getErrorMessage } from '@/app/lib/error-utils';

export default function Login() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    router.push('/dashboard');
  }

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
      await login({ email, password });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-6">Welcome Back</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:border-red-500 focus:outline-none"
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:border-red-500 focus:outline-none"
              placeholder="Your password"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded mt-6 transition"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="space-y-2 text-sm mt-4">
          <a
            href="/auth/forgot-password"
            className="block text-red-500 hover:underline"
          >
            Forgot password?
          </a>
          <p className="text-gray-400">
            Don&apos;t have an account?{' '}
            <a href="/auth/signup" className="text-red-500 hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
