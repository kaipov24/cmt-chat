import { AuthNav } from '@/components/auth-nav';
import { CommunityGlobe } from '@/components/community-globe';
import { getActiveCommunities, getGlobeMarkers, getPublicPeople } from '@/lib/api';
import Link from 'next/link';

export default async function HomePage() {
  const [markers, people, communities] = await Promise.all([
    getGlobeMarkers(),
    getPublicPeople(),
    getActiveCommunities(),
  ]);
  const currentYear = new Date().getFullYear();

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

      <CommunityGlobe communities={communities} markers={markers} people={people} />
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-5 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>&copy; {currentYear} CMT Community Platform. All rights reserved.</p>
          <p>This platform is for peer support and does not provide medical advice.</p>
        </div>
      </footer>
    </main>
  );
}
