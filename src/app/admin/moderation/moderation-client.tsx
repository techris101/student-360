"use client";

import React, { useState } from "react";
import { Flag, EyeOff, UserX, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  adminHideMessage,
  adminDismissReports,
  adminSuspendUser,
} from "@/app/actions/cohorts";
import type { MessageReportItem } from "@/lib/cohorts/types";

interface ModerationClientProps {
  initialReports: MessageReportItem[];
}

export function ModerationClient({ initialReports }: ModerationClientProps) {
  const [reports, setReports] = useState<MessageReportItem[]>(initialReports);
  const [loadingMap, setLoadingMap] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDismiss = async (messageId: string) => {
    setLoadingMap((prev) => ({ ...prev, [messageId]: "dismiss" }));
    try {
      await adminDismissReports(messageId);
      setReports((prev) => prev.filter((r) => r.message_id !== messageId));
      setFeedback("Reports dismissed for this message.");
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [messageId]: "" }));
    }
  };

  const handleHide = async (messageId: string) => {
    setLoadingMap((prev) => ({ ...prev, [messageId]: "hide" }));
    try {
      await adminHideMessage(messageId);
      setFeedback("Message hidden from cohort chat.");
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [messageId]: "" }));
    }
  };

  const handleSuspend = async (userId: string, messageId: string) => {
    if (!confirm("Are you sure you want to suspend this user? They will no longer be able to post messages.")) return;
    setLoadingMap((prev) => ({ ...prev, [messageId]: "suspend" }));
    try {
      await adminSuspendUser(userId);
      await adminHideMessage(messageId);
      setReports((prev) => prev.filter((r) => r.message_id !== messageId));
      setFeedback("User suspended and message hidden.");
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [messageId]: "" }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--ink-primary)]">
            Cohort Moderation
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">
            Review reported messages. Messages with 3 or more reports are automatically
            hidden pending review.
          </p>
        </div>
        <div className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--ink-secondary)]">
          {reports.length} pending items
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-teal/10 border border-teal/20 text-teal text-xs rounded flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="p-12 text-center rounded border border-dashed border-[var(--border-subtle)] bg-[var(--surface-card)]">
          <Flag className="w-8 h-8 mx-auto text-[var(--ink-muted)] mb-2 stroke-[1.5]" />
          <p className="text-sm font-semibold text-[var(--ink-primary)]">
            No reported messages
          </p>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            All cohort chats are clean and healthy.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((item) => {
            const isLoading = !!loadingMap[item.message_id];
            return (
              <div
                key={item.id}
                className="p-4 rounded border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[var(--ink-primary)]">
                        {item.opportunity_title}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-red/10 text-red border border-red/20 font-medium">
                        {item.reports_count} {item.reports_count === 1 ? "report" : "reports"}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--ink-muted)]">
                      Author: <span className="font-mono">{item.author_name} ({item.author_id.slice(0, 8)}...)</span> • Reported on {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismiss(item.message_id)}
                      disabled={isLoading}
                      className="text-xs h-8"
                    >
                      Dismiss
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHide(item.message_id)}
                      disabled={isLoading}
                      className="text-xs h-8 text-amber hover:text-amber border-amber/30"
                    >
                      <EyeOff className="w-3.5 h-3.5 mr-1" />
                      Hide message
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSuspend(item.author_id, item.message_id)}
                      disabled={isLoading}
                      className="text-xs h-8 bg-red hover:bg-red-hover text-white"
                    >
                      <UserX className="w-3.5 h-3.5 mr-1" />
                      Suspend user
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-[var(--surface-sunken)] rounded border border-[var(--border-subtle)]">
                  <p className="text-xs text-[var(--ink-primary)] whitespace-pre-wrap">
                    &quot;{item.message_body}&quot;
                  </p>
                </div>

                <div className="text-xs text-[var(--ink-secondary)] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red shrink-0" />
                  <span>Report reason: <strong>{item.reason}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
