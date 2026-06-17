'use client';

import { useEffect, useState } from 'react';
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from '@/app/lib/firestore-service';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  normalizeNotificationPreferences,
} from '@/app/lib/notification-preferences';
import type { NotificationPreferences } from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';

const preferenceRows: Array<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: 'emailEnabled',
    label: 'Transactional email notifications',
    description: 'Master switch for non-critical account and casting emails.',
  },
  {
    key: 'messageEmails',
    label: 'Message emails',
    description: 'Email me when I receive a new in-platform message.',
  },
  {
    key: 'applicationUpdateEmails',
    label: 'Application update emails',
    description: 'Email me for shortlisted, selected, and rejected updates.',
  },
  {
    key: 'verificationEmails',
    label: 'Verification emails',
    description: 'Email me when Talent or Recruiter trust review changes.',
  },
  {
    key: 'selfTapeEmails',
    label: 'Self-tape emails',
    description: 'Email me for submitted or reviewed self-tape activity.',
  },
  {
    key: 'marketingEmails',
    label: 'Marketing emails',
    description: 'Reserved for future product news. No marketing is sent in beta.',
  },
];

export function NotificationPreferencesForm({ uid }: { uid: string }) {
  const [preferences, setPreferences] = useState(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void getUserNotificationPreferences(uid)
      .then((data) => setPreferences(data))
      .catch((loadError: unknown) =>
        setError(
          getErrorMessage(loadError, 'Unable to load notification preferences')
        )
      )
      .finally(() => setLoading(false));
  }, [uid]);

  const update = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((current) =>
      normalizeNotificationPreferences({ ...current, [key]: value })
    );
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateUserNotificationPreferences(uid, preferences);
      setMessage('Notification preferences saved.');
    } catch (saveError: unknown) {
      setError(
        getErrorMessage(saveError, 'Unable to save notification preferences')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="surface mt-6 rounded-md p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Notifications</p>
          <h2 className="mt-2 text-2xl font-black">Email preferences</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657176]">
            Real email delivery stays in safe no-op mode until a server-side
            provider is configured. Safety and account-risk messages remain
            protected.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={loading || saving}
          className="secondary-button sm:w-auto disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {preferenceRows.map((row) => (
          <label
            key={row.key}
            className="flex min-h-12 items-start gap-3 rounded-md border border-[#d7e0e4] bg-white p-3"
          >
            <input
              type="checkbox"
              checked={Boolean(preferences[row.key])}
              onChange={(event) => update(row.key, event.target.checked)}
              disabled={loading || saving}
              className="mt-1 size-4 accent-[#008ca6]"
            />
            <span>
              <span className="block text-sm font-black">{row.label}</span>
              <span className="mt-1 block text-sm leading-5 text-[#657176]">
                {row.description}
              </span>
            </span>
          </label>
        ))}
      </div>
      <p className="mt-4 border-l-2 border-[#d8a843] pl-3 text-sm leading-6 text-[#657176]">
        Safety, moderation, and account-security notices may still be sent when
        needed to protect users and the platform.
      </p>
      {(message || error) && (
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
    </section>
  );
}
