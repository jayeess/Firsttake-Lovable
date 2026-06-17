'use client';

import { Bookmark, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  filterAuditions,
  initialAuditionFilters,
  scoreAuditionRecommendation,
  sortAuditions,
  type AuditionDiscoveryFilters,
  type AuditionSort,
} from '@/app/lib/audition-discovery';
import { getErrorMessage } from '@/app/lib/error-utils';
import {
  getAuditions,
  getSavedAuditions,
  getTalentProfile,
  setAuditionSaved,
} from '@/app/lib/firestore-service';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  type Audition,
  type AuditionType,
  type ExperienceLevel,
  type PaymentType,
  type TalentCategory,
  type TalentProfile,
  type WorkMode,
} from '@/app/lib/types';
import { AppShell } from '@/components/app-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import { AuditionCard } from '@/components/audition-card';
import { useAuth } from '@/context/auth-context';

const getActiveFilters = (
  filters: AuditionDiscoveryFilters
): Array<{ key: keyof AuditionDiscoveryFilters; label: string }> => {
  const labels: Array<{
    key: keyof AuditionDiscoveryFilters;
    label: string;
  }> = [];
  if (filters.category)
    labels.push({ key: 'category', label: CATEGORY_LABELS[filters.category] });
  if (filters.experience)
    labels.push({
      key: 'experience',
      label: EXPERIENCE_LABELS[filters.experience],
    });
  if (filters.location)
    labels.push({ key: 'location', label: filters.location });
  if (filters.language)
    labels.push({ key: 'language', label: filters.language });
  if (filters.auditionType)
    labels.push({
      key: 'auditionType',
      label: filters.auditionType.replace(/_/g, ' '),
    });
  if (filters.paymentType)
    labels.push({
      key: 'paymentType',
      label: filters.paymentType.toLowerCase(),
    });
  if (filters.workMode)
    labels.push({
      key: 'workMode',
      label: filters.workMode.toLowerCase(),
    });
  if (filters.verifiedOnly)
    labels.push({ key: 'verifiedOnly', label: 'Verified recruiters' });
  if (filters.recentlyPosted)
    labels.push({ key: 'recentlyPosted', label: 'Recently posted' });
  if (filters.deadlineSoon)
    labels.push({ key: 'deadlineSoon', label: 'Deadline soon' });
  return labels;
};

