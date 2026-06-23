'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/app/lib/auth-service';
import { getErrorMessage } from '@/app/lib/error-utils';
import { AuthFrame } from '@/components/auth-frame';
import {
  DevTestCases,
  type TestCredentials,
} from '@/components/dev-test-cases';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'TALENT' | 'RECRUITER'>('TALENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const applyTestCase = (credentials: TestCredentials) => {
    setEmail(credentials.email);
    setPassword(credentials.password);
    setConfirmPassword(credentials.confirmPassword ?? credentials.password);
    setUserType(credentials.userType ?? 'TALENT');
    setError('');
  };

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

    if (!/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError('Password must include one uppercase letter and one number');
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
    <AuthFrame
      eyebrow="Create your account"
      title="Your next opportunity starts here."
      description="Choose how you use Nata Connect, then build the profile that represents your work."
    >
        <DevTestCases mode="signup" onSelect={applyTestCase} />
        {error && (
          <div className="mb-5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-900">
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
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field mt-2"
                placeholder="8+ chars, A-Z, 0-9"
                required
              />
            </label>
            <label className="block text-sm font-bold">
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="field mt-2"
                placeholder="Repeat password"
                required
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-bold">I am joining as</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className={`border p-4 ${userType === 'TALENT' ? 'border-[#008ca6] bg-[#edf7f5]' : 'border-[#d5dcda] bg-white'}`}>
                <input
                  type="radio"
                  value="TALENT"
                  checked={userType === 'TALENT'}
                  onChange={(e) =>
                    setUserType(e.target.value as 'TALENT' | 'RECRUITER')
                  }
                  className="mr-3"
                />
                <span className="font-bold">Talent</span>
                <span className="mt-2 block text-sm leading-6 text-[#657176]">Actors, models, dancers, anchors, and voice artists.</span>
              </label>
              <label className={`border p-4 ${userType === 'RECRUITER' ? 'border-[#008ca6] bg-[#edf7f5]' : 'border-[#d5dcda] bg-white'}`}>
                <input
                  type="radio"
                  value="RECRUITER"
                  checked={userType === 'RECRUITER'}
                  onChange={(e) =>
                    setUserType(e.target.value as 'TALENT' | 'RECRUITER')
                  }
                  className="mr-3"
                />
                <span className="font-bold">Recruiter</span>
                <span className="mt-2 block text-sm leading-6 text-[#657176]">Casting directors, producers, and production teams.</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full disabled:opacity-50"
          >
            {loading ? 'Creating your account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-[#657176]">
          Already have an account?{' '}
          <a href="/auth/login" className="font-bold text-[#008ca6]">
            Log in
          </a>
        </p>
    </AuthFrame>
  );
}
