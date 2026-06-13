'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAdminData } from '@/app/lib/admin-client';
import type {
  TalentProfile,
  TalentVerification,
  TalentMedia,
} from '@/app/lib/types';
import { AdminActionButton } from '@/components/admin-action-button';
import { AdminShell } from '@/components/admin-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import { VerifiedBadge } from '@/components/verified-badge';

type TalentReview = TalentVerification & {
  id: string;
  profile: TalentProfile | null;
  media: TalentMedia[];
};

export default function AdminTalentsPage() {
  const [items, setItems] = useState<TalentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    void fetchAdminData<{ talents: TalentReview[] }>('talentVerifications')
      .then((data) => setItems(data.talents))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  return (
    <AdminShell>
      <p className="eyebrow">Talent trust</p>
      <h1 className="mt-2 text-4xl font-black">Talent verification</h1>
      <p className="mt-3 max-w-3xl leading-7 text-[#657176]">
        Review profile quality and identity context without blocking normal
        Talent participation.
      </p>

      {error && (
        <ErrorState
          title="Talent reviews could not be loaded"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            load();
          }}
        />
      )}
      {loading ? (
        <LoadingState label="Loading Talent verification requests..." />
      ) : !error && items.length === 0 ? (
        <EmptyState
          title="No Talent verification requests"
          message="Eligible Talent submissions will appear here."
        />
      ) : (
        <div className="mt-7 grid gap-4">
          {items.map((item) => {
            const name = item.profile
              ? `${item.profile.firstName} ${item.profile.lastName}`.trim()
              : item.talentEmail || item.id;
            return (
              <article key={item.id} className="surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-black uppercase text-[#008ca6]">
                        {item.talentVerificationStatus.replace('_', ' ')}
                      </p>
                      {item.talentVerificationStatus === 'verified' && (
                        <VerifiedBadge subject="talent" />
                      )}
                    </div>
                    <h2 className="mt-2 text-2xl font-black">{name}</h2>
                    <p className="mt-1 text-sm text-[#657176]">
                      {item.talentEmail || item.id}
                    </p>
                    <p className="mt-3 font-bold">
                      Profile completeness: {item.profileCompletenessScore}%
                    </p>
                    <p className="mt-2 text-sm font-bold text-[#657176]">
                      Public profile:{' '}
                      {item.profile?.publicProfileEnabled
                        ? `/t/${item.profile.publicSlug}`
                        : 'Disabled'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.talentVerificationStatus === 'pending' && (
                      <>
                        <AdminActionButton
                          action="verify_talent"
                          targetId={item.id}
                          label="Verify"
                          onComplete={load}
                        />
                        <AdminActionButton
                          action="reject_talent"
                          targetId={item.id}
                          label="Reject"
                          tone="danger"
                          onComplete={load}
                        />
                      </>
                    )}
                    {item.talentVerificationStatus === 'suspended' ? (
                      <AdminActionButton
                        action="restore_talent"
                        targetId={item.id}
                        label="Restore"
                        tone="secondary"
                        onComplete={load}
                      />
                    ) : item.talentVerificationStatus !== 'not_submitted' ? (
                      <AdminActionButton
                        action="suspend_talent"
                        targetId={item.id}
                        label="Suspend"
                        tone="danger"
                        onComplete={load}
                      />
                    ) : null}
                    {item.profile?.publicProfileEnabled && (
                      <>
                        <a
                          href={`/t/${item.profile.publicSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-10 items-center border border-[#b8c7cd] bg-white px-3 text-xs font-black hover:border-[#008ca6]"
                        >
                          View public page
                        </a>
                        <AdminActionButton
                          action="disable_public_profile"
                          targetId={item.id}
                          label="Disable public page"
                          tone="danger"
                          onComplete={load}
                        />
                      </>
                    )}
                  </div>
                </div>

                {item.profile && (
                  <dl className="mt-5 grid gap-4 border-t border-[#e0e6e9] pt-5 sm:grid-cols-3">
                    <Info label="Category" value={item.profile.category} />
                    <Info
                      label="Experience"
                      value={item.profile.experienceLevel}
                    />
                    <Info
                      label="Location"
                      value={item.profile.location || 'Not provided'}
                    />
                  </dl>
                )}
                {item.media?.length > 0 && (
                  <section className="mt-5 border-t border-[#e0e6e9] pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-black">Portfolio moderation</h3>
                      <span className="text-sm font-bold text-[#657176]">
                        {item.media.length} items
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {item.media.map((media) => (
                        <article
                          key={media.id}
                          className="border border-[#d8e1e5] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black">{media.title}</p>
                              <p className="mt-1 text-xs font-bold uppercase text-[#718087]">
                                {media.type.replace('_', ' ')} ·{' '}
                                {media.moderationStatus}
                              </p>
                            </div>
                            {media.url && (
                              <a
                                href={media.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-bold text-[#008ca6]"
                              >
                                Review
                              </a>
                            )}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {media.moderationStatus === 'active' ? (
                              <>
                                <AdminActionButton
                                  action="hide_media"
                                  targetId={`${item.id}:${media.id}`}
                                  label="Hide"
                                  tone="secondary"
                                  onComplete={load}
                                />
                                <AdminActionButton
                                  action="remove_media"
                                  targetId={`${item.id}:${media.id}`}
                                  label="Remove"
                                  tone="danger"
                                  onComplete={load}
                                />
                              </>
                            ) : (
                              <AdminActionButton
                                action="restore_media"
                                targetId={`${item.id}:${media.id}`}
                                label="Restore"
                                tone="secondary"
                                onComplete={load}
                              />
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
                {item.rejectedReason && (
                  <p className="mt-4 border-l-2 border-red-400 pl-3 text-sm text-red-800">
                    Review reason: {item.rejectedReason}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase text-[#7c8990]">{label}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
    </div>
  );
}
