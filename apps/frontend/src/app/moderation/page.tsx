import { AuthNav } from '@/components/auth-nav';
import { ModerationReports } from '@/components/moderation-reports';
import Link from 'next/link';

export default function ModerationPage() {
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

      <div className="mx-auto grid max-w-[1000px] gap-5 px-4 py-6 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Moderation</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Reports</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Review reports submitted by members.
          </p>
        </div>

        <ModerationReports />
      </div>
    </main>
  );
}
