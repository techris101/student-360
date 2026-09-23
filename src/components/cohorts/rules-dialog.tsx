"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { COMMUNITY_RULES } from "@/lib/cohorts/rules";
import { ShieldCheck } from "lucide-react";

interface RulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => Promise<void>;
  loading?: boolean;
}

export function RulesDialog({
  open,
  onOpenChange,
  onAccept,
  loading = false,
}: RulesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 text-ink dark:text-ink">
            <ShieldCheck className="w-5 h-5 text-teal" />
            <DialogTitle className="text-base font-semibold">
              Cohort Community Rules
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted">
            Cohorts are spaces for university students in Rwanda applying to the same
            opportunity to prepare together honestly and respectfully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-2 text-xs">
          {COMMUNITY_RULES.map((rule, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded bg-surface-2 border border-border space-y-0.5"
            >
              <div className="font-medium text-ink">
                {idx + 1}. {rule.title}
              </div>
              <p className="text-muted leading-relaxed">{rule.description}</p>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onAccept}
            disabled={loading}
            className="bg-teal hover:bg-teal-hover text-white"
          >
            {loading ? "Accepting..." : "Accept and continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
