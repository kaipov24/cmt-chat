import { RegisterForm } from '@/components/register-form';
import Link from 'next/link';

export default function RegisterPage() {
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
          <Link className="text-sm font-semibold text-emerald-700" href="/login">
            Sign in
          </Link>
        </div>
      </nav>

      <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-[680px] content-center px-4 py-10 sm:px-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Join the platform
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">Create account</h1>
            <p className="mt-2 text-sm text-slate-600">
              Create a profile so nearby people with CMT can find and message you.
            </p>
          </div>
          <RegisterForm />
        </section>
      </div>
    </main>
  );
}
