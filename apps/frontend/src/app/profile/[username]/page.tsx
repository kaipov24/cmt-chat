import { AuthNav } from '@/components/auth-nav';
import { ReportButton } from '@/components/report-button';
import type { PublicProfileDto } from '@/lib/api';
import { apiBaseUrl, getPublicProfileByUsername } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ProfilePageProps {
  params: Promise<{
    username: string;
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

function lastSeenLabel(profile: PublicProfileDto) {
  if (!profile.showOnlineStatus) {
    return 'Activity hidden';
  }

  if (!profile.user.lastSeenAt) {
    return 'No recent activity';
  }

  return `Last active ${new Intl.DateTimeFormat('en', {
    dateStyle: 'long',
  }).format(new Date(profile.user.lastSeenAt))}`;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const image = avatarUrl(profile.avatarUrl);

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

      <div className="mx-auto grid max-w-[900px] gap-5 px-4 py-6 sm:px-6">
        <Link className="text-sm font-semibold text-emerald-700" href="/members">
          Back to members
        </Link>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-emerald-100 bg-cover bg-center text-3xl font-semibold text-emerald-900"
              style={image ? { backgroundImage: `url(${image})` } : undefined}
            >
              {image ? null : initials(profile)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Public profile</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-950">{profile.displayName}</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">@{profile.username}</p>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</dt>
              <dd className="mt-1 text-sm font-medium text-slate-950">{locationLabel(profile)}</dd>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activity</dt>
              <dd className="mt-1 text-sm font-medium text-slate-950">{lastSeenLabel(profile)}</dd>
            </div>
          </dl>

          <div className="mt-5 rounded-md border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-950">About</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {profile.bio ?? 'This member has not added a bio yet.'}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              href={`/messages?userId=${profile.user.id}`}
            >
              Message
            </Link>
            <Link
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950"
              href={`/members?country=${encodeURIComponent(profile.country ?? '')}&city=${encodeURIComponent(profile.city ?? '')}`}
            >
              Find nearby members
            </Link>
          </div>
          <div className="mt-4">
            <ReportButton reportedUserId={profile.user.id} variant="full" />
          </div>
        </section>
      </div>
    </main>
  );
}
