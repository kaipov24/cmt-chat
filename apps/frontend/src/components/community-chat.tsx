'use client';

import type { CommunityMessageDto } from '@/lib/api';
import { useState } from 'react';
import { CommunityMessageComposer } from './community-message-composer';

interface CommunityChatProps {
  communityId: string;
  initialMessages: CommunityMessageDto[];
}

function initialsFor(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function CommunityChat({ communityId, initialMessages }: CommunityChatProps) {
  const [messages, setMessages] = useState(initialMessages);

  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">Community chat</h2>
          <p className="mt-1 text-xs text-slate-500">Recent public messages</p>
        </div>
        <div className="grid max-h-[520px] gap-3 overflow-y-auto p-4">
          {messages.length > 0 ? (
            messages.map((message) => (
              <article className="flex gap-3" key={message.id}>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-950 text-sm font-semibold text-white">
                  {message.sender ? initialsFor(message.sender.displayName) : 'C'}
                </div>
                <div className="min-w-0 flex-1 rounded-lg bg-slate-50 p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-slate-950">
                      {message.sender?.displayName ?? 'Community'}
                    </p>
                    <time className="text-xs text-slate-500" dateTime={message.createdAt}>
                      {formatMessageTime(message.createdAt)}
                    </time>
                  </div>
                  {message.sender ? (
                    <p className="mt-0.5 text-xs text-slate-500">@{message.sender.username}</p>
                  ) : null}
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {message.content}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No messages yet.
            </div>
          )}
        </div>
      </div>

      <CommunityMessageComposer
        communityId={communityId}
        onMessageCreated={(message) => setMessages((currentMessages) => [...currentMessages, message])}
      />
    </section>
  );
}
