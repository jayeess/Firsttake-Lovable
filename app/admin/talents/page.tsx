'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Image as ImageIcon,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { fetchAdminData } from '@/app/lib/admin-client';
import type {
  TalentProfile,
  TalentVerification,
  TalentMedia,
} from '@/app/lib/types';
import { calculateTalentProfileCompleteness } from '@/app/lib/profile-completeness';
import { AdminActionButton } from '@/components/admin-action-button';
import { AdminShell } from '@/components/admin-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import { VerifiedBadge } from '@/components/verified-badge';
import {
  AdminActionGroup,
  AdminDangerActionGroup,
  AdminInfo,
  AdminStatusBadge,
} from '@/components/admin-ui';
import {
  MetricCard,
  SafetyNotice,
  SectionHeader,
  WorkspaceHero,
} from '@/components/product-ui';

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
  const pendingCount = items.filter(
    (item) => item.talentVerificationStatus === 'pending'
  ).length;
  const verifiedCount = items.filter(
    (item) => item.talentVerificationStatus === 'verified'
  ).length;
  const suspendedCount = items.filter(
    (item) => item.talentVerificationStatus === 'suspended'
  ).length;
  const activeMediaCount = items.reduce(
    (total, item) =>
      total +
      (item.media?.filter((media) => media.moderationStatus === 'active')
        .length ?? 0),
    0
  );

  return (
    <AdminShell>
      <WorkspaceHero
        eyebrow="Talent trust"
        title="Talent verification"
        description="Review profile quality, completeness, media, and identity context without blocking normal Talent participation."
        secondaryHref="/admin/audit-logs"
        secondaryLabel="Review audit history"
      />
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pending reviews"
          value={pendingCount}
          detail="Needs trust decision"
          icon={UserCheck}
          tone={pendingCount > 0 ? 'attention' : 'success'}
        />
        <MetricCard
          label="Verified Talent"
          value={verifiedCount}
          detail="Trusted profile badge"
          icon={CheckCircle2}
          tone="success"
        />
        <MetricCard
          label="Active media"
          value={activeMediaCount}
          detail="Portfolio items in review set"
          icon={ImageIcon}
        />
        <MetricCard
          label="Suspended"
          value={suspendedCount}
          detail="Trust badge restricted"
          icon={ShieldAlert}
          tone={suspendedCount > 0 ? 'danger' : 'success'}
        />
      </section>
      <div className="mt-5">
        <SafetyNotice title="Talent review boundaries" icon={ShieldAlert}>
          Profile completeness, verification status, public profile state,
          portfolio moderation, and enforcement are separate decisions. Do not
          reduce normal Talent usage unless account safety requires it.
        </SafetyNotice>
      </div>

      {error && (
        <ErrorState
          title="We could not load this section"
          message="Try refreshing the page. If it continues, check admin access and network status."
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
          message="Eligible Talent submissions will appear here with profile readiness, portfolio context, and trust state."
        />
      ) : (
        <div className="mt-7 grid gap-4">
          {items.map((item) => {
            const name = item.profile
              ? `${item.profile.firstName} ${item.profile.lastName}`.trim()
              : item.talentEmail || item.id;
            const completeness = item.profile
              ? calculateTalentProfileCompleteness(item.profile)
              : null;
            const completenessScore =
              completeness?.score ?? item.profileCompletenessScore ?? 0;
            const activeMediaCount =
              item.media?.filter((media) => media.moderationStatus === 'active')
                .length ?? 0;
            return (
              <article
                key={item.id}
                className={`surface rounded-md p-5 sm:p-6 ${
                  item.talentVerificationStatus === 'pending'
                    ? 'border-[#e7ad2d]'
                    : ''
                }`}
              >
                <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge
                        tone={
                          item.talentVerificationStatus === 'pending'
                            ? 'attention'
                            : item.talentVerificationStatus === 'verified'
                              ? 'success'
                              : item.talentVerificationStatus === 'suspended'
                                ? 'danger'
                                : 'muted'
                        }
                      >
                        {item.talentVerificationStatus.replace('_', ' ')}
                      </AdminStatusBadge>
                      {item.talentVerificationStatus === 'verified' && (
                        <VerifiedBadge subject="talent" />
                      )}
                    </div>
                    <h2 className="mt-2 text-2xl font-black">{name}</h2>
                    <p className="mt-1 text-sm text-[#657176]">
                      {item.talentEmail || item.id}
                    </p>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <AdminInfo
                        label="Profile completeness"
                        value={`${completenessScore}%`}
                      />
                      <AdminInfo
                        label="Talent verification"
                        value={item.talentVerificationStatus.replace('_', ' ')}
                      />
                      <AdminInfo
                        label="Public profile"
                        value={
                          item.profile?.publicProfileEnabled
                            ? `Enabled /t/${item.profile.publicSlug}`
                            : 'Disabled'
                        }
                      />
                      <AdminInfo
                        label="Portfolio moderation"
                        value={`${activeMediaCount} active item${
                          activeMediaCount === 1 ? '' : 's'
                        }`}
                      />
                    </dl>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <section className="rounded-md border border-[#d8e2e6] bg-[#f8fbfc] p-3">
                        <SectionHeader
                          eyebrow="Profile completion"
                          title={`${completenessScore}% complete`}
                          description="Required profile signals only. Verification, public profile, and moderation are tracked separately."
                        />
                      </section>
                      <section className="rounded-md border border-[#d8e2e6] bg-[#f8fbfc] p-3">
                        <SectionHeader
                          eyebrow="Verification signals"
                          title={item.talentVerificationStatus.replace('_', ' ')}
                          description="Trust badge state and review outcome for recruiter-facing confidence."
                        />
                      </section>
                      <section className="rounded-md border border-[#d8e2e6] bg-[#f8fbfc] p-3">
                        <SectionHeader
                          eyebrow="Portfolio review"
                          title={`${activeMediaCount} active item${
                            activeMediaCount === 1 ? '' : 's'
                          }`}
                          description="Media moderation is independent from profile completeness."
                        />
                      </section>
                      <section className="rounded-md border border-[#d8e2e6] bg-[#f8fbfc] p-3">
                        <SectionHeader
                          eyebrow="Account safety"
                          title={
                            item.talentVerificationStatus === 'suspended'
                              ? 'Restricted'
                              : 'Normal'
                          }
                          description="Suspension should be reserved for trust and safety concerns."
                        />
                      </section>
                    </div>
                    {completeness && completeness.missingFields.length > 0 && (
                      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <p className="font-black">Missing completeness items</p>
                        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                          {completeness.missingFields.map((label) => (
                            <li key={label}>- {label}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-3">
                    {item.talentVerificationStatus === 'pending' && (
                      <AdminActionGroup>
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
                          tone="secondary"
                          onComplete={load}
                        />
                      </AdminActionGroup>
                    )}
                    {item.talentVerificationStatus !== 'not_submitted' && (
                      <AdminDangerActionGroup>
                        {item.talentVerificationStatus === 'suspended' ? (
                          <AdminActionButton
                            action="restore_talent"
                            targetId={item.id}
                            label="Restore"
                            tone="secondary"
                            onComplete={load}
                          />
                        ) : (
                          <AdminActionButton
                            action="suspend_talent"
                            targetId={item.id}
                            label="Suspend"
                            tone="danger"
                            onComplete={load}
                          />
                        )}
                      </AdminDangerActionGroup>
                    )}
                    {item.profile?.publicProfileEnabled && (
                      <AdminActionGroup title="Public profile">
                        <Link
                          href={`/t/${item.profile.publicSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-10 items-center border border-[#b8c7cd] bg-white px-3 text-xs font-black hover:border-[#008ca6]"
                        >
                          View public page
                        </Link>
                        <AdminActionButton
                          action="disable_public_profile"
                          targetId={item.id}
                          label="Disable public page"
                          tone="danger"
                          onComplete={load}
                        />
                      </AdminActionGroup>
                    )}
                  </div>
                </div>

                {item.profile && (
                  <dl className="mt-5 grid gap-4 border-t border-[#e0e6e9] pt-5 sm:grid-cols-3">
                    <AdminInfo label="Category" value={item.profile.category} />
                    <AdminInfo
                      label="Experience"
                      value={item.profile.experienceLevel}
                    />
                    <AdminInfo
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
                          className="rounded-md border border-[#d8e1e5] p-4"
                      >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black">{media.title}</p>
                              <p className="mt-1 text-xs font-bold uppercase text-[#718087]">
                                {media.type.replace('_', ' ')} /{' '}
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
                          <div className="mt-4">
                            {media.moderationStatus === 'active' ? (
                              <AdminDangerActionGroup title="Media moderation">
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
                              </AdminDangerActionGroup>
                            ) : (
                              <AdminActionGroup title="Media moderation">
                                <AdminActionButton
                                  action="restore_media"
                                  targetId={`${item.id}:${media.id}`}
                                  label="Restore"
                                  tone="secondary"
                                  onComplete={load}
                                />
                              </AdminActionGroup>
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
