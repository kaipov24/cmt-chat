'use client';

import type { CommunityMessageDto } from '@/lib/api';
import { apiBaseUrl } from '@/lib/api';
import { useState } from 'react';

interface CommunityMessageComposerProps {
  communityId: string;
  onMessageCreated?: (message: CommunityMessageDto) => void;
}

export function CommunityMessageComposer({
  communityId,
  onMessageCreated,
}: CommunityMessageComposerProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const postMessage = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    setError(null);
    setIsPosting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/communities/${communityId}/messages`, {
        body: JSON.stringify({ content: trimmedContent }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (response.status === 401) {
        setError('Sign in to post a message.');
        return;
      }

      if (response.status === 403) {
        setError('Join this community before posting.');
        return;
      }

      if (!response.ok) {
        setError('Message could not be posted.');
        return;
      }

      const message = (await response.json()) as CommunityMessageDto;

      setContent('');
      onMessageCreated?.(message);
    } catch {
      setError('Message could not be posted.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3">
      <textarea
        className="min-h-24 resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950"
        maxLength={1000}
        placeholder="Write a message to this community"
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">{1000 - content.length} characters left</p>
        <button
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isPosting || !content.trim()}
          type="button"
          onClick={() => {
            void postMessage();
          }}
        >
          {isPosting ? 'Posting...' : 'Post message'}
        </button>
      </div>
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
