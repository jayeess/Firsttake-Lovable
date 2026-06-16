'use client';

import {
  ExternalLink,
  ImagePlus,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createTalentMediaId,
  getTalentMedia,
  removeTalentMedia,
  saveTalentMedia,
  setFeaturedTalentMedia,
  updateTalentMedia,
  updateTalentProfilePhoto,
} from '@/app/lib/firestore-service';
import { getFirebaseAuth } from '@/app/lib/firebase';
import {
  deleteStoragePath,
  uploadPortfolioImage,
  uploadProfilePhoto,
} from '@/app/lib/storage-service';
import { normalizeExternalMediaUrl } from '@/app/lib/talent-media-policy';
import type { TalentMedia, TalentProfile } from '@/app/lib/types';

const notifyMediaEvent = async (
  event: 'profile_photo_uploaded' | 'portfolio_media_added',
  mediaId?: string
) => {
  const user = getFirebaseAuth().currentUser;
  if (!user) return;
  await fetch('/api/media/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event, mediaId }),
  }).catch(() => undefined);
};

export function TalentMediaManager({
  uid,
  profile,
  onProfileChange,
}: {
  uid: string;
  profile: TalentProfile;
  onProfileChange: (updates: Partial<TalentProfile>) => void;
}) {
  const [media, setMedia] = useState<TalentMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [editingId, setEditingId] = useState('');

  const load = () => {
    setLoading(true);
    void getTalentMedia(uid)
      .then(setMedia)
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Portfolio media could not be loaded.'
        )
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void getTalentMedia(uid)
      .then(setMedia)
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Portfolio media could not be loaded.'
        )
      )
      .finally(() => setLoading(false));
  }, [uid]);

  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    setError('');
    setMessage('');
    setProgress(0);
    const oldPath = profile.profilePhotoPath;
    try {
      const result = await uploadProfilePhoto(
        uid,
        crypto.randomUUID(),
        file,
        setProgress
      );
      await updateTalentProfilePhoto(uid, result);
      await deleteStoragePath(oldPath);
      onProfileChange({
        profilePhotoUrl: result.url,
        profilePhotoPath: result.storagePath,
      });
      setMessage('Profile photo updated.');
      await notifyMediaEvent('profile_photo_uploaded');
    } catch (uploadError: unknown) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Profile photo upload failed.'
      );
    } finally {
      setProgress(null);
    }
  };

  const removePhoto = async () => {
    setError('');
    try {
      await deleteStoragePath(profile.profilePhotoPath);
      await updateTalentProfilePhoto(uid);
      onProfileChange({ profilePhotoUrl: '', profilePhotoPath: '' });
      setMessage('Profile photo removed.');
    } catch (removeError: unknown) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : 'Profile photo could not be removed.'
      );
    }
  };

  const uploadPortfolio = async (file?: File) => {
    if (!file) return;
    const mediaId = createTalentMediaId(uid);
    setError('');
    setMessage('');
    setProgress(0);
    let storagePath = '';
    try {
      const result = await uploadPortfolioImage(
        uid,
        mediaId,
        file,
        setProgress
      );
      storagePath = result.storagePath;
      await saveTalentMedia(uid, mediaId, {
        type: 'image',
        title: file.name.replace(/\.[^.]+$/, '').slice(0, 120),
        url: result.url,
        storagePath: result.storagePath,
        mimeType: result.mimeType,
        sizeBytes: result.sizeBytes,
      });
      onProfileChange({
        portfolioMediaCount: Number(profile.portfolioMediaCount ?? 0) + 1,
      });
      setMessage('Portfolio image added.');
      await notifyMediaEvent('portfolio_media_added', mediaId);
      load();
    } catch (uploadError: unknown) {
      await deleteStoragePath(storagePath);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Portfolio upload failed.'
      );
    } finally {
      setProgress(null);
    }
  };

  const addExternalLink = async () => {
    const externalUrl = normalizeExternalMediaUrl(linkUrl);
    if (!externalUrl) {
      setError('Enter a valid http or https showreel URL.');
      return;
    }
    if (!linkTitle.trim()) {
      setError('Add a short title for this showreel.');
      return;
    }
    const mediaId = createTalentMediaId(uid);
    setError('');
    await saveTalentMedia(uid, mediaId, {
      type: 'showreel_link',
      title: linkTitle,
      externalUrl,
    });
    onProfileChange({
      portfolioMediaCount: Number(profile.portfolioMediaCount ?? 0) + 1,
    });
    setLinkTitle('');
    setLinkUrl('');
    setMessage('Showreel link added.');
    await notifyMediaEvent('portfolio_media_added', mediaId);
    load();
  };

  const remove = async (item: TalentMedia) => {
    if (!window.confirm(`Remove "${item.title}" from your portfolio?`)) return;
    await deleteStoragePath(item.storagePath);
    await removeTalentMedia(uid, item.id);
    onProfileChange({
      portfolioMediaCount: Math.max(
        0,
        Number(profile.portfolioMediaCount ?? media.length) - 1
      ),
      featuredMediaId:
        profile.featuredMediaId === item.id ? '' : profile.featuredMediaId,
    });
    load();
  };

  const saveEdit = async (item: TalentMedia) => {
    await updateTalentMedia(uid, item.id, item);
    setEditingId('');
    setMessage('Portfolio details updated.');
  };

  return (
    <section className="surface mt-6 rounded-md p-4 sm:p-6" aria-label="Talent media portfolio">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Media portfolio</p>
          <h2 className="mt-2 text-2xl font-black">Show your work</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657176]">
            Images may be up to 10 MB. Use external links for video and
            showreels. Media remains optional for browsing and applications.
          </p>
        </div>
        <span className="border border-[#cbd6db] px-3 py-2 text-sm font-black">
          {profile.portfolioMediaCount ?? media.length} items
        </span>
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
      {progress !== null && (
        <div className="mt-4">
          <div className="flex justify-between text-xs font-bold">
            <span>Uploading media</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 bg-[#dbe4e8]">
            <div
              className="h-full bg-[#008ca6]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[240px_1fr]">
        <div>
          <p className="text-sm font-black">Profile photo</p>
          <div
            role="img"
            aria-label="Current Talent profile photo"
            className="mt-3 aspect-square border border-[#cbd6db] bg-[#e7eef1] bg-cover bg-center"
            style={
              profile.profilePhotoUrl
                ? { backgroundImage: `url("${profile.profilePhotoUrl}")` }
                : undefined
            }
          />
          <label className="secondary-button mt-3 flex cursor-pointer items-center justify-center gap-2">
            <Upload aria-hidden="true" size={17} />
            {profile.profilePhotoUrl ? 'Change photo' : 'Upload photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => void uploadPhoto(event.target.files?.[0])}
            />
          </label>
          {profile.profilePhotoUrl && (
            <button
              type="button"
              onClick={() => void removePhoto()}
              className="mt-2 min-h-10 w-full text-sm font-bold text-red-700"
            >
              Remove photo
            </button>
          )}
          <p className="mt-2 text-xs text-[#728087]">
            JPEG, PNG, or WebP. Maximum 5 MB.
          </p>
        </div>

        <div>
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <label className="primary-button flex cursor-pointer items-center gap-2">
              <ImagePlus aria-hidden="true" size={17} />
              Add portfolio image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) =>
                  void uploadPortfolio(event.target.files?.[0])
                }
              />
            </label>
          </div>
          <div className="mt-4 grid gap-3 rounded-md border border-[#d7e0e4] bg-[#f7fafb] p-4 lg:grid-cols-[1fr_1fr_auto]">
            <input
              value={linkTitle}
              onChange={(event) => setLinkTitle(event.target.value)}
              placeholder="Showreel title"
              className="field"
            />
            <input
              type="url"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="https://youtube.com/..."
              className="field"
            />
            <button
              type="button"
              onClick={() => void addExternalLink()}
              className="secondary-button inline-flex items-center justify-center gap-2 lg:w-auto"
            >
              <ExternalLink aria-hidden="true" size={17} />
              Add link
            </button>
          </div>

          {loading ? (
            <p className="mt-5 text-sm font-semibold text-[#657176]">
              Loading portfolio...
            </p>
          ) : media.length === 0 ? (
            <div className="mt-5 border border-dashed border-[#bdcbd1] p-8 text-center">
              <p className="font-black">No portfolio media yet</p>
              <p className="mt-2 text-sm text-[#68727c]">
                Add a strong image or a concise external showreel.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {media.map((item) => (
                <article key={item.id} className="border border-[#d6e0e4] p-4">
                  {item.type === 'image' && item.url && (
                    <div
                      role="img"
                      aria-label={item.title}
                      className="aspect-video bg-[#e7eef1] bg-cover bg-center"
                      style={{ backgroundImage: `url("${item.url}")` }}
                    />
                  )}
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {editingId === item.id ? (
                        <>
                          <input
                            value={item.title}
                            onChange={(event) =>
                              setMedia((current) =>
                                current.map((entry) =>
                                  entry.id === item.id
                                    ? { ...entry, title: event.target.value }
                                    : entry
                                )
                              )
                            }
                            className="field"
                          />
                          <textarea
                            value={item.description}
                            onChange={(event) =>
                              setMedia((current) =>
                                current.map((entry) =>
                                  entry.id === item.id
                                    ? {
                                        ...entry,
                                        description: event.target.value,
                                      }
                                    : entry
                                )
                              )
                            }
                            placeholder="Short description"
                            className="field mt-2 py-2"
                          />
                          <select
                            value={item.visibility}
                            onChange={(event) =>
                              setMedia((current) =>
                                current.map((entry) =>
                                  entry.id === item.id
                                    ? {
                                        ...entry,
                                        visibility: event.target
                                          .value as TalentMedia['visibility'],
                                      }
                                    : entry
                                )
                              )
                            }
                            className="field mt-2"
                          >
                            <option value="private">Private</option>
                            <option value="recruiters">Recruiters</option>
                            <option value="public">Public profile</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => void saveEdit(item)}
                            className="primary-button mt-2"
                          >
                            Save details
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-black">{item.title}</h3>
                            {item.isFeatured && (
                              <Star
                                aria-label="Featured media"
                                size={15}
                                fill="currentColor"
                                className="text-[#d59b1a]"
                              />
                            )}
                          </div>
                          <p className="mt-1 text-xs uppercase text-[#748087]">
                            {item.type.replace('_', ' ')} · {item.visibility}
                          </p>
                          {item.moderationStatus !== 'active' && (
                            <p className="mt-2 text-sm font-bold text-red-700">
                              {item.moderationStatus} by moderation
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void remove(item)}
                      aria-label={`Remove ${item.title}`}
                      className="flex size-9 items-center justify-center border border-red-200 text-red-700"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  </div>
                  {editingId !== item.id && (
                    <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold">
                      <button
                        type="button"
                        onClick={() => setEditingId(item.id)}
                        className="text-[#008ca6]"
                      >
                        Edit
                      </button>
                      {!item.isFeatured && item.moderationStatus === 'active' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await setFeaturedTalentMedia(uid, item.id);
                            onProfileChange({ featuredMediaId: item.id });
                            load();
                          }}
                          className="text-[#9a6800]"
                        >
                          Set featured
                        </button>
                      )}
                      {item.externalUrl && (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#008ca6]"
                        >
                          Open link
                        </a>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
