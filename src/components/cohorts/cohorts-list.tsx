"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, Clock, ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { CohortItem } from "@/lib/cohorts/types";

interface CohortsListProps {
  cohorts: CohortItem[];
}

export function CohortsListView({ cohorts }: CohortsListProps) {
  const [activeTab, setActiveTab] = useState<"joined" | "all">("joined");

  const joinedCohorts = cohorts.filter((c) => c.is_member);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header and description */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-ink">Cohorts</h1>
        <p className="text-xs text-muted leading-relaxed">
          Connect with fellow university students in Rwanda applying to the same
          opportunities. Discuss requirements, share verified timelines, and prepare
          together.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "joined" | "all")}
        className="w-full"
      >
        <div className="flex items-center justify-between border-b border-border pb-2">
          <TabsList className="bg-surface-2 p-1 rounded-md">
            <TabsTrigger
              value="joined"
              className="text-xs data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-none"
            >
              My Cohorts ({joinedCohorts.length})
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="text-xs data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-none"
            >
              All Cohorts ({cohorts.length})
            </TabsTrigger>
          </TabsList>

          <Link href="/opportunities">
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Explore opportunities</span>
            </Button>
          </Link>
        </div>

        {/* Tab 1: My Cohorts */}
        <TabsContent value="joined" className="mt-4 space-y-2.5">
          {joinedCohorts.length === 0 ? (
            <div className="p-8 rounded-lg border border-dashed border-border bg-surface text-center space-y-3">
              <Users className="w-8 h-8 mx-auto text-muted/60 stroke-[1.5]" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">
                  You have not joined any cohorts yet
                </p>
                <p className="text-xs text-muted max-w-md mx-auto">
                  When you mark an opportunity as &quot;Applying&quot; or &quot;Submitted&quot; in
                  your tracker, you will automatically join that opportunity&apos;s cohort.
                </p>
              </div>
              <div className="pt-1">
                <Button
                  size="sm"
                  onClick={() => setActiveTab("all")}
                  className="text-xs bg-teal hover:bg-teal-hover text-white"
                >
                  Browse available cohorts
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border bg-surface overflow-hidden">
              {joinedCohorts.map((cohort) => (
                <CohortRow key={cohort.id} cohort={cohort} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: All Cohorts */}
        <TabsContent value="all" className="mt-4 space-y-2.5">
          {cohorts.length === 0 ? (
            <div className="p-8 rounded-lg border border-dashed border-border bg-surface text-center space-y-2">
              <p className="text-sm font-semibold text-ink">No cohorts available</p>
              <p className="text-xs text-muted">
                Cohorts are automatically generated for published opportunities.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border bg-surface overflow-hidden">
              {cohorts.map((cohort) => (
                <CohortRow key={cohort.id} cohort={cohort} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CohortRow({ cohort }: { cohort: CohortItem }) {
  const deadlineDate = cohort.deadline
    ? new Date(cohort.deadline).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="p-4 hover:bg-surface-2 transition-colors flex items-center justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/cohorts/${cohort.id}`}
            className="font-semibold text-sm text-ink hover:text-teal transition-colors"
          >
            {cohort.opportunity_title}
          </Link>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-surface-3 text-muted capitalize">
            {cohort.opportunity_type}
          </span>
          {cohort.is_member && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-teal/10 text-teal border border-teal/20">
              Joined
            </span>
          )}
          {cohort.is_closed ? (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber/10 text-amber border border-amber/20">
              Closed
            </span>
          ) : (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
              Open
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{cohort.organisation}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {cohort.member_count} {cohort.member_count === 1 ? "student" : "students"}
          </span>
          {deadlineDate && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Deadline: {deadlineDate}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <Link href={`/cohorts/${cohort.id}`}>
          <Button
            size="sm"
            variant={cohort.is_member ? "primary" : "outline"}
            className={cn(
              "text-xs h-8 gap-1.5",
              cohort.is_member ? "bg-teal hover:bg-teal-hover text-white" : ""
            )}
          >
            <span>{cohort.is_member ? "Open chat" : "View cohort"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
