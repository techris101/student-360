import React from "react";
import Link from "next/link";
import { Clock, AlertCircle } from "lucide-react";
import type { StudentProfileData } from "@/lib/eligibility/types";

export interface DueItem {
  id: string;
  title: string;
  organisation: string;
  deadline: string;
  daysRemaining: number;
}

export function RightRail({
  profile,
  dueItems = [],
}: {
  profile: StudentProfileData | null;
  dueItems?: DueItem[];
}) {
  // Compute profile gaps and impact
  const gaps: Array<{ field: string; sentence: string }> = [];

  if (!profile?.gpa) {
    gaps.push({
      field: "gpa",
      sentence: "Add your GPA to check 35 more requirements.",
    });
  }

  const hasLanguageTest = profile?.languages?.some((l) => Boolean(l.test));
  if (!hasLanguageTest) {
    gaps.push({
      field: "languages",
      sentence: "Add your English test to check UK and European scholarship requirements.",
    });
  }

  if (!profile?.experience || profile.experience.length === 0) {
    gaps.push({
      field: "experience",
      sentence: "Add your work or volunteer experience to check fellowship criteria.",
    });
  }

  if (!profile?.fields || profile.fields.length === 0) {
    gaps.push({
      field: "fields",
      sentence: "Select your study fields to improve personalised ranking accuracy.",
    });
  }

  return (
    <div className="space-y-6">
      {/* Due this week section */}
      <div className="bg-[var(--surface)] border border-[var(--line)] p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
          <Clock className="w-4 h-4 text-[var(--amber)] shrink-0" strokeWidth={1.5} />
          <span>Due this week</span>
        </div>

        {dueItems.length === 0 ? (
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            No deadlines due in the next 7 days.
          </p>
        ) : (
          <div className="space-y-3">
            {dueItems.map((item) => (
              <Link
                key={item.id}
                href={`/opportunities/${item.id}`}
                className="group block space-y-0.5 text-xs hover:bg-[var(--surface-2)] p-1.5 -mx-1.5 rounded-[4px] transition-colors"
              >
                <div className="font-medium text-[var(--ink)] group-hover:text-[var(--teal)] line-clamp-1">
                  {item.title}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[var(--ink-2)]">
                  <span className="truncate">{item.organisation}</span>
                  <span
                    className={`tabular-nums shrink-0 font-medium ${
                      item.daysRemaining <= 2
                        ? "text-[var(--red)]"
                        : "text-[var(--amber)]"
                    }`}
                  >
                    {item.daysRemaining === 1
                      ? "1 day left"
                      : `${item.daysRemaining} days`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Profile Gaps Section */}
      <div className="bg-[var(--surface)] border border-[var(--line)] p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
          <AlertCircle className="w-4 h-4 text-[var(--teal)] shrink-0" strokeWidth={1.5} />
          <span>Profile gaps</span>
        </div>

        {gaps.length === 0 ? (
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            Your profile is complete. All stated requirements can now be accurately evaluated.
          </p>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="space-y-2">
              {gaps.slice(0, 3).map((gap) => (
                <div
                  key={gap.field}
                  className="p-2.5 bg-[var(--surface-2)] border-l-[3px] border-l-[var(--amber)] text-xs text-[var(--ink)] leading-relaxed"
                >
                  {gap.sentence}
                </div>
              ))}
            </div>

            <div className="pt-1">
              <Link
                href="/profile"
                className="text-xs font-medium text-[var(--teal)] hover:underline"
              >
                Update profile
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
