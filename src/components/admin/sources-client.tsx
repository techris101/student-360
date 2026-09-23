"use client";

import React, { useState } from "react";
import { toggleSourceActive } from "@/app/actions/admin";

export interface SourceViewItem {
  id: string;
  name: string;
  url: string;
  kind: string;
  category: string;
  is_official: boolean;
  is_aggregator: boolean;
  active: boolean;
  fail_count: number;
  last_run_at?: string | null;
  last_success_at?: string | null;
}

export function SourcesClient({ initialSources }: { initialSources: SourceViewItem[] }) {
  const [sources, setSources] = useState<SourceViewItem[]>(initialSources);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const activeCount = sources.filter((s) => s.active).length;
  const failingCount = sources.filter((s) => s.fail_count >= 5).length;

  const handleToggle = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    try {
      await toggleSourceActive(id, !currentActive);
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active: !currentActive } : s))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update source status");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredSources = sources.filter((s) => {
    if (filterCategory === "all") return true;
    return s.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink-primary)]">
            Ingestion Sources
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            Manage official portals, university feeds, and aggregators.
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 bg-[var(--surface-card)] border border-[var(--border-subtle)]">
            <span className="text-[var(--ink-muted)]">Total: </span>
            <span className="font-semibold text-[var(--ink-primary)]">
              {sources.length}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-[var(--surface-card)] border border-[var(--border-subtle)]">
            <span className="text-[var(--ink-muted)]">Active: </span>
            <span className="font-semibold text-[var(--teal-primary)]">
              {activeCount}
            </span>
          </div>
          {failingCount > 0 && (
            <div className="px-3 py-1.5 bg-[var(--red-bg)] border border-[var(--red-border)] text-[var(--red-text)]">
              <span>Failing (&gt;=5): </span>
              <span className="font-semibold">{failingCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 text-xs">
        {["all", "opportunity", "news"].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 text-xs font-medium capitalize transition-colors ${
              filterCategory === cat
                ? "bg-[var(--surface-sunken)] text-[var(--ink-primary)] border-b-2 border-[var(--teal-primary)]"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sources Table */}
      <div className="border border-[var(--border-subtle)] bg-[var(--surface-card)] overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-sunken)] text-[var(--ink-secondary)] border-b border-[var(--border-subtle)]">
            <tr>
              <th className="p-3 font-medium">Source Name</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Kind</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Fails</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {filteredSources.map((source) => {
              const isToggling = togglingId === source.id;

              return (
                <tr
                  key={source.id}
                  className="hover:bg-[var(--surface-sunken)]/50 transition-colors"
                >
                  <td className="p-3">
                    <div className="font-medium text-[var(--ink-primary)]">
                      {source.name}
                    </div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[var(--teal-primary)] hover:underline font-mono truncate block max-w-xs"
                    >
                      {source.url}
                    </a>
                  </td>
                  <td className="p-3 capitalize font-mono text-[11px] text-[var(--ink-secondary)]">
                    {source.category}
                  </td>
                  <td className="p-3 uppercase font-mono text-[11px] text-[var(--ink-secondary)]">
                    {source.kind}
                  </td>
                  <td className="p-3">
                    {source.is_aggregator ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[var(--amber-bg)] text-[var(--amber-text)] border border-[var(--amber-border)]">
                        Aggregator
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[var(--surface-sunken)] text-[var(--ink-muted)]">
                        Official
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-center">
                    <span
                      className={
                        source.fail_count >= 5
                          ? "text-[var(--red-text)] font-semibold"
                          : "text-[var(--ink-muted)]"
                      }
                    >
                      {source.fail_count}
                    </span>
                  </td>
                  <td className="p-3">
                    {source.active ? (
                      <span className="text-[11px] font-mono text-[var(--teal-primary)]">
                        ● Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                        ○ Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggle(source.id, source.active)}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                        source.active
                          ? "bg-[var(--surface-sunken)] hover:bg-[var(--border-subtle)] text-[var(--ink-secondary)]"
                          : "bg-[var(--teal-primary)] hover:bg-[var(--teal-hover)] text-white"
                      }`}
                    >
                      {source.active ? "Pause" : "Activate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
