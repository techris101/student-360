import React from "react";
import Link from "next/link";
import { checkAdminAccess } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, email } = await checkAdminAccess();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--surface-bg)] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-[var(--ink-primary)]">
              Admin Access Required
            </h1>
            <p className="text-sm text-[var(--ink-secondary)]">
              This area is restricted to system administrators. Your account ({email || "anonymous"}) does not have administrative privileges.
            </p>
          </div>
          <div>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-[var(--surface-sunken)] hover:bg-[var(--border-subtle)] text-[var(--ink-primary)] transition-colors"
            >
              Return to Student 360
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)] text-[var(--ink-primary)] flex flex-col">
      {/* Admin Top Navigation */}
      <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-[var(--ink-primary)]">
              Student 360
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--ink-muted)]">
              Admin
            </span>
          </div>

          <nav className="flex items-center gap-1 text-xs">
            <Link
              href="/admin"
              className="px-3 py-1.5 hover:bg-[var(--surface-sunken)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] font-medium transition-colors"
            >
              Review Queue
            </Link>
            <Link
              href="/admin/sources"
              className="px-3 py-1.5 hover:bg-[var(--surface-sunken)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] font-medium transition-colors"
            >
              Sources
            </Link>
            <Link
              href="/admin/runs"
              className="px-3 py-1.5 hover:bg-[var(--surface-sunken)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] font-medium transition-colors"
            >
              Pipeline Runs
            </Link>
            <Link
              href="/admin/moderation"
              className="px-3 py-1.5 hover:bg-[var(--surface-sunken)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] font-medium transition-colors"
            >
              Moderation
            </Link>
            <Link
              href="/admin/news"
              className="px-3 py-1.5 hover:bg-[var(--surface-sunken)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] font-medium transition-colors"
            >
              News
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-[var(--ink-muted)] font-mono">{email}</span>
          <Link
            href="/opportunities"
            className="text-[var(--teal-primary)] hover:underline"
          >
            Exit to App
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
