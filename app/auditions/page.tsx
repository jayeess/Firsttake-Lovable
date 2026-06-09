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

export default function AuditionsPage() {
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TalentCategory | ''>('');
  const [experience, setExperience] = useState<ExperienceLevel | ''>('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getAuditions()
      .then(setAuditions)
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load auditions'))
      )
      .finally(() => setLoading(false));
  }, []);

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
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-[#2e75b6]">
            Opportunity board
          </p>
          <h1 className="mt-1 text-3xl font-bold">Browse auditions</h1>
        </div>
        <p className="text-sm text-[#65707b]">{filtered.length} opportunities</p>
      </div>

      <section className="mt-6 grid gap-4 border border-[#d9dee5] bg-white p-4 md:grid-cols-4">
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

      {error && <p className="mt-5 border border-red-300 bg-red-50 p-4 text-red-800">{error}</p>}
      {loading ? (
        <p className="mt-8 text-[#65707b]">Loading auditions...</p>
      ) : filtered.length === 0 ? (
        <div className="mt-8 border border-dashed border-[#b8c1ca] bg-white p-10 text-center">
          <h2 className="text-xl font-bold">No matching auditions</h2>
          <p className="mt-2 text-[#68727c]">Try changing your filters or ask a recruiter to publish the first opportunity.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {filtered.map((audition) => <AuditionCard key={audition.id} audition={audition} />)}
        </div>
      )}
    </AppShell>
  );
}
