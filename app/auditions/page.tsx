'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { AuditionCard } from '@/components/audition-card';
import { getAuditions } from '@/app/lib/firestore-service';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  type Audition,
  type ExperienceLevel,
  type TalentCategory,
} from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';

export default function AuditionsPage() {
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TalentCategory | ''>('');
  const [experience, setExperience] = useState<ExperienceLevel | ''>('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    void getAuditions()
      .then(setAuditions)
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load auditions'))
      )
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return auditions.filter((audition) => {
      const matchesSearch =
        !query ||
        audition.title.toLowerCase().includes(query) ||
        audition.description.toLowerCase().includes(query) ||
        audition.recruiterName?.toLowerCase().includes(query);
      return (
        matchesSearch &&
        (!category || audition.category === category) &&
        (!experience || audition.experienceLevel === experience) &&
        (!location ||
          audition.location.toLowerCase().includes(location.toLowerCase()))
      );
    });
  }, [auditions, category, experience, location, search]);

  return (
    <AppShell requiredRole="TALENT">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">
            Opportunity board
          </p>
          <h1 className="mt-2 text-4xl font-black">Roles worth showing up for.</h1>
          <p className="mt-3 max-w-2xl leading-7 text-[#657176]">
            Search active casting calls, compare the brief, and apply with one professional profile.
          </p>
        </div>
        <p className="border-l-2 border-[#d8a843] pl-4 text-sm font-bold text-[#65707b]">{filtered.length} open opportunities</p>
      </div>

      <section className="surface mt-7 grid gap-4 p-4 md:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or company"
          className="field"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value as TalentCategory | '')} className="field">
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={experience} onChange={(e) => setExperience(e.target.value as ExperienceLevel | '')} className="field">
          <option value="">All experience levels</option>
          {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="field" />
      </section>

      {error && (
        <ErrorState
          title="Auditions could not be loaded"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            setReloadKey((current) => current + 1);
          }}
        />
      )}
      {loading ? (
        <LoadingState label="Loading active auditions..." />
      ) : error ? null : filtered.length === 0 ? (
        <EmptyState
          title="No matching auditions"
          message="Try changing your filters. New verified casting calls will appear here when recruiters publish them."
        />
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {filtered.map((audition) => <AuditionCard key={audition.id} audition={audition} />)}
        </div>
      )}
    </AppShell>
  );
}
