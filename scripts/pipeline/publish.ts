import { createServiceClient } from "@/lib/supabase/service";
import type { ExtractedOpportunity, ExtractedNews } from "@/lib/validation/schemas";
import { generateContentHash } from "@/lib/dedupe/dedupe";
import { isAggregatorOrSocialDomain } from "@/lib/pipeline/resolve_official";

export interface PublishOpportunityParams {
  item: ExtractedOpportunity;
  sourceId: string;
  officialUrl: string | null;
  needsReview: boolean;
  reviewReason?: string;
}

export interface PublishResult {
  id: string;
  status: "published" | "pending_review";
  action: "inserted" | "updated";
}

/**
 * Publishes or queues an opportunity based on confidence and official domain rule
 */
export async function publishOpportunity({
  item,
  sourceId,
  officialUrl,
  needsReview,
  reviewReason,
}: PublishOpportunityParams): Promise<PublishResult> {
  const isOfficial =
    Boolean(officialUrl) && !isAggregatorOrSocialDomain(officialUrl!);
  const highConfidence = (item.confidence ?? 1.0) >= 0.8;

  // Publish rule: confidence >= 0.8 and official domain -> published
  const status: "published" | "pending_review" =
    !needsReview && isOfficial && highConfidence
      ? "published"
      : "pending_review";

  const contentHash = generateContentHash(item.organisation, item.title);
  const now = new Date().toISOString();

  const record = {
    type: item.type,
    title: item.title,
    organisation: item.organisation,
    summary: item.summary,
    key_facts: item.key_facts as any,
    official_url: officialUrl || `https://pending-review.student360.rw/review/${contentHash.slice(0, 16)}`,
    source_id: sourceId,
    deadline: item.deadline || null,
    deadline_rolling: item.deadline_rolling || false,
    opens_at: item.opens_at || null,
    starts_at: item.starts_at || null,
    location_scope: item.location_scope,
    location_text: item.location_text || null,
    funding: item.funding,
    levels: item.levels,
    fields: item.fields,
    eligibility: item.eligibility as any,
    plan_ahead: item.plan_ahead || false,
    prepare_now: item.prepare_now as any,
    status,
    confidence: item.confidence,
    content_hash: contentHash,
    first_seen_at: now,
    last_checked_at: now,
    published_at: status === "published" ? now : null,
  };

  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from("opportunities")
      .upsert(record as any, {
        onConflict: "official_url",
      })
      .select("id")
      .single();

    if (error) {
      console.warn(`[Publish] Supabase upsert error (using fallback if unconfigured):`, error.message);
      return {
        id: contentHash.slice(0, 32),
        status,
        action: "inserted",
      };
    }

    return {
      id: data?.id || contentHash.slice(0, 32),
      status,
      action: "inserted",
    };
  } catch {
    return {
      id: contentHash.slice(0, 32),
      status,
      action: "inserted",
    };
  }
}

/**
 * Publishes or queues a news item
 */
export async function publishNewsItem(
  news: ExtractedNews,
  url: string,
  sourceId: string
): Promise<{ id: string; status: "published" | "pending_review" }> {
  const status: "published" | "pending_review" =
    news.relevance >= 0.6 ? "published" : "pending_review";

  const record = {
    title: news.title,
    summary: news.summary,
    url,
    source_id: sourceId,
    published_at: news.published_at || new Date().toISOString(),
    category: news.category || "universities",
    relevance: news.relevance,
    status,
  };

  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from("news_items")
      .upsert(record as any, { onConflict: "url" })
      .select("id")
      .single();

    if (error) {
      console.warn(`[Publish News] Supabase upsert error:`, error.message);
      return { id: url, status };
    }

    return { id: data?.id || url, status };
  } catch {
    return { id: url, status };
  }
}
