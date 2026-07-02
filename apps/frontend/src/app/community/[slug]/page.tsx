import { AuthNav } from '@/components/auth-nav';
import { CommunityActions } from '@/components/community-actions';
import { CommunityChat } from '@/components/community-chat';
import { getCommunity, getCommunityMessages } from '@/lib/api';
import Link from 'next/link';

interface CommunityPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function locationLabel(city: string | null, country: string | null) {
  return [city, country].filter(Boolean).join(', ') || 'Topic community';
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const { slug } = await params;
  const [community, messages] = await Promise.all([
    getCommunity(slug),
    getCommunityMessages(slug),
  ]);

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

      <div className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[360px_1fr]">
        <aside className="grid gap-4 self-start rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <Link className="text-sm font-semibold text-emerald-700" href="/">
              Back to map
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {community.type} group
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">{community.name}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {community.description ?? 'Connect with people in this community.'}
            </p>
          </div>

          <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Location</span>
              <span className="font-medium text-slate-950">
                {locationLabel(community.city, community.country)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Members</span>
              <span className="font-medium text-slate-950">{community.memberCount}</span>
            </div>
          </div>

          <div className="grid gap-2">
            <CommunityActions communityId={community.slug} />
            <Link
              className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              href="/members"
            >
              Members
            </Link>
          </div>
        </aside>

        <CommunityChat communityId={community.slug} initialMessages={messages} />
      </div>
    </main>
  );
}
