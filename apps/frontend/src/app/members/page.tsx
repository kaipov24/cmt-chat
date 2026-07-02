import { AuthNav } from '@/components/auth-nav';
import type { PublicProfileDto } from '@/lib/api';
import { apiBaseUrl, searchPublicPeople } from '@/lib/api';
import Link from 'next/link';

interface MembersPageProps {
  searchParams: Promise<{
    city?: string;
    country?: string;
    search?: string;
  }>;
}

function avatarUrl(value: string | null) {
  if (!value) {
    return null;
  }

  return value.startsWith('/') ? `${apiBaseUrl}${value}` : value;
}

function initials(profile: PublicProfileDto) {
  return profile.displayName.trim().charAt(0).toUpperCase() || profile.username.charAt(0).toUpperCase();
}

function locationLabel(profile: PublicProfileDto) {
  return [profile.city, profile.country].filter(Boolean).join(', ') || 'Location hidden';
}

function lastSeenLabel(value: string | null) {
  if (!value) {
    return 'No recent activity';
  }

  return `Last active ${new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(value))}`;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const filters = await searchParams;
  const people = await searchPublicPeople(filters);

  return (
    <main className="min-h-screen bg-[#f4f7fa] text-slate-950">
      <nav className="border-b border-slate-200 bg-white/95" aria-label="Main navigation">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link className="flex items-center gap-3 text-sm font-semibold text-slate-950" href="/">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-slate-950 text-xs text-white">
              CMT
            </span>
            <span>Community Platform</span>
          </Link>
          <AuthNav />
        </div>
      </nav>

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Members</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-950">Find people with CMT</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Search visible profiles by name, username, country, or city.
            </p>
          </div>
          <Link
            className="inline-flex justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            href="/settings"
          >
            Update my profile
          </Link>
        </div>

        <form className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1.5fr_1fr_1fr_auto]">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Search
            <input
              className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
              defaultValue={filters.search ?? ''}
              name="search"
              placeholder="Name or username"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Country
            <input
              className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
              defaultValue={filters.country ?? ''}
              name="country"
              placeholder="United States"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            City
            <input
              className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
              defaultValue={filters.city ?? ''}
              name="city"
              placeholder="New York"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              className="h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="submit"
            >
              Search
            </button>
            <Link
              className="grid h-11 place-items-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950"
              href="/members"
            >
              Clear
            </Link>
          </div>
        </form>

        {people.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {people.map((person) => {
              const image = avatarUrl(person.avatarUrl);

              return (
                <Link
                  className="grid min-h-[220px] gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400"
                  href={`/profile/${person.username}`}
                  key={person.id}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-100 bg-cover bg-center text-lg font-semibold text-emerald-900"
                      style={image ? { backgroundImage: `url(${image})` } : undefined}
                    >
                      {image ? null : initials(person)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-slate-950">
                        {person.displayName}
                      </h2>
                      <p className="truncate text-sm font-medium text-slate-500">@{person.username}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600">{locationLabel(person)}</p>
                  <p className="line-clamp-3 text-sm text-slate-600">
                    {person.bio ?? 'Open to connecting with other people living with CMT.'}
                  </p>
                  <p className="mt-auto text-sm font-semibold text-emerald-700">
                    {person.showOnlineStatus ? lastSeenLabel(person.user.lastSeenAt) : 'Activity hidden'}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No visible profiles match those filters.
          </div>
        )}
      </div>
    </main>
  );
}
