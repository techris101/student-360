"use client";

import React, { useState } from "react";
import { Check, X, ExternalLink, Calendar, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminUpdateNewsStatus } from "@/app/actions/news";
import { CATEGORY_LABELS, NewsCategory } from "@/lib/news/news";
import type { NewsItem } from "@/lib/data/news";

interface AdminNewsClientProps {
  initialItems: NewsItem[];
}

export function AdminNewsClient({ initialItems }: AdminNewsClientProps) {
  const [items, setItems] = useState<NewsItem[]>(initialItems);
  const [loadingMap, setLoadingMap] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleUpdate = async (newsId: string, status: "published" | "rejected") => {
    setLoadingMap((prev) => ({ ...prev, [newsId]: status }));
    try {
      const res = await adminUpdateNewsStatus(newsId, status);
      if (res.success) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === newsId ? { ...item, status } : item
          )
        );
        setFeedback(
          status === "published"
            ? "Article approved and published to the student feed."
            : "Article rejected."
        );
        setTimeout(() => setFeedback(null), 3000);
      }
    } finally {
      setLoadingMap((prev) => ({ ...prev, [newsId]: "" }));
    }
  };

  const filteredItems = items.filter((item) => {
    if (statusFilter === "all") return true;
    return item.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--ink-primary)]">
            News Curation & Review
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">
            Review scraped and submitted higher education news. Ensure original summaries
            are under 60 words and link to verified Rwandan official sources.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {["all", "pending_review", "published", "rejected"].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? "primary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className="text-xs h-7 capitalize"
            >
              {st.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-teal/10 border border-teal/20 text-teal text-xs rounded flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded border border-dashed border-[var(--border-subtle)] bg-[var(--surface-card)]">
          <Newspaper className="w-8 h-8 mx-auto text-[var(--ink-muted)] mb-2 stroke-[1.5]" />
          <p className="text-sm font-semibold text-[var(--ink-primary)]">
            No news items found
          </p>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            No articles match the selected status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isLoading = !!loadingMap[item.id];
            const categoryLabel =
              CATEGORY_LABELS[item.category as NewsCategory] || item.category;

            return (
              <div
                key={item.id}
                className="p-4 rounded border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="font-semibold text-xs text-[var(--ink-primary)]">
                        {item.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--ink-secondary)]">
                        {categoryLabel}
                      </span>
                      <span
                        className={
                          item.status === "published"
                            ? "px-1.5 py-0.5 rounded bg-teal/10 text-teal border border-teal/20 font-medium"
                            : item.status === "rejected"
                            ? "px-1.5 py-0.5 rounded bg-red/10 text-red border border-red/20 font-medium"
                            : "px-1.5 py-0.5 rounded bg-amber/10 text-amber border border-amber/20 font-medium"
                        }
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-[11px] text-[var(--ink-muted)] flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.published_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>Relevance: {(item.relevance * 100).toFixed(0)}%</span>
                      <span>•</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--teal-primary)] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Official Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status !== "published" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(item.id, "published")}
                        disabled={isLoading}
                        className="text-xs h-8 bg-teal hover:bg-teal-hover text-white"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                    )}
                    {item.status !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdate(item.id, "rejected")}
                        disabled={isLoading}
                        className="text-xs h-8 text-red hover:text-red border-red/30"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[var(--surface-sunken)] rounded border border-[var(--border-subtle)] text-xs text-[var(--ink-primary)] leading-relaxed">
                  {item.summary}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
