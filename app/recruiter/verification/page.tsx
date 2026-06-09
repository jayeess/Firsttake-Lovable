'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getRecruiterProfile } from '@/app/lib/firestore-service';
import {
  hasRecruiterApproval,
  setDemoRecruiterApproval,
} from '@/app/lib/recruiter-access';
import type { RecruiterProfile } from '@/app/lib/types';
import { useAuth } from '@/context/auth-context';

export default function RecruiterVerificationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    void getRecruiterProfile(user.uid).then((data) => {
      if (!data) {
        router.replace('/recruiter/profile');
        return;
      }
      setProfile(data);
      setLoading(false);
    });
  }, [router, user]);

  const approved = Boolean(
    user && profile && hasRecruiterApproval(user.uid, profile)
  );

  return (
    <AppShell requiredRole="RECRUITER">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Recruiter verification</p>
        <h1 className="mt-2 text-4xl font-black">
          {approved ? 'Your workspace is approved.' : 'Approval is pending.'}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-[#657176]">
          {approved
            ? 'You can publish casting calls and manage applicants from your recruiter workspace.'
            : 'Your company profile is saved. An administrator must verify the organisation before publishing new auditions.'}
        </p>

        <section className="surface mt-7 p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <StatusStep
              label="Company profile"
              complete={!loading && Boolean(profile)}
            />
            <StatusStep label="Admin review" complete={approved} />
            <StatusStep label="Recruiter access" complete={approved} />
          </div>

          <div className="mt-7 flex flex-wrap gap-3 border-t border-[#e1e5ea] pt-6">
            {approved ? (
              <Link href="/dashboard" className="primary-button">
                Open recruiter workspace
              </Link>
            ) : (
              <>
                <Link href="/recruiter/profile" className="secondary-button">
                  Review company profile
                </Link>
                {process.env.NODE_ENV === 'development' && user && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setDemoRecruiterApproval(user.uid);
                      router.replace('/dashboard');
                    }}
                  >
                    Simulate admin approval
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatusStep({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="border border-[#dfe3e1] p-4">
      <p className="text-xs font-bold uppercase text-[#778287]">{label}</p>
      <p
        className={`mt-3 font-bold ${
          complete ? 'text-[#008ca6]' : 'text-[#9a6a15]'
        }`}
      >
        {complete ? 'Complete' : 'Pending'}
      </p>
    </div>
  );
}
