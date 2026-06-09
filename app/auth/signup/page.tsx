'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/app/lib/auth-service';
import { getErrorMessage } from '@/app/lib/error-utils';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'TALENT' | 'RECRUITER'>('TALENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const user = await signUp({
        email,
        password,
        userType,
      });

      // Store user type in localStorage for quick access
      localStorage.setItem(`userType_${user.uid}`, userType);

      // Redirect to profile creation based on user type
      if (userType === 'TALENT') {
        router.push('/talent/profile');
      } else {
        router.push('/recruiter/profile');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Sign up failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-6">Join FirstTake</h1>

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
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
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
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
              placeholder="Min 8 characters"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
              placeholder="Confirm password"
              required
            />
          </div>

          {/* User Type */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              I am a...
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="TALENT"
                  checked={userType === 'TALENT'}
                  onChange={(e) =>
                    setUserType(e.target.value as 'TALENT' | 'RECRUITER')
                  }
                  className="mr-2"
                />
                <span className="text-gray-300">Talent (Actor, Model, Dancer, etc.)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="RECRUITER"
                  checked={userType === 'RECRUITER'}
                  onChange={(e) =>
                    setUserType(e.target.value as 'TALENT' | 'RECRUITER')
                  }
                  className="mr-2"
                />
                <span className="text-gray-300">Recruiter (Casting Director, Producer)</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded mt-6"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4">
          Already have an account?{' '}
          <a href="/auth/login" className="text-red-500 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
