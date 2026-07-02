'use client';

import type { AuthSessionDto } from '@/lib/api';
import { apiBaseUrl } from '@/lib/api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

function nextPath(value: string | null) {
  return value?.startsWith('/') ? value : '/';
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const errorMessageFromResponse = async (response: Response) => {
    try {
      const body = (await response.json()) as { message?: string | string[] };

      if (Array.isArray(body.message)) {
        return body.message.join(' ');
      }

      return body.message;
    } catch {
      return null;
    }
  };

  const login = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        body: JSON.stringify({ email, password }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const message = await errorMessageFromResponse(response);

        setError(response.status === 401 ? 'Invalid email or password.' : message ?? 'Login failed.');
        return;
      }

      await response.json() as AuthSessionDto;
      const meResponse = await fetch(`${apiBaseUrl}/api/auth/me`, {
        credentials: 'include',
      });

      if (!meResponse.ok) {
        setError('Signed in, but the session could not be confirmed. Please try again.');
        return;
      }

      window.location.assign(nextPath(searchParams.get('next')));
    } catch {
      setError('Login service is not running. Start the backend and database, then try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void login();
      }}
    >
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Email
        <input
          autoComplete="email"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Password
        <span className="flex overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-slate-950">
          <input
            autoComplete="current-password"
            className="h-11 min-w-0 flex-1 px-3 text-sm outline-none"
            required
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            className="border-l border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </span>
      </label>

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

      <button
        className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>

      <p className="text-sm text-slate-600">
        New here?{' '}
        <Link className="font-semibold text-emerald-700" href="/register">
          Create an account
        </Link>
      </p>
    </form>
  );
}
