'use client';

import Link from 'next/link';
import { useState } from 'react';
import { resetPassword } from '@/app/lib/auth-service';
import { getErrorMessage } from '@/app/lib/error-utils';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await resetPassword(email);
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to send reset email'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8] p-4">
      <section className="w-full max-w-md border border-[#d9dee5] bg-white p-7">
        <p className="text-sm font-bold uppercase text-[#008ca6]">
          Nata Connect | నట కనెక్ట్
        </p>
        <h1 className="mt-2 text-3xl font-bold">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-[#606a74]">
          Enter the email connected to your account. Firebase will send a
          secure recovery link.
        </p>
        {message && (
          <p className="mt-5 border border-green-300 bg-green-50 p-3 text-sm text-green-800">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-5 border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6">
          <label className="block text-sm font-semibold" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 h-12 w-full border border-[#bcc5ce] px-3 outline-none focus:border-[#008ca6]"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-5 h-12 w-full bg-[#008ca6] font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <Link
          href="/auth/login"
          className="mt-5 inline-block text-sm font-semibold text-[#1f5f91]"
        >
          Return to login
        </Link>
      </section>
    </main>
  );
}
