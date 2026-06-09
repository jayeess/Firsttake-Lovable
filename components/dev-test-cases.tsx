'use client';

import { useState } from 'react';

export interface TestCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
  userType?: 'TALENT' | 'RECRUITER';
}

type TestCase = {
  label: string;
  description: string;
  purpose: string;
  credentials: TestCredentials;
};

const accountCases: Record<'TALENT' | 'RECRUITER', TestCase[]> = {
  TALENT: [
    {
      label: 'Actor account',
      description: 'Mumbai screen actor',
      purpose: 'Apply to acting roles',
      credentials: {
        email: 'talent.demo@example.com',
        password: 'FirstTake1!',
        confirmPassword: 'FirstTake1!',
        userType: 'TALENT',
      },
    },
    {
      label: 'Dancer account',
      description: 'Commercial performer',
      purpose: 'Test a second applicant',
      credentials: {
        email: 'dancer.demo@example.com',
        password: 'FirstTake1!',
        confirmPassword: 'FirstTake1!',
        userType: 'TALENT',
      },
    },
    {
      label: 'Voice artist',
      description: 'Remote voice talent',
      purpose: 'Test portfolio variety',
      credentials: {
        email: 'voice.demo@example.com',
        password: 'FirstTake1!',
        confirmPassword: 'FirstTake1!',
        userType: 'TALENT',
      },
    },
  ],
  RECRUITER: [
    {
      label: 'Studio account',
      description: 'Production company',
      purpose: 'Post film auditions',
      credentials: {
        email: 'recruiter.demo@example.com',
        password: 'FirstTake1!',
        confirmPassword: 'FirstTake1!',
        userType: 'RECRUITER',
      },
    },
    {
      label: 'Agency account',
      description: 'Casting agency',
      purpose: 'Test another pipeline',
      credentials: {
        email: 'agency.demo@example.com',
        password: 'FirstTake1!',
        confirmPassword: 'FirstTake1!',
        userType: 'RECRUITER',
      },
    },
    {
      label: 'Theatre account',
      description: 'Stage company',
      purpose: 'Test recruiter variety',
      credentials: {
        email: 'theatre.demo@example.com',
        password: 'FirstTake1!',
        confirmPassword: 'FirstTake1!',
        userType: 'RECRUITER',
      },
    },
  ],
};

const validationCases: Record<'login' | 'signup', TestCase[]> = {
  login: [
    {
      label: 'Wrong password',
      description: 'Valid email, invalid password',
      purpose: 'Check Firebase error handling',
      credentials: {
        email: 'talent.demo@example.com',
        password: 'WrongPassword1!',
      },
    },
    {
      label: 'Unknown account',
      description: 'Account does not exist',
      purpose: 'Check invalid credentials',
      credentials: {
        email: 'missing.user@example.com',
        password: 'FirstTake1!',
      },
    },
  ],
  signup: [
    {
      label: 'Weak password',
      description: 'Password is too short',
      purpose: 'Check password validation',
      credentials: {
        email: 'weak.demo@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        userType: 'TALENT',
      },
    },
    {
      label: 'Password mismatch',
      description: 'Confirmation is different',
      purpose: 'Check matching validation',
      credentials: {
        email: 'mismatch.demo@example.com',
        password: 'FirstTake1!',
        confirmPassword: 'FirstTake2!',
        userType: 'TALENT',
      },
    },
  ],
};

export function DevTestCases({
  mode,
  onSelect,
}: {
  mode: 'login' | 'signup';
  onSelect: (credentials: TestCredentials) => void;
}) {
  const [group, setGroup] = useState<'TALENT' | 'RECRUITER' | 'VALIDATION'>(
    'TALENT'
  );

  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.NEXT_PUBLIC_SHOW_TEST_CASES === 'false'
  ) {
    return null;
  }

  const cases =
    group === 'VALIDATION' ? validationCases[mode] : accountCases[group];

  return (
    <section className="dev-panel mb-6 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="eyebrow">
            Test library
          </p>
          <p className="mt-1 text-sm leading-5 text-[#536a67]">
            {mode === 'signup'
              ? 'Create a persona once, then use the same persona from Login.'
              : 'Choose one persona at a time to fill the credentials safely.'}
          </p>
        </div>
        <span className="dev-label">
          Development only
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 border border-[#c7d8d5] bg-white p-1">
        {(['TALENT', 'RECRUITER', 'VALIDATION'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setGroup(value)}
            className={`min-h-10 px-2 text-xs font-black ${
              group === value
                ? 'bg-[#07111f] text-white'
                : 'text-[#657176] hover:bg-[#f0f4f3]'
            }`}
          >
            {value === 'VALIDATION' ? 'Errors' : value.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map((testCase, index) => (
          <button
            key={testCase.label}
            type="button"
            onClick={() => onSelect(testCase.credentials)}
            className="group min-h-24 border border-[#cbd8d5] bg-white p-3 text-left hover:border-[#008ca6] hover:shadow-[0_8px_20px_rgba(0,140,166,0.1)]"
          >
            <span className="flex items-center justify-between">
              <span className="text-sm font-black">{testCase.label}</span>
              <span className="flex size-6 items-center justify-center bg-[#edf7f5] text-[10px] font-black text-[#008ca6]">
                {String(index + 1).padStart(2, '0')}
              </span>
            </span>
            <span className="mt-2 block text-xs text-[#657176]">
              {testCase.description}
            </span>
            <span className="mt-1 block text-[11px] font-bold text-[#8b5d15]">
              {testCase.purpose}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#657176]">
        Selecting a case only fills this form. It never creates, signs in, or
        saves anything automatically.
      </p>
    </section>
  );
}
