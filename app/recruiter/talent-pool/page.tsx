'use client';

import Link from 'next/link';
import { Bookmark, Search, Trash2, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import { AppShell } from '@/components/app-shell';
import {
  CinematicSectionHeader,
  MetricCard,
  SafetyNotice,
  WorkspaceHero,
} from '@/components/product-ui';
import { getErrorMessage } from '@/app/lib/error-utils';
import {
  getRecruiterTalentPool,
  removeTalentPoolEntry,
} from '@/app/lib/firestore-service';
import {
  CATEGORY_LABELS,
  type RecruiterTalentPoolEntry,
  type TalentPoolStatus,
} from '@/app/lib/types';
import {
  getTalentPoolEmptyState,
  getTalentPoolGuidance,
  getTalentPoolStatusLabel,
  getTalentPoolStatusTone,
  TALENT_POOL_STATUSES,
} from '@/app/lib/recruiter-talent-pool-policy';

const statusFilters: Array<TalentPoolStatus | 'ALL'> = [
  'ALL',
  ...TALENT_POOL_STATUSES,
];

export default function RecruiterTalentPoolPage() {
  const emptyState = getTalentPoolEmptyState();
  const guidance = getTalentPoolGuidance();
  const [entries, setEntries] = useState<RecruiterTalentPoolEntry[]>([]);
  const [status, setStatus] = useState<TalentPoolStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    void getRecruiterTalentPool()
      .then(setEntries)
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load Talent Pool'))
      )
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const counts = useMemo(
    () => ({
      total: entries.length,
      watchlist: entries.filter((entry) => entry.status === 'WATCHLIST').length,
      futureFit: entries.filter((entry) => entry.status === 'FUTURE_FIT').length,
      doNotContact: entries.filter((entry) => entry.status === 'DO_NOT_CONTACT').length,
    }),
    [entries]
  );

  const visibleEntries = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return entries.filter((entry) => {
      const statusMatch = status === 'ALL' || entry.status === status;
      if (!statusMatch) return false;
      if (!needle) return true;
      return [
        entry.talentNameSnapshot,
        entry.sourceAuditionTitleSnapshot ?? '',
        entry.talentCategorySnapshot ?? '',
        entry.privateNote ?? '',
        ...entry.tags,
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(needle);
    });
  }, [entries, search, status]);

  const removeEntry = async (entry: RecruiterTalentPoolEntry) => {
    const confirmed = window.confirm(
      `Remove ${entry.talentNameSnapshot} from your private Talent Pool?`
    );
    if (!confirmed) return;
    setBusyId(entry.id);
    setError('');
    try {
      await removeTalentPoolEntry(entry.id);
      setEntries((current) => current.filter((item) => item.id !== entry.id));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to remove Talent Pool entry'));
    } finally {
      setBusyId('');
    }
  };

  return (
    <AppShell requiredRole="RECRUITER">
      <WorkspaceHero
        eyebrow="Recruiter Talent Pool"
        title="Keep promising Talent organized for future casting."
        description="Save applicants from the Decision Room, add private role-fit notes, and return to them when a new brief needs the right profile."
        actionHref="/recruiter/auditions"
        actionLabel="Review applicants"
        secondaryHref="/recruiter/auditions/new"
        secondaryLabel="Post a brief"
      />

      <section
        aria-label="Talent Pool summary"
        className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Saved Talent"
          value={counts.total}
          detail="Private to your team account"
          icon={UsersRound}
        />
        <MetricCard
          label="Watchlist"
          value={counts.watchlist}
          detail="Profiles to revisit soon"
          icon={Bookmark}
          tone={counts.watchlist > 0 ? 'attention' : 'neutral'}
        />
        <MetricCard
          label="Future fit"
          value={counts.futureFit}
          detail="Useful for later roles"
          icon={UsersRound}
          tone={counts.futureFit > 0 ? 'success' : 'neutral'}
        />
        <MetricCard
          label="Do not contact"
          value={counts.doNotContact}
          detail="Internal casting memory"
          icon={Trash2}
          tone={counts.doNotContact > 0 ? 'danger' : 'neutral'}
        />
      </section>

      <div className="mt-5">
        <SafetyNotice title={guidance.title}>{guidance.description}</SafetyNotice>
      </div>

      <div className="mt-6">
        <CinematicSectionHeader
          eyebrow="Private casting CRM"
          title="Search saved Talent by status, tag, source audition, or note."
          description="This pool supports human-led recruiter memory. It does not rank Talent or change application outcomes."
        />
      </div>

      <section className="surface mt-5 rounded-md p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <span className="sr-only">Search Talent Pool</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6d7e87]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-11 w-full rounded-md border border-[#cbd6db] bg-white py-2 pl-10 pr-3 text-sm font-bold outline-none focus:border-[#008ca6] focus:ring-2 focus:ring-[#00c2e0]/15"
              placeholder="Search name, tag, audition, or note"
            />
          </label>
          <label>
            <span className="sr-only">Filter Talent Pool by status</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as TalentPoolStatus | 'ALL')
              }
              className="min-h-11 w-full rounded-md border border-[#cbd6db] bg-white px-3 text-sm font-bold outline-none focus:border-[#008ca6] focus:ring-2 focus:ring-[#00c2e0]/15"
            >
              {statusFilters.map((item) => (
                <option key={item} value={item}>
                  {item === 'ALL' ? 'All statuses' : getTalentPoolStatusLabel(item)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error && (
        <ErrorState
          title="Talent Pool could not be loaded"
          message="We could not load this section. Try refreshing the page."
          onRetry={() => {
            setLoading(true);
            setError('');
            setReloadKey((current) => current + 1);
          }}
        />
      )}

      {loading ? (
        <LoadingState label="Loading Talent Pool..." />
      ) : error ? null : visibleEntries.length === 0 ? (
        <EmptyState
          title={entries.length === 0 ? emptyState.title : 'No matching Talent found'}
          message={
            entries.length === 0
              ? emptyState.description
              : 'Try a different tag, status, name, or source audition.'
          }
          actionHref="/recruiter/auditions"
          actionLabel={emptyState.action}
        />
      ) : (
        <div className="mt-5 grid gap-4">
          {visibleEntries.map((entry) => (
            <article key={entry.id} className="surface rounded-md p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black leading-tight">
                      {entry.talentNameSnapshot}
                    </h2>
                    <span
                      className={`rounded-md border px-2.5 py-1 text-xs font-black uppercase ${talentPoolToneClass(
                        getTalentPoolStatusTone(entry.status)
                      )}`}
                    >
                      {getTalentPoolStatusLabel(entry.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#657176]">
                    {formatCategory(entry.talentCategorySnapshot)}
                    {entry.sourceAuditionTitleSnapshot
                      ? ` · Saved from ${entry.sourceAuditionTitleSnapshot}`
                      : ' · Saved from applicant review'}
                  </p>
                  {entry.privateNote && (
                    <p className="mt-3 max-w-4xl rounded-md border border-[#d9e4e6] bg-[#f7fbfb] p-3 text-sm leading-6 text-[#4f5963]">
                      {entry.privateNote}
                    </p>
                  )}
                  {entry.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-[#bad7d3] bg-[#edf7f5] px-2.5 py-1 text-xs font-bold text-[#006b60]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-xs font-bold uppercase text-[#7b8a90]">
                    Updated {formatPoolDate(entry)}
                  </p>
                </div>
                <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:w-52 lg:grid-cols-1">
                  {entry.talentPublicSlug && (
                    <Link
                      href={`/t/${entry.talentPublicSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-button"
                    >
                      View portfolio
                    </Link>
                  )}
                  {entry.sourceAuditionId && (
                    <Link
                      href={`/recruiter/auditions/${entry.sourceAuditionId}/applicants`}
                      className="secondary-button"
                    >
                      Source review
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void removeEntry(entry)}
                    disabled={busyId === entry.id}
                    className="secondary-button border-red-200 text-red-700 disabled:opacity-50"
                  >
                    {busyId === entry.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function formatCategory(category?: RecruiterTalentPoolEntry['talentCategorySnapshot']) {
  if (!category) return 'Category not saved';
  return CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;
}

function formatPoolDate(entry: RecruiterTalentPoolEntry) {
  const value = entry.updatedAt ?? entry.createdAt;
  if (!value) return 'recently';
  if (value instanceof Date) return value.toLocaleDateString();
  return value.toDate().toLocaleDateString();
}

function talentPoolToneClass(tone: string) {
  if (tone === 'positive') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
  if (tone === 'attention') {
    return 'border-[#e7d69a] bg-[#fff9e8] text-[#7a5608]';
  }
  if (tone === 'caution') {
    return 'border-red-200 bg-red-50 text-red-700';
  }
  return 'border-[#bad7d3] bg-[#edf7f5] text-[#006b60]';
}
