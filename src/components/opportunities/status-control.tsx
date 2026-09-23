"use client";

import React, { useState } from "react";
import { updateApplicationStatus } from "@/app/actions/opportunities";
import type { ApplicationStatus } from "@/lib/supabase/types";
import { useToast } from "@/components/ui/toast";

interface StatusControlProps {
  opportunityId: string;
  initialStatus?: ApplicationStatus | null;
}

const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string }> = [
  { value: "saved", label: "Save" },
  { value: "applying", label: "Applying" },
  { value: "submitted", label: "Submitted" },
  { value: "interview", label: "Interview" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

export function StatusControl({
  opportunityId,
  initialStatus,
}: StatusControlProps) {
  const [status, setStatus] = useState<ApplicationStatus | null>(
    initialStatus || null
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ApplicationStatus;
    if (!newStatus) return;

    setLoading(true);

    try {
      await updateApplicationStatus(opportunityId, newStatus);
      setStatus(newStatus);

      const optionLabel =
        STATUS_OPTIONS.find((o) => o.value === newStatus)?.label || newStatus;

      if (newStatus === "applying" || newStatus === "submitted") {
        toast(`Marked as ${optionLabel.toLowerCase()}. Joined cohort.`);
      } else {
        toast(`Marked as ${optionLabel.toLowerCase()}`);
      }
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Failed to update status",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <label htmlFor={`status-select-${opportunityId}`} className="sr-only">
        Application status
      </label>
      <select
        id={`status-select-${opportunityId}`}
        value={status || "none"}
        disabled={loading}
        onChange={handleStatusChange}
        className="h-10 text-sm font-medium px-3 bg-[var(--surface)] border border-[var(--line-strong)] text-[var(--ink)] hover:border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] focus:ring-offset-2 cursor-pointer disabled:opacity-50 rounded-[4px]"
      >
        <option value="none" disabled>
          Status: Untracked
        </option>
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            Status: {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
