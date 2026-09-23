"use client";

import * as React from "react";
import type { ApplicationCounts } from "@/lib/progress/progress";

interface ProgressStatsProps {
  counts: ApplicationCounts;
}

/**
 * Progress top stats row per docs/DESIGN.md:
 * "Top: five numbers in a single row (tabular, 28/600) with labels under them, no boxes around each."
 */
export function ProgressStats({ counts }: ProgressStatsProps) {
  const stats = [
    { label: "Saved", value: counts.saved },
    { label: "Applied", value: counts.applied },
    { label: "Interviews", value: counts.interview },
    { label: "Accepted", value: counts.accepted },
    { label: "Rejected", value: counts.rejected },
  ];

  return (
    <div className="border-b border-[var(--line)] pb-6">
      <div className="grid grid-cols-5 gap-2 sm:gap-6 text-center sm:text-left">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <div className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[var(--ink)] tabular-nums leading-none">
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm font-medium text-[var(--ink-2)] mt-1.5 truncate">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
