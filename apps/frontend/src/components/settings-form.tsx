'use client';

import type { MyProfileDto } from '@/lib/api';
import { apiBaseUrl } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type LocationVisibility = MyProfileDto['locationVisibility'];

interface ProfileFormState {
  avatarUrl: string;
  bio: string;
  city: string;
  country: string;
  displayName: string;
  locationVisibility: LocationVisibility;
  showOnlineStatus: boolean;
}

const emptyForm: ProfileFormState = {
  avatarUrl: '',
  bio: '',
  city: '',
  country: '',
  displayName: '',
  locationVisibility: 'city',
  showOnlineStatus: true,
};

function toFormState(profile: MyProfileDto): ProfileFormState {
  return {
    avatarUrl: profile.avatarUrl ?? '',
    bio: profile.bio ?? '',
    city: profile.city ?? '',
    country: profile.country ?? '',
    displayName: profile.displayName,
    locationVisibility: profile.locationVisibility,
    showOnlineStatus: profile.showOnlineStatus,
  };
}

function trimOrNull(value: string) {
  return value.trim() || null;
}

function resolveAvatarUrl(value: string) {
  if (!value) {
    return null;
  }

  return value.startsWith('/') ? `${apiBaseUrl}${value}` : value;
}

export function SettingsForm() {
  const [profile, setProfile] = useState<MyProfileDto | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/users/me/profile`, {
          credentials: 'include',
        });

        if (!isMounted) {
          return;
        }

        if (response.status === 401) {
          window.location.assign('/login?next=/settings');
          return;
        }

        if (!response.ok) {
          setError('Profile could not be loaded.');
          return;
        }

        const nextProfile = (await response.json()) as MyProfileDto;

        setProfile(nextProfile);
        setForm(toFormState(nextProfile));
      } catch {
        if (isMounted) {
          setError('Profile service is not running. Start the backend and database, then try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveProfile = async () => {
    setError(null);
    setSaved(false);
    setIsSaving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/me/profile`, {
        body: JSON.stringify({
          avatarUrl: trimOrNull(form.avatarUrl),
          bio: trimOrNull(form.bio),
          city: trimOrNull(form.city),
          country: trimOrNull(form.country),
          displayName: form.displayName.trim(),
          locationVisibility: form.locationVisibility,
          showOnlineStatus: form.showOnlineStatus,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      });

      if (response.status === 401) {
        window.location.assign('/login?next=/settings');
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
        const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;

        setError(message ?? 'Profile could not be saved.');
        return;
      }

      const nextProfile = (await response.json()) as MyProfileDto;

      setProfile(nextProfile);
      setForm(toFormState(nextProfile));
      setSaved(true);
    } catch {
      setError('Profile service is not running. Start the backend and database, then try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) {
      setError('Choose an image before uploading.');
      setSaved(false);
      return;
    }

    setError(null);
    setSaved(false);
    setIsUploading(true);

    try {
      const body = new FormData();
      body.append('avatar', avatarFile);

      const response = await fetch(`${apiBaseUrl}/api/users/me/avatar`, {
        body,
        credentials: 'include',
        method: 'POST',
      });

      if (response.status === 401) {
        window.location.assign('/login?next=/settings');
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
        const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;

        setError(message ?? 'Avatar could not be uploaded.');
        return;
      }

      const nextProfile = (await response.json()) as MyProfileDto;

      setAvatarFile(null);
      setProfile(nextProfile);
      setForm(toFormState(nextProfile));
      setSaved(true);
    } catch {
      setError('Profile service is not running. Start the backend and database, then try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
        Loading settings...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">{error ?? 'Profile could not be loaded.'}</p>
        <Link className="mt-4 inline-flex font-semibold text-emerald-700" href="/login?next=/settings">
          Sign in
        </Link>
      </div>
    );
  }

  const avatarPreviewUrl = resolveAvatarUrl(form.avatarUrl);
  const avatarInitial = profile.displayName.trim().charAt(0).toUpperCase() || profile.username.charAt(0).toUpperCase();

  return (
    <form
      className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void saveProfile();
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">@{profile.username}</h2>
      </div>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Display name
        <input
          className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
          maxLength={80}
          required
          value={form.displayName}
          onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Bio
        <textarea
          className="min-h-28 resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-950"
          maxLength={500}
          value={form.bio}
          onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
        />
      </label>

      <div className="grid gap-2 text-sm font-medium text-slate-700">
        <p>Avatar</p>
        <div className="flex flex-col gap-3 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center">
          <div
            aria-label="Current avatar"
            className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-emerald-100 bg-cover bg-center text-xl font-semibold text-emerald-900"
            style={avatarPreviewUrl ? { backgroundImage: `url(${avatarPreviewUrl})` } : undefined}
          >
            {avatarPreviewUrl ? null : avatarInitial}
          </div>
          <div className="grid flex-1 gap-2">
            <input
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              type="file"
              onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
            />
            <button
              className="w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:border-slate-950 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              disabled={isUploading || !avatarFile}
              type="button"
              onClick={() => void uploadAvatar()}
            >
              {isUploading ? 'Uploading...' : 'Upload avatar'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Country
          <input
            className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
            maxLength={80}
            value={form.country}
            onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          City
          <input
            className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
            maxLength={80}
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Location visibility
        <select
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-950"
          value={form.locationVisibility}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              locationVisibility: event.target.value as LocationVisibility,
            }))
          }
        >
          <option value="city">Show city and country</option>
          <option value="country">Show country only</option>
          <option value="hidden">Hide location</option>
        </select>
      </label>

      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          checked={form.showOnlineStatus}
          className="h-4 w-4"
          type="checkbox"
          onChange={(event) =>
            setForm((current) => ({ ...current, showOnlineStatus: event.target.checked }))
          }
        />
        Show online status
      </label>

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      {saved ? <p className="text-sm font-medium text-emerald-700">Settings saved.</p> : null}

      <button
        className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={isSaving || !form.displayName.trim()}
        type="submit"
      >
        {isSaving ? 'Saving...' : 'Save settings'}
      </button>
    </form>
  );
}
