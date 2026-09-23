import { createServiceClient } from "@/lib/supabase/service";

export interface ErrorLogItem {
  id: string;
  source: string;
  message: string;
  stack?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

interface DbErrorLogRow {
  id: string;
  source: string;
  message: string;
  stack: string | null;
  metadata: unknown;
  created_at: string;
}

interface SupabaseErrorQuery {
  from(table: string): {
    insert(row: unknown): Promise<{ error: { message: string } | null }>;
    select(cols: string): {
      order(
        col: string,
        opts: { ascending: boolean }
      ): {
        limit(count: number): Promise<{ data: DbErrorLogRow[] | null }>;
      };
    };
  };
}

const memoryErrorLogs: ErrorLogItem[] = [];

export async function logServerError(
  source: string,
  error: unknown,
  metadata?: Record<string, unknown>
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const now = new Date().toISOString();

  const item: ErrorLogItem = {
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source,
    message,
    stack: stack || null,
    metadata: metadata || null,
    created_at: now,
  };

  // Keep in memory
  memoryErrorLogs.unshift(item);
  if (memoryErrorLogs.length > 100) {
    memoryErrorLogs.pop();
  }

  // Attempt to write to Supabase if configured
  try {
    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (isConfigured) {
      const supabase = createServiceClient() as unknown as SupabaseErrorQuery;
      await supabase.from("error_logs").insert({
        source,
        message,
        stack: stack || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: now,
      });
    }
  } catch (err) {
    console.warn("Could not log to remote error_logs table:", err);
  }
}

export async function getErrorLogs(): Promise<ErrorLogItem[]> {
  try {
    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (isConfigured) {
      const supabase = createServiceClient() as unknown as SupabaseErrorQuery;
      const { data } = await supabase
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          source: d.source,
          message: d.message,
          stack: d.stack,
          metadata:
            typeof d.metadata === "string"
              ? (JSON.parse(d.metadata) as Record<string, unknown>)
              : (d.metadata as Record<string, unknown> | null),
          created_at: d.created_at,
        }));
      }
    }
  } catch {
    // Fall back to memory
  }

  // If memory empty, provide a clean empty state or baseline log
  if (memoryErrorLogs.length === 0) {
    return [
      {
        id: "err-init",
        source: "system",
        message: "Error monitoring active. No critical runtime errors logged.",
        stack: null,
        metadata: { env: process.env.NODE_ENV || "development" },
        created_at: new Date().toISOString(),
      },
    ];
  }

  return memoryErrorLogs;
}
