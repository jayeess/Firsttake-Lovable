'use client';

import { Copy, ExternalLink, Globe2, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getFirebaseAuth } from '@/app/lib/firebase';
import {
  canPublishTalentProfile,
  normalizePublicTalentSlug,
  validatePublicTalentSlug,
} from '@/app/lib/public-talent-profile-policy';
import type { TalentProfile } from '@/app/lib/types';

export function PublicTalentProfileSettings({
  profile,
  onProfileChange,
}: {
  profile: TalentProfile;
  onProfileChange: (updates: Partial<TalentProfile>) => void;
}) {
  const suggestedSlug = useMemo(
    () =>
      normalizePublicTalentSlug(
        profile.publicSlug ||
          `${profile.firstName}-${profile.lastName}`
      ),
    [profile.firstName, profile.lastName, profile.publicSlug]
  );
  const [slug, setSlug] = useState(suggestedSlug);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const enabled = profile.publicProfileEnabled === true;
  const savedSlug = profile.publicSlug || slug;
  const relativeUrl = savedSlug ? `/t/${savedSlug}` : '';

  const run = async (action: 'enable' | 'disable' | 'updateSlug' | 'refresh') => {
    const normalizedSlug = normalizePublicTalentSlug(slug);
    if (action !== 'disable') {
      const slugError = validatePublicTalentSlug(normalizedSlug);
      if (slugError) {
        setError(slugError);
        return;
      }
    }
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      setError('Please sign in again.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/talent/public-profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          slug: normalizedSlug,
          showLocation: profile.publicShowLocation !== false,
          showSocialLinks: profile.publicShowSocialLinks !== false,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        enabled?: boolean;
        slug?: string;
        publicMediaCount?: number;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Public profile could not be updated.');
      }
      const nextSlug = payload.slug || normalizedSlug;
      setSlug(nextSlug);
      onProfileChange({
        publicProfileEnabled: payload.enabled === true,
        publicSlug: nextSlug,
      });
      setMessage(
        payload.enabled
          ? `Public profile updated with ${payload.publicMediaCount ?? 0} public portfolio items.`
          : 'Public profile disabled.'
      );
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Public profile could not be updated.'
      );
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!relativeUrl) return;
    await navigator.clipboard.writeText(`${window.location.origin}${relativeUrl}`);
    setMessage('Public profile link copied.');
  };

  return (
    <section className="surface mt-6 p-6" aria-label="Public Talent profile">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Shareable profile</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black">Public Talent page</h2>
            <span
              className={`border px-2 py-1 text-xs font-black uppercase ${
                enabled
                  ? 'border-green-300 bg-green-50 text-green-800'
                  : 'border-[#cbd6db] bg-[#f4f7f8] text-[#607078]'
              }`}
            >
              {enabled ? 'Published' : 'Private'}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657176]">
            Create a clean link for casting teams and collaborators. Email,
            phone, account IDs, private media, and review notes are never
            published.
          </p>
        </div>
        <Globe2 aria-hidden="true" className="text-[#008ca6]" size={30} />
      </div>

      {(error || message) && (
        <p
          className={`mt-4 border p-3 text-sm ${
            error
              ? 'border-red-300 bg-red-50 text-red-800'
              : 'border-green-300 bg-green-50 text-green-800'
          }`}
        >
          {error || message}
        </p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <label className="text-sm font-black">
          Public profile address
          <div className="mt-2 flex min-h-12 border border-[#cbd6db] bg-white">
            <span className="flex items-center border-r border-[#dce3e6] px-3 text-sm text-[#66757c]">
              /t/
            </span>
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              onBlur={() => setSlug(normalizePublicTalentSlug(slug))}
              maxLength={48}
              className="min-w-0 flex-1 px-3 outline-none"
              aria-label="Public profile slug"
            />
          </div>
        </label>
        {enabled && relativeUrl && (
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="secondary-button inline-flex items-center gap-2"
            >
              <Copy aria-hidden="true" size={16} />
              Copy
            </button>
            <a
              href={relativeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="secondary-button inline-flex items-center gap-2"
            >
              <ExternalLink aria-hidden="true" size={16} />
              Preview
            </a>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3 border-y border-[#dfe6e9] py-5 sm:grid-cols-2">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={profile.publicShowLocation !== false}
            onChange={(event) =>
              onProfileChange({ publicShowLocation: event.target.checked })
            }
          />
          <span>
            <strong className="block">Show location</strong>
            <span className="text-[#657176]">Publish your profile location.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={profile.publicShowSocialLinks !== false}
            onChange={(event) =>
              onProfileChange({ publicShowSocialLinks: event.target.checked })
            }
          />
          <span>
            <strong className="block">Show professional links</strong>
            <span className="text-[#657176]">
              Publish Instagram, YouTube, and portfolio links.
            </span>
          </span>
        </label>
      </div>

      <p className="mt-4 text-sm text-[#657176]">
        Only portfolio items set to <strong>Public profile</strong> and still
        active in moderation are included. Use Update public profile after
        changing media or profile details.
      </p>
      {!canPublishTalentProfile(profile) && (
        <p className="mt-3 border-l-2 border-[#d59b1a] pl-3 text-sm text-[#795500]">
          Add your full name, location, and professional bio before publishing.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {!enabled ? (
          <button
            type="button"
            disabled={busy || !canPublishTalentProfile(profile)}
            onClick={() => void run('enable')}
            className="primary-button disabled:opacity-50"
          >
            {busy ? 'Publishing...' : 'Enable public profile'}
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(slug !== profile.publicSlug ? 'updateSlug' : 'refresh')
              }
              className="primary-button inline-flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw aria-hidden="true" size={16} />
              {busy ? 'Updating...' : 'Update public profile'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run('disable')}
              className="secondary-button text-red-700 disabled:opacity-50"
            >
              Disable public profile
            </button>
          </>
        )}
      </div>
    </section>
  );
}
