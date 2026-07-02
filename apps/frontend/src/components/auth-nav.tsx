'use client';

import type { AuthSessionDto } from '@/lib/api';
import { apiBaseUrl } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type AuthUser = AuthSessionDto['user'];

export function AuthNav() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
          credentials: 'include',
        });

        if (!isMounted) {
          return;
        }

        if (response.ok) {
          setUser((await response.json()) as AuthUser);
        } else {
          setUser(null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = async () => {
    await fetch(`${apiBaseUrl}/api/auth/logout`, {
      credentials: 'include',
      method: 'POST',
    });
    setUser(null);
    window.location.assign('/');
  };

  if (isLoading) {
    return <div className="h-9 w-28 rounded-md bg-slate-100" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-slate-700 sm:gap-2">
        <Link href="/members">Members</Link>
        <Link href="/communities">Groups</Link>
        <Link href="/about">About</Link>
        <Link href="/login">Login</Link>
        <Link
          className="rounded-md bg-slate-950 px-3 py-2 text-white transition hover:bg-slate-800"
          href="/register"
        >
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
      <Link href="/members">Members</Link>
      <Link href="/communities">Groups</Link>
      {user.role === 'admin' || user.role === 'moderator' ? <Link href="/moderation">Moderation</Link> : null}
      <Link href="/settings">Settings</Link>
      <span className="rounded-md bg-slate-100 px-3 py-2 font-semibold text-slate-950">
        {user.profile?.displayName ?? user.email}
      </span>
      <button
        className="rounded-md border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800 transition hover:bg-slate-100"
        type="button"
        onClick={() => {
          void logout();
        }}
      >
        Logout
      </button>
    </div>
  );
}
