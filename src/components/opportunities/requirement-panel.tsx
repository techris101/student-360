import React from "react";
import { Check, HelpCircle, X } from "lucide-react";
import type { EvaluationResult } from "@/lib/eligibility/types";

export function RequirementPanel({ evaluation }: { evaluation: EvaluationResult }) {
  if (!evaluation || evaluation.checks.length === 0) {
    return (
      <div className="p-4 bg-[var(--surface)] border border-[var(--line)] border-l-[3px] border-l-[var(--teal)] space-y-1">
        <h3 className="text-base font-semibold text-[var(--ink)]">
          Requirement check
        </h3>
        <p className="text-sm text-[var(--ink-2)]">
          No specific eligibility restrictions specified on the official call. Open to Rwandan university students.
        </p>
      </div>
    );
  }

  // Border color: red if hard fail, amber if any not met or unknown, teal if all met
  let borderColor = "border-l-[var(--teal)]";
  if (evaluation.hardFail) {
    borderColor = "border-l-[var(--red)]";
  } else if (evaluation.notMet > 0 || evaluation.unknown > 0) {
    borderColor = "border-l-[var(--amber)]";
  }

  const metCount = evaluation.met;
  const totalCount = evaluation.total;

  return (
    <div
      className={`p-5 bg-[var(--surface)] border border-[var(--line)] border-l-[3px] ${borderColor} space-y-3.5`}
    >
      <div className="space-y-0.5">
        <h3 className="text-base font-semibold text-[var(--ink)]">
          Requirement check
        </h3>
        <p className="text-sm text-[var(--ink-2)]">
          {totalCount === 0
            ? "Open call"
            : metCount === totalCount
            ? `You meet all ${totalCount} requirements.`
            : `You meet ${metCount} of ${totalCount} requirements${
                evaluation.unknown > 0 ? ` (${evaluation.unknown} to verify)` : ""
              }.`}
        </p>
      </div>

      <div className="space-y-2.5 pt-1">
        {evaluation.checks.map((chk, idx) => {
          let icon = (
            <Check
              className="w-5 h-5 text-[var(--teal)] shrink-0 mt-0.5"
              strokeWidth={2}
            />
          );
          if (chk.status === "not_met") {
            icon = (
              <X
                className="w-5 h-5 text-[var(--red)] shrink-0 mt-0.5"
                strokeWidth={2}
              />
            );
          } else if (chk.status === "unknown") {
            icon = (
              <HelpCircle
                className="w-5 h-5 text-[var(--muted)] shrink-0 mt-0.5"
                strokeWidth={2}
              />
            );
          }

          return (
            <div key={idx} className="flex items-start gap-3 text-sm">
              {icon}
              <div className="leading-snug">
                <span className="text-[var(--ink)] font-normal">
                  {chk.label}
                </span>
                {chk.hint && (
                  <span className="text-[var(--ink-2)]">
                    {" "}— {chk.hint}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
