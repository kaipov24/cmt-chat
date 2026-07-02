import { AuthNav } from '@/components/auth-nav';
import { CreateCommunityForm } from '@/components/create-community-form';
import { getActiveCommunities } from '@/lib/api';
import Link from 'next/link';

function locationLabel(city: string | null, country: string | null) {
  return [city, country].filter(Boolean).join(', ') || 'Topic';
}

export default async function CommunitiesPage() {
  const communities = await getActiveCommunities();

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
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Groups</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-950">Find a CMT group</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Browse city, country, and topic spaces. Open a group to read recent messages.
            </p>
          </div>
          <a
            className="inline-flex justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            href="#create-group"
          >
            Create group
          </a>
        </div>

        <div id="create-group">
          <CreateCommunityForm />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {communities.map((community) => (
            <Link
              className="grid min-h-[190px] gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400"
              href={`/community/${community.slug}`}
              key={community.id}
            >
              <div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-600">
                  {community.type}
                </span>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">{community.name}</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {locationLabel(community.city, community.country)}
                </p>
              </div>
              <p className="line-clamp-3 text-sm text-slate-600">
                {community.description ?? 'Connect with people in this group.'}
              </p>
              <p className="mt-auto text-sm font-semibold text-emerald-700">
                {community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
