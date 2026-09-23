import React from "react";
import Link from "next/link";
import { Check, HelpCircle, X } from "lucide-react";
import type { EvaluationResult } from "@/lib/eligibility/types";

export interface OpportunityRowProps {
  id: string;
  title: string;
  organisation: string;
  type: string;
  funding: string;
  location_scope: string;
  deadline: string | null;
  deadline_rolling?: boolean;
  plan_ahead?: boolean;
  evaluation?: EvaluationResult;
}

/**
 * Formats a deadline into readable date and relative remaining time
 */
export function formatDeadlineInfo(
  deadline: string | null,
  rolling?: boolean
): {
  dateLabel: string;
  relativeLabel: string;
  urgencyColor: "normal" | "amber" | "red";
} {
  if (rolling || !deadline) {
    return {
      dateLabel: "Rolling",
      relativeLabel: "Open",
      urgencyColor: "normal",
    };
  }

  const deadlineDate = new Date(`${deadline}T23:59:59Z`);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  const dateLabel = deadlineDate.toLocaleDateString("en-GB", options);

  if (diffHours <= 0) {
    return {
      dateLabel,
      relativeLabel: "Closed",
      urgencyColor: "red",
    };
  }

  if (diffHours <= 48) {
    return {
      dateLabel,
      relativeLabel: `${diffHours}h left`,
      urgencyColor: "red",
    };
  }

  if (diffDays <= 7) {
    return {
      dateLabel,
      relativeLabel: `${diffDays} days`,
      urgencyColor: "amber",
    };
  }

  return {
    dateLabel,
    relativeLabel: `${diffDays} days`,
    urgencyColor: "normal",
  };
}

export function OpportunityRow({
  id,
  title,
  organisation,
  type,
  funding,
  location_scope,
  deadline,
  deadline_rolling,
  plan_ahead,
  evaluation,
}: OpportunityRowProps) {
  const { dateLabel, relativeLabel, urgencyColor } = formatDeadlineInfo(
    deadline,
    deadline_rolling
  );

  const urgencyClasses = {
    normal: "text-[var(--ink-2)]",
    amber: "text-[var(--amber)] font-medium",
    red: "text-[var(--red)] font-medium",
  }[urgencyColor];

  // Eligibility status per PRODUCT F1: Eligible, 6 of 7 met, Not eligible, or Check requirements
  let statusBadge = null;
  if (evaluation) {
    if (evaluation.hardFail || evaluation.notMet > 0) {
      statusBadge = (
        <div className="flex items-center gap-1.5 text-xs text-[var(--ink-2)]">
          <X className="w-3.5 h-3.5 text-[var(--red)] shrink-0" strokeWidth={2} />
          <span>Not eligible</span>
        </div>
      );
    } else if (evaluation.unknown > 0 && evaluation.met < evaluation.total) {
      statusBadge = (
        <div className="flex items-center gap-1.5 text-xs text-[var(--ink-2)]">
          <HelpCircle className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" strokeWidth={2} />
          <span>
            Check requirements ({evaluation.met} of {evaluation.total} met)
          </span>
        </div>
      );
    } else if (evaluation.met === evaluation.total && evaluation.total > 0) {
      statusBadge = (
        <div className="flex items-center gap-1.5 text-xs text-[var(--teal)] font-medium">
          <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
          <span>Eligible</span>
        </div>
      );
    } else {
      statusBadge = (
        <div className="flex items-center gap-1.5 text-xs text-[var(--teal)] font-medium">
          <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
          <span>Eligible</span>
        </div>
      );
    }
  }

  return (
    <Link
      href={`/opportunities/${id}`}
      className="group block border-b border-[var(--line)] py-4 px-2 hover:bg-[var(--surface-2)] transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left Column: Title, Org, Chips, Eligibility */}
        <div className="space-y-1.5 min-w-0 flex-1">
          <h2 className="text-base font-semibold text-[var(--ink)] group-hover:text-[var(--teal)] transition-colors line-clamp-2">
            {title}
          </h2>

          <p className="text-sm text-[var(--ink-2)] truncate font-medium">
            {organisation}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[13px] font-medium capitalize rounded-[4px] px-2 py-0.5 bg-[var(--surface-2)] text-[var(--ink-2)]">
              {type}
            </span>

            {funding && funding !== "unknown" && (
              <span className="text-[13px] font-medium capitalize rounded-[4px] px-2 py-0.5 bg-[var(--surface-2)] text-[var(--ink-2)]">
                {funding} funding
              </span>
            )}

            <span className="text-[13px] font-medium capitalize rounded-[4px] px-2 py-0.5 bg-[var(--surface-2)] text-[var(--ink-2)]">
              {location_scope}
            </span>

            {plan_ahead && (
              <span className="text-[13px] font-medium rounded-[4px] px-2 py-0.5 bg-[var(--teal-subtle)] text-[var(--teal)]">
                Plan ahead
              </span>
            )}
          </div>

          {statusBadge && <div className="pt-1">{statusBadge}</div>}
        </div>

        {/* Right Column: Deadline right-aligned with tabular numerals */}
        <div className="text-right shrink-0 text-xs space-y-0.5 pl-2">
          <span className="text-xs text-[var(--muted)] block">Closes</span>
          <span className="text-sm text-[var(--ink)] font-medium tabular-nums block">
            {dateLabel}
          </span>
          <span className={`text-xs tabular-nums block ${urgencyClasses}`}>
            {relativeLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
