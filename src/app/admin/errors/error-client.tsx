"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import type { ErrorLogItem } from "@/lib/errors/logger";

interface AdminErrorClientProps {
  initialLogs: ErrorLogItem[];
}

export function AdminErrorClient({ initialLogs }: AdminErrorClientProps) {
  const [logs] = React.useState<ErrorLogItem[]>(initialLogs);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">
            Server Error Logs
          </h1>
          <p className="text-xs text-[var(--ink-2)] mt-0.5">
            Real-time server exceptions, failed API calls, and pipeline runtime errors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--ink-2)] font-mono">
            {logs.length} logged
          </span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--ink-2)]">
          <CheckCircle2 size={24} className="mx-auto mb-2 text-[var(--teal)]" />
          <p>No server errors logged.</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--line)] rounded-[6px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden font-mono text-xs">
          {logs.map((log) => (
            <div key={log.id} className="p-4 space-y-2 hover:bg-[var(--surface-2)]/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-[4px] bg-[var(--red-light)] text-[var(--red)] font-semibold uppercase text-[10px]">
                    {log.source}
                  </span>
                  <span className="font-semibold text-[var(--ink)] text-sm font-sans">
                    {log.message}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--muted)] shrink-0">
                  {new Date(log.created_at).toLocaleString("en-GB")}
                </span>
              </div>

              {log.stack && (
                <pre className="p-2.5 rounded-[4px] bg-[var(--surface-2)] text-[11px] text-[var(--ink-2)] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {log.stack}
                </pre>
              )}

              {log.metadata && (
                <div className="text-[11px] text-[var(--ink-2)]">
                  <span className="text-[var(--muted)]">metadata: </span>
                  {JSON.stringify(log.metadata)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
