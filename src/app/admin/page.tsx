import React from "react";
import { createServiceClient } from "@/lib/supabase/service";
import { ReviewQueueClient, type PendingItem } from "@/components/admin/review-queue-client";

export default async function AdminReviewPage() {
  const supabase = createServiceClient();

  let pendingItems: PendingItem[] = [];

  try {
    const { data } = await supabase
      .from("opportunities")
      .select("id, type, title, organisation, summary, official_url, confidence, deadline, created_at")
      .eq("status", "pending_review")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      pendingItems = data.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        organisation: item.organisation,
        summary: item.summary,
        official_url: item.official_url,
        confidence: item.confidence,
        deadline: item.deadline,
        created_at: item.created_at,
      }));
    }
  } catch {
    // If Supabase not connected yet, show fallback sample items
  }

  // Provide initial mock items if table is empty to allow visual testing
  if (pendingItems.length === 0) {
    pendingItems = [
      {
        id: "mock-pending-1",
        type: "scholarship",
        title: "Commonwealth Master's Scholarships (Pending Official Verification)",
        organisation: "Commonwealth Scholarship Commission",
        summary: "Full funding for low and middle income Commonwealth countries for full-time master study at UK universities.",
        official_url: "https://cscuk.fcdo.gov.uk/apply/masters-scholarships/",
        confidence: 0.75,
        deadline: "2026-10-15",
        created_at: "2026-09-23T08:00:00.000Z",
      },
      {
        id: "mock-pending-2",
        type: "fellowship",
        title: "Kigali Global Shapers Innovation Fellowship",
        organisation: "Global Shapers Kigali Hub",
        summary: "Young Rwandan innovators fellowship supporting community-led solutions and tech development.",
        official_url: "https://pending-review.student360.rw/review/kigali-hub-shapers",
        confidence: 0.68,
        deadline: "2026-11-30",
        created_at: "2026-09-23T07:00:00.000Z",
      },
    ];
  }

  return <ReviewQueueClient initialItems={pendingItems} />;
}
