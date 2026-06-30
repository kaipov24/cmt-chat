import type { GlobeMarker } from '@cmt/shared-types';

const previewMarkers: GlobeMarker[] = [
  {
    country: 'Kyrgyzstan',
    city: 'Bishkek',
    latitude: 42.87,
    longitude: 74.59,
    userCount: 14,
    onlineCount: 3,
  },
  {
    country: 'United Kingdom',
    city: 'London',
    latitude: 51.51,
    longitude: -0.13,
    userCount: 42,
    onlineCount: 8,
  },
  {
    country: 'United States',
    city: 'New York',
    latitude: 40.71,
    longitude: -74.01,
    userCount: 57,
    onlineCount: 12,
  },
];

export default function HomePage() {
  const totalUsers = previewMarkers.reduce((sum, marker) => sum + marker.userCount, 0);
  const onlineUsers = previewMarkers.reduce((sum, marker) => sum + marker.onlineCount, 0);

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <nav className="flex items-center justify-between" aria-label="Main navigation">
          <span className="text-lg font-semibold text-brand-ink">CMT Community</span>
          <div className="flex gap-4 text-sm font-medium">
            <a href="/communities">Communities</a>
            <a href="/members">Members</a>
            <a href="/login">Login</a>
          </div>
        </nav>

        <div className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-brand-green">Phase 1 scaffold</p>
            <h1 className="mt-3 text-4xl font-semibold text-brand-ink">Find CMT communities by city</h1>
            <p className="mt-4 max-w-2xl text-slate-600">
              The interactive globe, authentication, community pages, and real-time chat will be
              added in later phases. This screen keeps the first milestone focused on structure and
              shared contracts.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-md bg-slate-50 p-4">
              <dt className="text-sm text-slate-500">Registered users</dt>
              <dd className="mt-2 text-3xl font-semibold">{totalUsers}</dd>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <dt className="text-sm text-slate-500">Online now</dt>
              <dd className="mt-2 text-3xl font-semibold">{onlineUsers}</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
