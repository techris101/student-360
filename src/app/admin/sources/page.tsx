import React from "react";
import { createServiceClient } from "@/lib/supabase/service";
import { SEED_SOURCES } from "@/lib/data/sources";
import { SourcesClient, type SourceViewItem } from "@/components/admin/sources-client";

export default async function AdminSourcesPage() {
  const supabase = createServiceClient();

  let sourcesList: SourceViewItem[] = [];

  try {
    const { data } = await supabase
      .from("sources")
      .select("id, name, url, kind, category, is_official, is_aggregator, active, fail_count, last_run_at, last_success_at")
      .order("name", { ascending: true });

    if (data && data.length > 0) {
      sourcesList = data.map((s) => ({
        id: s.id,
        name: s.name,
        url: s.url,
        kind: s.kind,
        category: s.category,
        is_official: s.is_official,
        is_aggregator: s.is_aggregator,
        active: s.active,
        fail_count: s.fail_count,
        last_run_at: s.last_run_at,
        last_success_at: s.last_success_at,
      }));
    }
  } catch {
    // If Supabase is unconfigured, fall back to SEED_SOURCES
  }

  if (sourcesList.length === 0) {
    sourcesList = SEED_SOURCES.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      kind: s.kind,
      category: s.category,
      is_official: s.is_official,
      is_aggregator: s.is_aggregator,
      active: s.active,
      fail_count: 0,
      last_run_at: null,
      last_success_at: null,
    }));
  }

  return <SourcesClient initialSources={sourcesList} />;
}
