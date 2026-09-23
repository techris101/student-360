"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";

interface ReportDialogProps {
  messageId: string | null;
  messageAuthor: string;
  messageSnippet: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitReport: (messageId: string, reason: string) => Promise<void>;
}

const REPORT_REASONS = [
  "Spam, advertising, or external links",
  "Harassment, abuse, or inappropriate language",
  "Solicitation of money, credentials, or private info",
  "Misinformation about the opportunity",
  "Other rule violation",
];

export function ReportDialog({
  messageId,
  messageAuthor,
  messageSnippet,
  open,
  onOpenChange,
  onSubmitReport,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!messageId) return;
    setSubmitting(true);
    try {
      await onSubmitReport(messageId, selectedReason);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 text-ink">
            <Flag className="w-4 h-4 text-red" />
            <DialogTitle className="text-base font-semibold">
              Report Message
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted">
            Reports are reviewed by administration. Three reports automatically hide a
            message pending moderation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-2 text-xs">
          <div className="p-2.5 rounded bg-surface-2 border border-border">
            <div className="text-[11px] font-medium text-muted mb-1">
              Message from {messageAuthor}:
            </div>
            <p className="text-ink italic line-clamp-3">
              &quot;{messageSnippet}&quot;
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-ink block text-xs">
              Reason for report
            </label>
            <div className="space-y-1">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2.5 p-2 rounded hover:bg-surface-2 cursor-pointer border border-transparent hover:border-border text-xs text-ink"
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="accent-teal w-3.5 h-3.5"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-red hover:bg-red-hover text-white"
          >
            {submitting ? "Submitting..." : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
