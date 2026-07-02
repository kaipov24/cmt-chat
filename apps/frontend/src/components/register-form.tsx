'use client';

import type { AuthSessionDto } from '@/lib/api';
import { apiBaseUrl } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
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

  const register = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        body: JSON.stringify({
          city: city.trim() || undefined,
          country: country.trim() || undefined,
          displayName,
          email,
          password,
          username,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const message = await errorMessageFromResponse(response);

        setError(
          response.status === 409
            ? 'Email or username is already registered.'
            : message ?? 'Registration failed.',
        );
        return;
      }

      await response.json() as AuthSessionDto;
      const meResponse = await fetch(`${apiBaseUrl}/api/auth/me`, {
        credentials: 'include',
      });

      if (!meResponse.ok) {
        setError('Account created, but the session could not be confirmed. Please sign in.');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Registration service is not running. Start the backend and database, then try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void register();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Display name
          <input
            autoComplete="name"
            className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Username
          <input
            autoComplete="username"
            className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
            maxLength={32}
            minLength={3}
            pattern="[a-zA-Z0-9_]+"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
      </div>

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
            autoComplete="new-password"
            className="h-11 min-w-0 flex-1 px-3 text-sm outline-none"
            minLength={10}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Country
          <input
            autoComplete="country-name"
            className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          City
          <input
            autoComplete="address-level2"
            className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </label>
      </div>

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

      <button
        className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-sm text-slate-600">
        Already registered?{' '}
        <Link className="font-semibold text-emerald-700" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
