"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ApplicationStatus } from "@/lib/supabase/types";
import type { ApplicationWithOpportunity } from "@/lib/progress/progress";
import { formatDeadlineInfo } from "@/components/opportunities/opportunity-row";
import { updateApplicationProgressStatus } from "@/app/actions/progress";

interface ProgressBoardProps {
  initialApplications: ApplicationWithOpportunity[];
  onStatusChange?: () => void;
}

const COLUMNS: {
  status: ApplicationStatus;
  label: string;
  description: string;
}[] = [
  { status: "saved", label: "Saved", description: "Opportunities you plan to consider" },
  { status: "applying", label: "Applying", description: "Currently preparing materials" },
  { status: "submitted", label: "Submitted", description: "Application sent" },
  { status: "interview", label: "Interview", description: "Interview stage reached" },
  { status: "accepted", label: "Accepted", description: "Offer received" },
  { status: "rejected", label: "Rejected", description: "Not selected this cycle" },
];

export function ProgressBoard({
  initialApplications,
  onStatusChange,
}: ProgressBoardProps) {
  const [applications, setApplications] =
    React.useState<ApplicationWithOpportunity[]>(initialApplications);
  const [interviewModal, setInterviewModal] = React.useState<{
    isOpen: boolean;
    appId: string | null;
    targetStatus: ApplicationStatus | null;
  }>({
    isOpen: false,
    appId: null,
    targetStatus: null,
  });

  const handleStatusTransition = async (
    appId: string,
    targetStatus: ApplicationStatus
  ) => {
    // If moving to accepted or rejected, prompt for the interview outcome question
    if (targetStatus === "accepted" || targetStatus === "rejected") {
      setInterviewModal({
        isOpen: true,
        appId,
        targetStatus,
      });
      return;
    }

    await applyStatusChange(appId, targetStatus, null);
  };

  const applyStatusChange = async (
    appId: string,
    targetStatus: ApplicationStatus,
    hadInterview: boolean | null
  ) => {
    // Optimistic UI update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId
          ? {
              ...app,
              status: targetStatus,
              had_interview: hadInterview ?? app.had_interview,
              updated_at: new Date().toISOString(),
            }
          : app
      )
    );

    try {
      await updateApplicationProgressStatus(appId, targetStatus, hadInterview);
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error("Failed to update status:", err);
      // Revert if error
      setApplications(initialApplications);
    }
  };

  // Group applications by status
  const grouped = React.useMemo(() => {
    const map = new Map<ApplicationStatus, ApplicationWithOpportunity[]>();
    for (const col of COLUMNS) {
      map.set(col.status, []);
    }
    for (const app of applications) {
      const list = map.get(app.status);
      if (list) {
        list.push(app);
      }
    }
    return map;
  }, [applications]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--ink)]">
            Applications board
          </h2>
          <p className="text-xs text-[var(--ink-2)] mt-0.5">
            Track each application from saved to final decision. Status changes are one tap.
          </p>
        </div>
        <Link
          href="/opportunities"
          className="text-xs font-medium text-[var(--teal)] hover:underline inline-flex items-center gap-1"
        >
          <span>Find more opportunities</span>
          <ArrowRight size={13} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Desktop Board View (>= 768px: horizontal scrolling column grid) */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-3 min-w-0">
        {COLUMNS.map((col) => {
          const items = grouped.get(col.status) || [];
          return (
            <div
              key={col.status}
              className="flex flex-col rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-2.5 min-w-0"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="text-xs font-semibold text-[var(--ink)] truncate">
                  {col.label}
                </span>
                <span className="text-xs font-semibold tabular-nums text-[var(--ink-2)] px-1.5 py-0.5 rounded-[4px] bg-[var(--surface-2)]">
                  {items.length}
                </span>
              </div>

              <div className="flex-1 py-2 space-y-2 min-h-[140px]">
                {items.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-3 text-center text-xs text-[var(--ink-2)]">
                    No items
                  </div>
                ) : (
                  items.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      app={app}
                      onTransition={handleStatusTransition}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Grouped List View (< 768px: vertical sections per DESIGN.md) */}
      <div className="md:hidden space-y-4">
        {COLUMNS.map((col) => {
          const items = grouped.get(col.status) || [];
          if (items.length === 0) return null;

          return (
            <div
              key={col.status}
              className="rounded-[6px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden"
            >
              <div className="flex items-center justify-between bg-[var(--surface-2)] px-3 py-2 border-b border-[var(--line)]">
                <span className="text-xs font-semibold text-[var(--ink)]">
                  {col.label}
                </span>
                <span className="text-xs font-semibold tabular-nums text-[var(--ink-2)]">
                  {items.length}
                </span>
              </div>

              <div className="divide-y divide-[var(--line)]">
                {items.map((app) => (
                  <div key={app.id} className="p-3">
                    <ApplicationCard
                      app={app}
                      onTransition={handleStatusTransition}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {applications.length === 0 && (
          <div className="rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--ink-2)] space-y-3">
            <p>You have not saved any opportunities yet.</p>
            <Link href="/opportunities">
              <Button variant="primary" className="text-xs h-9">
                Browse opportunities feed
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Interview Outcome Modal (PRODUCT F5: "Did you get an interview?") */}
      <Dialog
        open={interviewModal.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setInterviewModal({ isOpen: false, appId: null, targetStatus: null });
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Outcome details
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--ink-2)]">
              This helps Student 360 build realistic outcome statistics for Rwandan
              students. Did you have an interview for this programme?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1 text-xs h-9"
              onClick={() => {
                if (interviewModal.appId && interviewModal.targetStatus) {
                  applyStatusChange(
                    interviewModal.appId,
                    interviewModal.targetStatus,
                    false
                  );
                }
                setInterviewModal({ isOpen: false, appId: null, targetStatus: null });
              }}
            >
              No interview
            </Button>
            <Button
              variant="primary"
              className="flex-1 text-xs h-9"
              onClick={() => {
                if (interviewModal.appId && interviewModal.targetStatus) {
                  applyStatusChange(
                    interviewModal.appId,
                    interviewModal.targetStatus,
                    true
                  );
                }
                setInterviewModal({ isOpen: false, appId: null, targetStatus: null });
              }}
            >
              Yes, interviewed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApplicationCard({
  app,
  onTransition,
}: {
  app: ApplicationWithOpportunity;
  onTransition: (appId: string, status: ApplicationStatus) => void;
}) {
  const info = formatDeadlineInfo(
    app.opportunity.deadline,
    app.opportunity.deadline_rolling
  );

  return (
    <div className="rounded-[4px] border border-[var(--line)] bg-[var(--surface)] p-2.5 space-y-2 hover:border-[var(--line-strong)] transition-colors">
      <div className="flex items-start justify-between gap-1">
        <Link
          href={`/opportunities/${app.opportunity.id}`}
          className="text-xs font-semibold text-[var(--ink)] hover:text-[var(--teal)] hover:underline line-clamp-2 leading-snug flex-1"
        >
          {app.opportunity.title}
        </Link>

        {/* Status Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 -mr-1 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] rounded-[4px] shrink-0"
              aria-label="Change application status"
            >
              <MoreVertical size={14} strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 text-xs">
            <DropdownMenuLabel className="text-[11px] font-semibold text-[var(--ink-2)]">
              Move to status
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={app.status === "saved"}
              onClick={() => onTransition(app.id, "saved")}
            >
              <Clock size={13} className="mr-2" />
              <span>Saved</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={app.status === "applying"}
              onClick={() => onTransition(app.id, "applying")}
            >
              <ArrowRight size={13} className="mr-2" />
              <span>Applying</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={app.status === "submitted"}
              onClick={() => onTransition(app.id, "submitted")}
            >
              <CheckCircle2 size={13} className="mr-2" />
              <span>Submitted</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={app.status === "interview"}
              onClick={() => onTransition(app.id, "interview")}
            >
              <HelpCircle size={13} className="mr-2" />
              <span>Interview</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={app.status === "accepted"}
              onClick={() => onTransition(app.id, "accepted")}
              className="text-[var(--teal)] font-medium"
            >
              <CheckCircle2 size={13} className="mr-2" />
              <span>Accepted</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={app.status === "rejected"}
              onClick={() => onTransition(app.id, "rejected")}
              className="text-[var(--red)] font-medium"
            >
              <XCircle size={13} className="mr-2" />
              <span>Rejected</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={app.status === "withdrawn"}
              onClick={() => onTransition(app.id, "withdrawn")}
              className="text-[var(--ink-2)]"
            >
              <span>Withdraw</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-[11px] text-[var(--ink-2)] truncate">
        {app.opportunity.organisation}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[var(--line)] text-[10px]">
        <span
          className={`inline-flex items-center gap-1 font-medium ${
            info.urgencyColor === "red"
              ? "text-[var(--red)] font-semibold"
              : info.urgencyColor === "amber"
              ? "text-[var(--amber)]"
              : "text-[var(--ink-2)]"
          }`}
        >
          {info.urgencyColor === "red" ? (
            <AlertCircle size={11} strokeWidth={2} />
          ) : (
            <Calendar size={11} strokeWidth={1.5} />
          )}
          {info.dateLabel} ({info.relativeLabel})
        </span>

        {app.had_interview !== null && (
          <span className="text-[10px] text-[var(--ink-2)]">
            {app.had_interview ? "Interviewed" : "No interview"}
          </span>
        )}
      </div>
    </div>
  );
}
