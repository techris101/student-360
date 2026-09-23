"use client";

import React, { useState, useMemo } from "react";
import { Search, ExternalLink, Calendar, Newspaper, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { filterPublishedNews, CATEGORY_LABELS, NewsCategory } from "@/lib/news/news";
import type { NewsItem } from "@/lib/data/news";
import { cn } from "@/lib/utils";

interface NewsFeedProps {
  initialNews: NewsItem[];
}

const CATEGORIES: Array<{ key: string; label: string }> = [
  { key: "all", label: "All News" },
  { key: "universities", label: "University Announcements" },
  { key: "policy", label: "Policy & Reforms" },
  { key: "funding", label: "Bursaries & Loans" },
  { key: "careers", label: "Jobs & Careers" },
];

export function NewsFeed({ initialNews }: NewsFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNews = useMemo(() => {
    return filterPublishedNews(initialNews, {
      category: selectedCategory,
      query: searchQuery,
    });
  }, [initialNews, selectedCategory, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header and description */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-ink">News & Updates</h1>
        <p className="text-xs text-muted leading-relaxed">
          Verified higher education announcements, student loans and bursary updates,
          government policies, and career opportunities across Rwanda. Updated within a
          rolling 30-day window.
        </p>
      </div>

      {/* Controls: Search and Categories */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news by headline or keywords..."
            className="pl-9 pr-8 text-xs h-9 bg-surface border-border focus:border-teal"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <Button
                key={cat.key}
                variant={isSelected ? "primary" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "text-xs h-7 px-3 shrink-0 rounded-full font-normal transition-colors",
                  isSelected
                    ? "bg-teal hover:bg-teal-hover text-white font-medium"
                    : "bg-surface hover:bg-surface-2 text-ink border-border"
                )}
              >
                {cat.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* News Items List */}
      {filteredNews.length === 0 ? (
        <div className="p-12 text-center rounded-lg border border-dashed border-border bg-surface space-y-2">
          <Newspaper className="w-8 h-8 mx-auto text-muted/60 stroke-[1.5]" />
          <p className="text-sm font-semibold text-ink">No news articles found</p>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {searchQuery
              ? `No published articles matched "${searchQuery}". Try a different search term or category.`
              : "No articles are currently published in this category within the last 30 days."}
          </p>
          {(searchQuery || selectedCategory !== "all") && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-xs h-7"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-surface overflow-hidden">
          {filteredNews.map((item) => (
            <NewsRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  const publishedDate = new Date(item.published_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const categoryLabel =
    CATEGORY_LABELS[item.category as NewsCategory] || item.category;

  // Extract source domain name for attribution
  let domain = "";
  try {
    const parsed = new URL(item.url);
    domain = parsed.hostname.replace(/^www\./, "");
  } catch {
    domain = "official portal";
  }

  return (
    <article className="p-4 hover:bg-surface-2 transition-colors space-y-2">
      {/* Top Metadata */}
      <div className="flex items-center gap-2 text-[11px] text-muted flex-wrap">
        <span className="font-medium px-2 py-0.5 rounded bg-surface-3 text-ink border border-border capitalize">
          {categoryLabel}
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-muted" />
          {publishedDate}
        </span>
        <span>•</span>
        <span>Source: {domain}</span>
      </div>

      {/* Title */}
      <h2 className="text-sm font-semibold text-ink leading-snug">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-teal transition-colors inline-flex items-center gap-1.5 group"
        >
          <span>{item.title}</span>
          <ExternalLink className="w-3.5 h-3.5 text-muted group-hover:text-teal shrink-0 opacity-70 group-hover:opacity-100" />
        </a>
      </h2>

      {/* Summary (Max 60 words original text) */}
      <p className="text-xs text-muted leading-relaxed">
        {item.summary}
      </p>

      {/* Action link */}
      <div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-teal hover:underline inline-flex items-center gap-1"
        >
          <span>Read official article</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}
