"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, AlertCircle } from "lucide-react";
import type { ApplicationWithOpportunity } from "@/lib/progress/progress";
import { formatDeadlineInfo } from "@/components/opportunities/opportunity-row";

interface UpcomingDeadlinesProps {
  deadlines: ApplicationWithOpportunity[];
}

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  if (deadlines.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--ink)]">
          Upcoming deadlines
        </h2>
        <div className="rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--ink-2)]">
          No upcoming deadlines for your saved or active applications.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--ink)]">
          Upcoming deadlines
        </h2>
        <span className="text-xs text-[var(--ink-2)] font-medium">
          {deadlines.length} {deadlines.length === 1 ? "programme" : "programmes"}
        </span>
      </div>

      <div className="divide-y divide-[var(--line)] rounded-[6px] border border-[var(--line)] bg-[var(--surface)]">
        {deadlines.map((app) => {
          const info = formatDeadlineInfo(
            app.opportunity.deadline,
            app.opportunity.deadline_rolling
          );

          return (
            <div
              key={app.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 hover:bg-[var(--surface-2)] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/opportunities/${app.opportunity.id}`}
                  className="text-sm font-semibold text-[var(--ink)] hover:text-[var(--teal)] hover:underline truncate block"
                >
                  {app.opportunity.title}
                </Link>
                <div className="text-xs text-[var(--ink-2)] mt-0.5 truncate">
                  {app.opportunity.organisation} · {app.opportunity.type}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-xs font-medium tabular-nums ${
                    info.urgencyColor === "red"
                      ? "bg-[var(--red-light)] text-[var(--red)] font-semibold"
                      : info.urgencyColor === "amber"
                      ? "bg-[var(--amber-light)] text-[var(--amber)]"
                      : "bg-[var(--surface-2)] text-[var(--ink-2)]"
                  }`}
                >
                  {info.urgencyColor === "red" ? (
                    <AlertCircle size={13} strokeWidth={2} />
                  ) : (
                    <Calendar size={13} strokeWidth={1.5} />
                  )}
                  {info.dateLabel} ({info.relativeLabel})
                </span>

                <Link
                  href={`/opportunities/${app.opportunity.id}`}
                  className="text-xs font-medium text-[var(--teal)] hover:underline px-1.5 py-0.5"
                >
                  View
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
