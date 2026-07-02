'use client';

import type { ReportSummaryDto } from '@/lib/api';
import { apiBaseUrl } from '@/lib/api';
import { useEffect, useState } from 'react';

function actorLabel(user: ReportSummaryDto['reporter']) {
  return user.profile ? `${user.profile.displayName} (@${user.profile.username})` : user.id;
}

function reportTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

type ReportStatus = ReportSummaryDto['status'];

export function ModerationReports() {
  const [reports, setReports] = useState<ReportSummaryDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/reports`, {
          credentials: 'include',
        });

        if (!isMounted) return;

        if (response.status === 401) {
          setError('Sign in with a moderator or admin account.');
          return;
        }

        if (response.status === 403) {
          setError('Moderator access is required.');
          return;
        }

        if (!response.ok) {
          setError('Reports could not be loaded.');
          return;
        }

        setReports((await response.json()) as ReportSummaryDto[]);
      } catch {
        if (isMounted) {
          setError('Reports could not be loaded.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateReport = async (
    report: ReportSummaryDto,
    status: ReportStatus,
    suspendReportedUser = false,
  ) => {
    setError(null);
    setUpdatingReportId(report.id);

    try {
      const response = await fetch(`${apiBaseUrl}/api/reports/${report.id}`, {
        body: JSON.stringify({
          status,
          suspendReportedUser,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      });

      if (response.status === 403) {
        setError(suspendReportedUser ? 'Only admins can suspend users.' : 'Moderator access is required.');
        return;
      }

      if (!response.ok) {
        setError('Report could not be updated.');
        return;
      }

      const updatedReport = (await response.json()) as ReportSummaryDto;

      setReports((currentReports) =>
        currentReports.map((currentReport) =>
          currentReport.id === updatedReport.id ? updatedReport : currentReport,
        ),
      );
    } catch {
      setError('Report could not be updated.');
    } finally {
      setUpdatingReportId(null);
    }
  };

  if (isLoading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm">Loading reports...</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">{error}</div>;
  }

  if (!reports.length) {
    return <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">No reports yet.</div>;
  }

  return (
    <div className="grid gap-3">
      {reports.map((report) => (
        <article className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4" key={report.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">
                {report.status.replaceAll('_', ' ')}
              </p>
              {report.reviewedAt ? (
                <p className="text-xs text-slate-500">Reviewed {reportTime(report.reviewedAt)}</p>
              ) : null}
            </div>
            <time className="text-xs text-slate-500" dateTime={report.createdAt}>
              {reportTime(report.createdAt)}
            </time>
          </div>
          <div className="grid gap-1 text-sm text-slate-600">
            <p>
              Reporter: <span className="font-medium text-slate-950">{actorLabel(report.reporter)}</span>
            </p>
            <p>
              Reported: <span className="font-medium text-slate-950">{actorLabel(report.reportedUser)}</span>
            </p>
          </div>
          {report.message ? (
            <blockquote className="rounded-md border-l-4 border-slate-300 bg-slate-50 p-3 text-sm text-slate-700">
              {report.message.content}
            </blockquote>
          ) : null}
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{report.reason}</p>
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <button
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={updatingReportId === report.id}
              type="button"
              onClick={() => void updateReport(report, 'reviewed')}
            >
              Mark reviewed
            </button>
            <button
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={updatingReportId === report.id}
              type="button"
              onClick={() => void updateReport(report, 'dismissed')}
            >
              Dismiss
            </button>
            <button
              className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={updatingReportId === report.id}
              type="button"
              onClick={() => void updateReport(report, 'action_taken', true)}
            >
              Suspend reported user
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
