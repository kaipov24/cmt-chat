import Link from 'next/link';

interface SimplePageProps {
  title: string;
  description: string;
}

export function SimplePage({ title, description }: SimplePageProps) {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <section className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Link className="text-sm font-semibold text-emerald-700" href="/">
          Back to home
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-3 text-slate-600">{description}</p>
      </section>
    </main>
  );
}
