"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

const TYPE_OPTIONS: FilterOption[] = [
  { value: "all", label: "All types" },
  { value: "scholarship", label: "Scholarships" },
  { value: "fellowship", label: "Fellowships" },
  { value: "internship", label: "Internships" },
  { value: "grant", label: "Grants" },
  { value: "course", label: "Courses" },
  { value: "competition", label: "Competitions" },
  { value: "conference", label: "Conferences" },
  { value: "exchange", label: "Exchanges" },
  { value: "research", label: "Research" },
];

const FUNDING_OPTIONS: FilterOption[] = [
  { value: "all", label: "All funding" },
  { value: "full", label: "Full funding" },
  { value: "partial", label: "Partial funding" },
  { value: "none", label: "Self-funded / Unfunded" },
];

const LOCATION_OPTIONS: FilterOption[] = [
  { value: "all", label: "All locations" },
  { value: "rwanda", label: "Rwanda" },
  { value: "africa", label: "Africa" },
  { value: "abroad", label: "Abroad" },
  { value: "online", label: "Online" },
];

const SORT_OPTIONS: FilterOption[] = [
  { value: "eligible", label: "Eligible first" },
  { value: "deadline", label: "Closest deadline" },
  { value: "newest", label: "Newest posted" },
];

export function OpportunityFilters({
  initialQuery = "",
  initialType = "all",
  initialFunding = "all",
  initialLocation = "all",
  initialSort = "eligible",
  initialPlanAhead = false,
  initialShowNotEligible = false,
}: {
  initialQuery?: string;
  initialType?: string;
  initialFunding?: string;
  initialLocation?: string;
  initialSort?: string;
  initialPlanAhead?: boolean;
  initialShowNotEligible?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = React.useState(initialQuery);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset pagination when filters change
    params.delete("page");

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all" || value === "false") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: query.trim() || null });
  };

  const currentType = searchParams.get("type") || initialType;
  const currentFunding = searchParams.get("funding") || initialFunding;
  const currentLocation = searchParams.get("location_scope") || initialLocation;
  const currentSort = searchParams.get("sort") || initialSort;
  const currentPlanAhead = searchParams.get("plan_ahead") === "true" || initialPlanAhead;
  const currentShowNotEligible =
    searchParams.get("show_not_eligible") === "true" || initialShowNotEligible;

  const hasActiveFilters =
    Boolean(query) ||
    currentType !== "all" ||
    currentFunding !== "all" ||
    currentLocation !== "all" ||
    currentPlanAhead ||
    currentShowNotEligible;

  const handleResetFilters = () => {
    setQuery("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="space-y-3 pb-4 border-b border-[var(--line)]">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <label htmlFor="opportunity-search" className="sr-only">
          Search opportunities
        </label>
        <div className="absolute left-3 text-[var(--muted)] pointer-events-none">
          <Search className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <input
          id="opportunity-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, organisation, or field..."
          className="w-full h-10 pl-9 pr-20 text-sm bg-[var(--surface)] text-[var(--ink)] border border-[var(--line-strong)] rounded-[4px] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] focus:ring-offset-2"
        />
        <button
          type="submit"
          className="absolute right-1.5 h-7 px-2.5 text-xs font-medium text-[var(--ink)] bg-[var(--surface-2)] hover:bg-[var(--line)] rounded-[3px] transition-colors"
        >
          Search
        </button>
      </form>

      {/* Primary Filter Selects & Sort */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Type Filter */}
        <div>
          <label htmlFor="filter-type" className="sr-only">
            Filter by opportunity type
          </label>
          <select
            id="filter-type"
            value={currentType}
            onChange={(e) => updateFilters({ type: e.target.value })}
            className="w-full h-9 text-xs font-medium px-2.5 bg-[var(--surface)] border border-[var(--line-strong)] text-[var(--ink)] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] cursor-pointer"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Funding Filter */}
        <div>
          <label htmlFor="filter-funding" className="sr-only">
            Filter by funding
          </label>
          <select
            id="filter-funding"
            value={currentFunding}
            onChange={(e) => updateFilters({ funding: e.target.value })}
            className="w-full h-9 text-xs font-medium px-2.5 bg-[var(--surface)] border border-[var(--line-strong)] text-[var(--ink)] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] cursor-pointer"
          >
            {FUNDING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label htmlFor="filter-location" className="sr-only">
            Filter by location
          </label>
          <select
            id="filter-location"
            value={currentLocation}
            onChange={(e) => updateFilters({ location_scope: e.target.value })}
            className="w-full h-9 text-xs font-medium px-2.5 bg-[var(--surface)] border border-[var(--line-strong)] text-[var(--ink)] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] cursor-pointer"
          >
            {LOCATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label htmlFor="filter-sort" className="sr-only">
            Sort opportunities
          </label>
          <select
            id="filter-sort"
            value={currentSort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="w-full h-9 text-xs font-medium px-2.5 bg-[var(--surface)] border border-[var(--line-strong)] text-[var(--ink)] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toggles & Reset Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-[var(--ink-2)]">
        <div className="flex flex-wrap items-center gap-4">
          {/* Plan Ahead Filter */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={currentPlanAhead}
              onChange={(e) =>
                updateFilters({ plan_ahead: e.target.checked ? "true" : null })
              }
              className="w-4 h-4 rounded border-[var(--line-strong)] text-[var(--teal)] focus:ring-[var(--teal)] cursor-pointer"
            />
            <span className="font-medium text-[var(--ink)]">Plan ahead only</span>
          </label>

          {/* Show Not Eligible Toggle (PRODUCT F1: hidden by default, toggle to show) */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={currentShowNotEligible}
              onChange={(e) =>
                updateFilters({
                  show_not_eligible: e.target.checked ? "true" : null,
                })
              }
              className="w-4 h-4 rounded border-[var(--line-strong)] text-[var(--teal)] focus:ring-[var(--teal)] cursor-pointer"
            />
            <span>Show not eligible</span>
          </label>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear filters</span>
          </button>
        )}
      </div>

      {isPending && (
        <div className="text-[11px] text-[var(--muted)] pt-0.5">
          Updating results...
        </div>
      )}
    </div>
  );
}
