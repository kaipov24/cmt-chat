'use client';

import type { DirectConversationDto, DirectMessageDto } from '@/lib/api';
import { apiBaseUrl } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function participantName(conversation: DirectConversationDto) {
  return conversation.otherParticipant.profile?.displayName ?? 'Member';
}

function participantUsername(conversation: DirectConversationDto) {
  return conversation.otherParticipant.profile?.username ?? conversation.otherParticipant.id;
}

function messageTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function DirectMessagesPanel() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId');
  const [conversations, setConversations] = useState<DirectConversationDto[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessageDto[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  useEffect(() => {
    let isMounted = true;

    const loadConversations = async () => {
      try {
        let nextConversations: DirectConversationDto[] = [];

        if (initialUserId) {
          const createResponse = await fetch(`${apiBaseUrl}/api/direct-messages/conversations`, {
            body: JSON.stringify({ recipientUserId: initialUserId }),
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          });

          if (createResponse.status === 401) {
            window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
            return;
          }

          if (!createResponse.ok) {
            setError('Conversation could not be opened.');
            return;
          }

          const conversation = (await createResponse.json()) as DirectConversationDto;
          nextConversations = [conversation];
          setActiveConversationId(conversation.id);
        }

        const response = await fetch(`${apiBaseUrl}/api/direct-messages/conversations`, {
          credentials: 'include',
        });

        if (!isMounted) return;

        if (response.status === 401) {
          window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }

        if (!response.ok) {
          setError('Messages could not be loaded.');
          return;
        }

        const loadedConversations = (await response.json()) as DirectConversationDto[];
        const conversationMap = new Map<string, DirectConversationDto>();

        [...nextConversations, ...loadedConversations].forEach((conversation) => {
          conversationMap.set(conversation.id, conversation);
        });

        const mergedConversations = [...conversationMap.values()];

        setConversations(mergedConversations);
        setActiveConversationId((current) => current ?? mergedConversations[0]?.id ?? null);
      } catch {
        if (isMounted) {
          setError('Messages could not be loaded.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadConversations();

    return () => {
      isMounted = false;
    };
  }, [initialUserId]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    const loadMessages = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/direct-messages/conversations/${activeConversationId}/messages`,
          {
            credentials: 'include',
          },
        );

        if (!isMounted) return;

        if (!response.ok) {
          setError('Conversation messages could not be loaded.');
          return;
        }

        setMessages((await response.json()) as DirectMessageDto[]);
      } catch {
        if (isMounted) {
          setError('Conversation messages could not be loaded.');
        }
      }
    };

    void loadMessages();

    return () => {
      isMounted = false;
    };
  }, [activeConversationId]);

  const sendMessage = async () => {
    if (!activeConversationId || !draft.trim()) {
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/direct-messages/conversations/${activeConversationId}/messages`,
        {
          body: JSON.stringify({ content: draft.trim() }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      );

      if (!response.ok) {
        setError('Message could not be sent.');
        return;
      }

      const message = (await response.json()) as DirectMessageDto;

      setMessages((currentMessages) => [...currentMessages, message]);
      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === activeConversationId
            ? {
                ...conversation,
                latestMessage: {
                  content: message.content,
                  createdAt: message.createdAt,
                  id: message.id,
                  senderId: message.sender.id,
                },
                updatedAt: message.createdAt,
              }
            : conversation,
        ),
      );
      setDraft('');
    } catch {
      setError('Message could not be sent.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm">Loading messages...</div>;
  }

  return (
    <div className="grid min-h-[620px] gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">Conversations</h2>
        </div>
        <div className="grid p-2">
          {conversations.length ? (
            conversations.map((conversation) => (
              <button
                className={`rounded-md px-3 py-3 text-left transition ${
                  conversation.id === activeConversationId
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                key={conversation.id}
                type="button"
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <p className="text-sm font-semibold">{participantName(conversation)}</p>
                <p className="mt-0.5 truncate text-xs opacity-75">@{participantUsername(conversation)}</p>
                <p className="mt-2 truncate text-xs opacity-75">
                  {conversation.latestMessage?.content ?? 'No messages yet'}
                </p>
              </button>
            ))
          ) : (
            <p className="p-3 text-sm text-slate-600">Open a member profile to start a conversation.</p>
          )}
        </div>
      </aside>

      <section className="grid rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">
            {activeConversation ? participantName(activeConversation) : 'Direct messages'}
          </h2>
          {activeConversation ? (
            <p className="mt-1 text-xs text-slate-500">@{participantUsername(activeConversation)}</p>
          ) : null}
        </div>

        <div className="grid max-h-[480px] content-start gap-3 overflow-y-auto p-4">
          {messages.length ? (
            messages.map((message) => (
              <article className="rounded-lg bg-slate-50 p-3" key={message.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">
                    {message.sender.profile?.displayName ?? 'Member'}
                  </p>
                  <time className="text-xs text-slate-500" dateTime={message.createdAt}>
                    {messageTime(message.createdAt)}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {message.content}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No direct messages yet.
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-3">
          <textarea
            className="min-h-24 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-950 disabled:bg-slate-100"
            disabled={!activeConversationId}
            maxLength={2000}
            placeholder="Write a direct message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">{2000 - draft.length} characters left</p>
            <button
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!activeConversationId || isSending || !draft.trim()}
              type="button"
              onClick={() => void sendMessage()}
            >
              {isSending ? 'Sending...' : 'Send message'}
            </button>
          </div>
          {error ? <p className="mt-2 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
