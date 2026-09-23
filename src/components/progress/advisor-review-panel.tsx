"use client";

import * as React from "react";
import { Sparkles, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ProgressReviewItem,
} from "@/app/actions/progress";
import type { ProgressReviewStatus } from "@/lib/progress/progress";
import { requestAdvisorReviewAction } from "@/app/actions/progress";

interface AdvisorReviewPanelProps {
  initialReview: ProgressReviewItem | null;
  reviewStatus: ProgressReviewStatus;
}

export function AdvisorReviewPanel({
  initialReview,
  reviewStatus: initialStatus,
}: AdvisorReviewPanelProps) {
  const [review, setReview] = React.useState<ProgressReviewItem | null>(
    initialReview
  );
  const [status, setStatus] = React.useState<ProgressReviewStatus>(initialStatus);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleRequestReview() {
    setLoading(true);
    setError(null);

    try {
      const res = await requestAdvisorReviewAction();
      if (!res.success) {
        setError(res.error || "Unable to generate review at this time.");
      } else if (res.review) {
        setReview(res.review);
        // Calculate new 7-day cooldown
        const nextAvail = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        setStatus({
          allowed: false,
          daysRemaining: 7,
          nextAvailableDate: nextAvail,
        });
      }
    } catch {
      setError("Failed to request progress review. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Format date helper: "14 Oct 2026"
  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <section className="space-y-3 pt-2 border-t border-[var(--line)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--ink)] flex items-center gap-2">
            <Sparkles size={16} strokeWidth={1.5} className="text-[var(--teal)]" />
            <span>Advisor review</span>
          </h2>
          <p className="text-xs text-[var(--ink-2)] mt-0.5">
            An honest evaluation of your progress and concrete next steps. Available
            once every 7 days.
          </p>
        </div>

        <div>
          {status.allowed ? (
            <Button
              onClick={handleRequestReview}
              disabled={loading}
              variant="primary"
              className="w-full sm:w-auto h-9 text-xs"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  <span>Generating review...</span>
                </>
              ) : review ? (
                "Get a new review"
              ) : (
                "Generate review"
              )}
            </Button>
          ) : (
            <Button
              disabled
              variant="secondary"
              className="w-full sm:w-auto h-9 text-xs cursor-not-allowed opacity-75"
              title={
                status.nextAvailableDate
                  ? `Next available on ${formatDate(status.nextAvailableDate)}`
                  : undefined
              }
            >
              <Calendar size={13} strokeWidth={1.5} className="mr-1.5" />
              <span>
                Available in {status.daysRemaining}{" "}
                {status.daysRemaining === 1 ? "day" : "days"} (
                {status.nextAvailableDate
                  ? formatDate(status.nextAvailableDate)
                  : "Next week"}
                )
              </span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-[4px] bg-[var(--red-light)] border border-[var(--red)] p-3 text-xs text-[var(--red)]">
          {error}
        </div>
      )}

      {review ? (
        <div className="space-y-2">
          {/* Plain text on page background per DESIGN.md */}
          <div className="rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-4 text-sm leading-relaxed text-[var(--ink)] whitespace-pre-line">
            {review.content}
          </div>
          <div className="text-xs text-[var(--ink-2)] flex items-center justify-between px-1">
            <span>Reviewed on {formatDate(review.created_at)}</span>
            <span>Max 180 words</span>
          </div>
        </div>
      ) : (
        <div className="rounded-[6px] border border-dashed border-[var(--line)] bg-[var(--surface-2)]/50 p-5 text-center text-sm text-[var(--ink-2)]">
          No review generated yet. Click &quot;Generate review&quot; above to receive tailored feedback on your applications and upcoming deadlines.
        </div>
      )}
    </section>
  );
}
