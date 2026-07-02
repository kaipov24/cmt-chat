'use client';

import { apiBaseUrl } from '@/lib/api';
import { useState } from 'react';

interface ReportButtonProps {
  messageId?: string;
  reportedUserId: string;
  variant?: 'compact' | 'full';
}

export function ReportButton({ messageId, reportedUserId, variant = 'compact' }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitReport = async () => {
    const trimmedReason = reason.trim();

    if (trimmedReason.length < 10) {
      setError('Add at least 10 characters.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/reports`, {
        body: JSON.stringify({
          messageId,
          reason: trimmedReason,
          reportedUserId,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (response.status === 401) {
        setError('Sign in to submit a report.');
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
        const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;

        setError(message ?? 'Report could not be submitted.');
        return;
      }

      setSubmitted(true);
      setReason('');
      setIsOpen(false);
    } catch {
      setError('Report could not be submitted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return <p className="text-xs font-semibold text-emerald-700">Report submitted.</p>;
  }

  return (
    <div className={variant === 'full' ? 'grid gap-2' : 'grid justify-items-start gap-2'}>
      <button
        className={
          variant === 'full'
            ? 'rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950'
            : 'text-xs font-semibold text-slate-500 transition hover:text-red-700'
        }
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
          setError(null);
        }}
      >
        Report
      </button>
      {isOpen ? (
        <div className="grid w-full gap-2 rounded-md border border-slate-200 bg-white p-3">
          <textarea
            className="min-h-20 resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-950"
            maxLength={1000}
            placeholder="Describe the issue"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={isSubmitting || reason.trim().length < 10}
              type="button"
              onClick={() => void submitReport()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit report'}
            </button>
            <button
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
          </div>
          {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
        </div>
      ) : error ? (
        <p className="text-xs font-semibold text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