export default function AuditionsPage() {
  const { user } = useAuth();
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState(initialAuditionFilters);
  const [sort, setSort] = useState<AuditionSort>('NEWEST');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      getAuditions(),
      getTalentProfile(user.uid).catch(() => null),
      getSavedAuditions(user.uid).catch(() => []),
    ])
      .then(([auditionData, profileData, saved]) => {
        setAuditions(auditionData);
        setProfile(profileData);
        setSavedIds(new Set(saved.map((item) => item.auditionId)));
      })
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load auditions'))
      )
      .finally(() => setLoading(false));
  }, [reloadKey, user]);

  const activeFilters = getActiveFilters(filters);
  const savedAvailableCount = useMemo(
    () =>
      filterAuditions(
        auditions,
        { ...initialAuditionFilters, savedOnly: true },
        savedIds
      ).length,
    [auditions, savedIds]
  );
  const visible = useMemo(
    () =>
      sortAuditions(
        filterAuditions(auditions, filters, savedIds),
        sort,
        profile,
        filters.search
      ),
    [auditions, filters, profile, savedIds, sort]
  );

  const toggleSaved = async (auditionId: string) => {
    const nextSaved = !savedIds.has(auditionId);
    setSavingId(auditionId);
    setError('');
    try {
      await setAuditionSaved(auditionId, nextSaved);
      setSavedIds((current) => {
        const next = new Set(current);
        if (nextSaved) next.add(auditionId);
        else next.delete(auditionId);
        return next;
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to update saved auditions'));
    } finally {
      setSavingId('');
    }
  };

  const clearFilter = (key: keyof AuditionDiscoveryFilters) => {
    setFilters((current) => ({
      ...current,
      [key]: typeof current[key] === 'boolean' ? false : '',
    }));
  };

  const setSavedView = (savedOnly: boolean) => {
    setFilters((current) => ({ ...current, savedOnly }));
  };

  const clearSearchFilters = () => {
    setFilters((current) => ({
      ...initialAuditionFilters,
      savedOnly: current.savedOnly,
    }));
  };

  return (
    <AppShell requiredRole="TALENT">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Opportunity discovery</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
            Find the right next role.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657176] sm:text-base sm:leading-7">
            Search verified casting calls, save promising briefs, and surface
            opportunities that fit your profile.
          </p>
        </div>
        <div className="rounded-md border border-[#d7e0e4] bg-white p-4 sm:border-l-2 sm:border-l-[#d8a843]">
          <p className="text-2xl font-black">{visible.length}</p>
          <p className="text-xs font-bold uppercase text-[#657176]">
            {filters.savedOnly ? 'Saved opportunities' : 'Active opportunities'}
          </p>
        </div>
      </header>

      <section
        aria-label="Audition search and filters"
        className="mt-6 rounded-md border border-[#cbd6db] bg-white/95 p-3 shadow-sm sm:p-4"
      >
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="grid grid-cols-2 rounded-md border border-[#cbd6db] bg-[#f5f8f9] p-1 sm:inline-grid"
            role="tablist"
            aria-label="Audition view"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!filters.savedOnly}
              onClick={() => setSavedView(false)}
              className={`min-h-11 rounded px-4 text-sm font-black transition ${
                !filters.savedOnly
                  ? 'bg-white text-[#07111f] shadow-sm'
                  : 'text-[#657176] hover:text-[#008ca6]'
              }`}
            >
              All auditions
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filters.savedOnly}
              onClick={() => setSavedView(true)}
              className={`flex min-h-11 items-center justify-center gap-2 rounded px-4 text-sm font-black transition ${
                filters.savedOnly
                  ? 'bg-white text-[#07111f] shadow-sm'
                  : 'text-[#657176] hover:text-[#008ca6]'
              }`}
            >
              <Bookmark className="size-4" />
              Saved
              <span className="rounded bg-[#e8f5f3] px-1.5 py-0.5 text-xs text-[#008ca6]">
                {savedAvailableCount}
              </span>
            </button>
          </div>
          <p className="text-sm font-semibold text-[#657176]">
            {filters.savedOnly
              ? 'Showing roles you bookmarked for later.'
              : 'Browse all active casting calls.'}
          </p>
        </div>

        <div className="grid gap-2 sm:gap-3 md:grid-cols-[minmax(0,1fr)_220px_150px] md:items-center">
          <label className="relative min-w-0">
            <span className="sr-only">Search auditions</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#657176]"
            />
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Search role, project, company, or location"
              className="field rounded-md !pl-11 !pr-4 text-sm placeholder:font-normal"
            />
          </label>
          <label className="relative min-w-0">
            <span className="sr-only">Sort auditions</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as AuditionSort)}
              className="field rounded-md appearance-none !pr-10 text-sm font-bold"
            >
              <option value="NEWEST">Newest first</option>
              <option value="DEADLINE">Deadline soon</option>
              <option value="RELEVANCE">Most relevant</option>
              <option value="RECOMMENDED">Recommended for you</option>
              <option value="UPDATED">Recently updated</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#657176]"
            />
          </label>
          <button
            type="button"
            onClick={() => setFiltersOpen((current) => !current)}
            className="secondary-button rounded-md text-sm sm:w-auto md:w-full"
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {activeFilters.length > 0 && ` (${activeFilters.length})`}
          </button>
        </div>

        {filtersOpen && (
          <div className="mt-3 grid gap-3 border-t border-[#e1e5ea] pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <SelectFilter
              label="Category"
              value={filters.category}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  category: value as TalentCategory | '',
                }))
              }
              options={CATEGORY_LABELS}
            />
            <SelectFilter
              label="Experience"
              value={filters.experience}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  experience: value as ExperienceLevel | '',
                }))
              }
              options={EXPERIENCE_LABELS}
            />
            <TextFilter
              label="Location"
              value={filters.location}
              onChange={(location) =>
                setFilters((current) => ({ ...current, location }))
              }
            />
            <TextFilter
              label="Language"
              value={filters.language}
              onChange={(language) =>
                setFilters((current) => ({ ...current, language }))
              }
            />
            <SelectFilter
              label="Project type"
              value={filters.auditionType}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  auditionType: value as AuditionType | '',
                }))
              }
              options={{
                FILM: 'Film',
                SERIES: 'Series',
                COMMERCIAL: 'Commercial',
                THEATRE: 'Theatre',
                VOICE_OVER: 'Voice over',
                LIVE_EVENT: 'Live event',
                OTHER: 'Other',
              }}
            />
            <SelectFilter
              label="Compensation"
              value={filters.paymentType}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  paymentType: value as PaymentType | '',
                }))
              }
              options={{
                PAID: 'Paid',
                HONORARIUM: 'Honorarium',
                UNPAID: 'Unpaid',
                UNSPECIFIED: 'Not specified',
              }}
            />
            <SelectFilter
              label="Work mode"
              value={filters.workMode}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  workMode: value as WorkMode | '',
                }))
              }
              options={{
                ONSITE: 'Onsite',
                REMOTE: 'Remote',
                HYBRID: 'Hybrid',
              }}
            />
            <div className="grid gap-2">
              <FilterToggle
                label="Verified recruiter"
                checked={filters.verifiedOnly}
                onChange={(verifiedOnly) =>
                  setFilters((current) => ({ ...current, verifiedOnly }))
                }
              />
              <FilterToggle
                label="Recently posted"
                checked={filters.recentlyPosted}
                onChange={(recentlyPosted) =>
                  setFilters((current) => ({ ...current, recentlyPosted }))
                }
              />
              <FilterToggle
                label="Deadline within 7 days"
                checked={filters.deadlineSoon}
                onChange={(deadlineSoon) =>
                  setFilters((current) => ({ ...current, deadlineSoon }))
                }
              />
            </div>
          </div>
        )}

        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeFilters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => clearFilter(item.key)}
                className="min-h-9 rounded-md border border-[#9fc9c4] bg-[#edf7f5] px-3 py-1.5 text-xs font-bold text-[#006d7f]"
              >
                {item.label} ×
              </button>
            ))}
            <button
              type="button"
              onClick={clearSearchFilters}
              className="min-h-9 px-2 py-1.5 text-xs font-bold text-[#a33d35]"
            >
              Clear all
            </button>
          </div>
        )}
      </section>

      {error && (
        <ErrorState
          title="Audition discovery needs attention"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            setReloadKey((current) => current + 1);
          }}
        />
      )}

      {loading ? (
        <LoadingState label="Matching active auditions to your profile..." />
      ) : error ? null : visible.length === 0 ? (
        <EmptyState
          title={filters.savedOnly ? 'No saved auditions yet' : 'No matching auditions'}
          message={
            filters.savedOnly
              ? 'Use the bookmark button on any audition card to build your saved list.'
              : 'Try removing a filter or broadening your search.'
          }
        />
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {visible.map((audition) => (
            <AuditionCard
              key={audition.id}
              audition={audition}
              saved={savedIds.has(audition.id)}
              saving={savingId === audition.id}
              recommendationScore={
                sort === 'RECOMMENDED'
                  ? scoreAuditionRecommendation(audition, profile)
                  : undefined
              }
              onToggleSaved={() => void toggleSaved(audition.id)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-2 font-normal"
      >
        <option value="">All</option>
        {Object.entries(options).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-2 font-normal"
        placeholder={`Any ${label.toLowerCase()}`}
      />
    </label>
  );
}

function FilterToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-9 items-center gap-2 text-sm font-bold">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[#008ca6]"
      />
      {label}
    </label>
  );
}
