"use client";

import React, { useState } from "react";
import { approveOpportunity, rejectOpportunity, updateOpportunityAdmin } from "@/app/actions/admin";

export interface PendingItem {
  id: string;
  type: string;
  title: string;
  organisation: string;
  summary: string;
  official_url: string;
  confidence: number;
  deadline?: string | null;
  created_at: string;
}

export function ReviewQueueClient({ initialItems }: { initialItems: PendingItem[] }) {
  const [items, setItems] = useState<PendingItem[]>(initialItems);
  const [editingItem, setEditingItem] = useState<PendingItem | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    organisation: "",
    official_url: "",
    deadline: "",
    summary: "",
  });

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      await approveOpportunity(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this item?")) return;
    setLoadingId(id);
    try {
      await rejectOpportunity(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setLoadingId(null);
    }
  };

  const startEdit = (item: PendingItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      organisation: item.organisation,
      official_url: item.official_url,
      deadline: item.deadline || "",
      summary: item.summary,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setLoadingId(editingItem.id);
    try {
      await updateOpportunityAdmin(editingItem.id, editForm);
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id ? { ...i, ...editForm } : i
        )
      );
      setEditingItem(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save edits");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink-primary)]">
            Opportunity Review Queue
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            {items.length} opportunity items waiting for admin verification.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] p-8 text-center space-y-2">
          <p className="text-sm font-medium text-[var(--ink-primary)]">
            Queue is clear
          </p>
          <p className="text-xs text-[var(--ink-secondary)]">
            No opportunities are currently awaiting manual review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isLoading = loadingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 space-y-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 bg-[var(--surface-sunken)] text-[var(--ink-muted)]">
                        {item.type}
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 bg-[var(--amber-bg)] text-[var(--amber-text)] border border-[var(--amber-border)]">
                        Confidence: {(item.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <h2 className="text-base font-semibold text-[var(--ink-primary)]">
                      {item.title}
                    </h2>
                    <p className="text-xs text-[var(--ink-secondary)] font-medium">
                      {item.organisation}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleApprove(item.id)}
                      className="px-3 py-1.5 text-xs font-medium bg-[var(--teal-primary)] hover:bg-[var(--teal-hover)] text-white transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => startEdit(item)}
                      className="px-3 py-1.5 text-xs font-medium bg-[var(--surface-sunken)] hover:bg-[var(--border-subtle)] text-[var(--ink-primary)] border border-[var(--border-subtle)] transition-colors disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleReject(item.id)}
                      className="px-3 py-1.5 text-xs font-medium bg-[var(--red-bg)] text-[var(--red-text)] border border-[var(--red-border)] hover:opacity-80 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                  {item.summary}
                </p>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4 text-[11px] text-[var(--ink-muted)] font-mono">
                  <div className="flex items-center gap-4">
                    <span>
                      Deadline: {item.deadline ? item.deadline : "Rolling / Unspecified"}
                    </span>
                    <a
                      href={item.official_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--teal-primary)] hover:underline truncate max-w-sm"
                    >
                      {item.official_url}
                    </a>
                  </div>
                  <span>
                    Detected: {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal Dialog */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] w-full max-w-lg p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[var(--ink-primary)]">
                Edit Opportunity Details
              </h3>
              <p className="text-xs text-[var(--ink-secondary)]">
                Correct any missing or imperfectly extracted fields before publishing.
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--ink-secondary)] block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-[var(--surface-bg)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--teal-primary)] text-[var(--ink-primary)]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--ink-secondary)] block mb-1">
                  Organisation
                </label>
                <input
                  type="text"
                  required
                  value={editForm.organisation}
                  onChange={(e) =>
                    setEditForm({ ...editForm, organisation: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-[var(--surface-bg)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--teal-primary)] text-[var(--ink-primary)]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--ink-secondary)] block mb-1">
                  Official Organization URL
                </label>
                <input
                  type="url"
                  required
                  value={editForm.official_url}
                  onChange={(e) =>
                    setEditForm({ ...editForm, official_url: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-[var(--surface-bg)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--teal-primary)] text-[var(--ink-primary)] font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--ink-secondary)] block mb-1">
                  Deadline (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={editForm.deadline}
                  onChange={(e) =>
                    setEditForm({ ...editForm, deadline: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-[var(--surface-bg)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--teal-primary)] text-[var(--ink-primary)]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--ink-secondary)] block mb-1">
                  Summary (Plain English)
                </label>
                <textarea
                  rows={3}
                  required
                  value={editForm.summary}
                  onChange={(e) =>
                    setEditForm({ ...editForm, summary: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-[var(--surface-bg)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--teal-primary)] text-[var(--ink-primary)] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 text-xs text-[var(--ink-secondary)] hover:bg-[var(--surface-sunken)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingId === editingItem.id}
                  className="px-4 py-1.5 text-xs font-medium bg-[var(--teal-primary)] hover:bg-[var(--teal-hover)] text-white transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
