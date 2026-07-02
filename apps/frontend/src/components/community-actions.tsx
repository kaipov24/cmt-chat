'use client';

import { apiBaseUrl } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CommunityActionsProps {
  communityId: string;
}

interface MembershipDto {
  joinedAt: string;
  role: 'member' | 'moderator' | 'admin';
}

export function CommunityActions({ communityId }: CommunityActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [membership, setMembership] = useState<MembershipDto | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMembership = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/communities/${communityId}/membership`, {
          credentials: 'include',
        });

        if (!isMounted) {
          return;
        }

        if (response.status === 401) {
          setIsSignedIn(false);
          return;
        }

        if (!response.ok) {
          setError('Membership could not be loaded.');
          return;
        }

        setIsSignedIn(true);
        setMembership((await response.json()) as MembershipDto | null);
      } catch {
        if (isMounted) {
          setError('Membership could not be loaded.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadMembership();

    return () => {
      isMounted = false;
    };
  }, [communityId]);

  const joinCommunity = async () => {
    setError(null);
    setIsMutating(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/communities/${communityId}/join`, {
        credentials: 'include',
        method: 'POST',
      });

      if (response.status === 401) {
        window.location.assign(`/login?next=/community/${communityId}`);
        return;
      }

      if (!response.ok && response.status !== 409) {
        setError('Could not join this community.');
        return;
      }

      setMembership({
        joinedAt: new Date().toISOString(),
        role: 'member',
      });
      window.location.reload();
    } catch {
      setError('Could not join this community.');
    } finally {
      setIsMutating(false);
    }
  };

  const leaveCommunity = async () => {
    setError(null);
    setIsMutating(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/communities/${communityId}/leave`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (!response.ok) {
        setError('Could not leave this community.');
        return;
      }

      setMembership(null);
      window.location.reload();
    } catch {
      setError('Could not leave this community.');
    } finally {
      setIsMutating(false);
    }
  };

  if (isLoading) {
    return <div className="h-10 rounded-md bg-slate-100" aria-hidden="true" />;
  }

  if (!isSignedIn) {
    return (
      <div className="grid gap-2">
        <Link
          className="inline-flex justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          href={`/login?next=/community/${communityId}`}
        >
          Sign in to join
        </Link>
        {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {membership ? (
        <button
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
          disabled={isMutating}
          type="button"
          onClick={() => void leaveCommunity()}
        >
          {isMutating ? 'Leaving...' : `Joined as ${membership.role}`}
        </button>
      ) : (
        <button
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isMutating}
          type="button"
          onClick={() => void joinCommunity()}
        >
          {isMutating ? 'Joining...' : 'Join to chat'}
        </button>
      )}
      {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
