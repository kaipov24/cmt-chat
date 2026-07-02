'use client';

import type { CommunitySummaryDto } from '@/lib/api';
import { apiBaseUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type CommunityType = CommunitySummaryDto['type'];

const communityTypes: CommunityType[] = ['city', 'country', 'topic'];

export function CreateCommunityForm() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CommunityType>('city');

  const createCommunity = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/communities`, {
        body: JSON.stringify({
          city: type === 'city' ? city.trim() : undefined,
          country: type === 'city' || type === 'country' ? country.trim() : undefined,
          description: description.trim() || undefined,
          name: name.trim(),
          type,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (response.status === 401) {
        window.location.assign('/login?next=/communities');
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
        const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;

        setError(message ?? 'Community could not be created.');
        return;
      }

      const community = (await response.json()) as CommunitySummaryDto;

      router.push(`/community/${community.slug}`);
      router.refresh();
    } catch {
      setError('Community could not be created.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void createCommunity();
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Create group</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">Start a community</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Name
          <input
            className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
            maxLength={80}
            minLength={3}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Type
          <select
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-950"
            value={type}
            onChange={(event) => setType(event.target.value as CommunityType)}
          >
            {communityTypes.map((communityType) => (
              <option key={communityType} value={communityType}>
                {communityType}
              </option>
            ))}
          </select>
        </label>
      </div>

      {type !== 'topic' ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Country
            <input
              className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
              maxLength={80}
              minLength={2}
              required
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            />
          </label>
          {type === 'city' ? (
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              City
              <input
                className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
                maxLength={80}
                minLength={2}
                required
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </label>
          ) : null}
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Description
        <textarea
          className="min-h-24 resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-950"
          maxLength={500}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

      <button
        className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={isSubmitting || !name.trim()}
        type="submit"
      >
        {isSubmitting ? 'Creating...' : 'Create group'}
      </button>
    </form>
  );
}
