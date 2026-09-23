import { createHash } from "node:crypto";
import { SEED_SOURCES, type SeedSource } from "@/lib/data/sources";
import { createServiceClient } from "@/lib/supabase/service";
import { discoverUrls } from "./discover";
import { readPage } from "./read";
import {
  extractOpportunity,
  extractNewsItem,
  getLlmCallCount,
  resetLlmCallCount,
} from "./extract";
import { filterOpportunity, filterNewsItem } from "@/lib/pipeline/filter";
import { resolveOfficialUrl } from "@/lib/pipeline/resolve_official";
import { findDuplicate, mergeOpportunityData, generateContentHash } from "@/lib/dedupe/dedupe";
import { publishOpportunity, publishNewsItem } from "./publish";
import { runExpirationRoutine } from "./expire";

export interface PipelineStats {
  sourcesCrawled: number;
  urlsDiscovered: number;
  urlsRead: number;
  extractedOpportunities: number;
  publishedOpportunities: number;
  pendingOpportunities: number;
  extractedNews: number;
  publishedNews: number;
  filteredOut: number;
  llmCalls: number;
  totalTokensIn: number;
  totalTokensOut: number;
}

export async function runIngestionPipeline(): Promise<PipelineStats> {
  const startedAt = new Date().toISOString();
  console.log(`\n========================================`);
  console.log(`[Pipeline] Ingestion Pipeline Started: ${startedAt}`);
  console.log(`========================================\n`);

  resetLlmCallCount();

  const stats: PipelineStats = {
    sourcesCrawled: 0,
    urlsDiscovered: 0,
    urlsRead: 0,
    extractedOpportunities: 0,
    publishedOpportunities: 0,
    pendingOpportunities: 0,
    extractedNews: 0,
    publishedNews: 0,
    filteredOut: 0,
    llmCalls: 0,
    totalTokensIn: 0,
    totalTokensOut: 0,
  };

  const errors: string[] = [];
  const supabase = createServiceClient();

  // 1. Load seen URLs
  const seenUrlsSet = new Set<string>();
  try {
    const { data: seenData } = await supabase.from("seen_urls").select("url");
    if (seenData) {
      for (const row of seenData) {
        seenUrlsSet.add(row.url);
      }
    }
  } catch (err: any) {
    console.warn(`[Pipeline] Warning fetching seen_urls:`, err?.message);
  }

  // 2. Load existing opportunities for deduplication
  const existingOpportunities: Array<{
    id: string;
    official_url: string;
    organisation: string;
    title: string;
    content_hash: string;
  }> = [];

  try {
    const { data: oppsData } = await supabase
      .from("opportunities")
      .select("id, official_url, organisation, title, content_hash");
    if (oppsData) {
      existingOpportunities.push(...(oppsData as any));
    }
  } catch (err: any) {
    console.warn(`[Pipeline] Warning loading existing opportunities for dedupe:`, err?.message);
  }

  // Helper to mark seen URL
  async function markSeenUrl(url: string, outcome: string) {
    seenUrlsSet.add(url);
    const urlHash = createHash("sha256").update(url).digest("hex");
    try {
      await supabase.from("seen_urls").upsert({
        url_hash: urlHash,
        url,
        outcome,
        first_seen_at: new Date().toISOString(),
      });
    } catch {
      // ignore offline errors
    }
  }

  // 3. Process Sources
  const sources: SeedSource[] = SEED_SOURCES.filter((s) => s.active);

  for (const source of sources) {
    console.log(`\n[Pipeline] Crawling Source: ${source.name} (${source.kind.toUpperCase()})`);
    stats.sourcesCrawled++;

    try {
      const candidates = await discoverUrls(source, seenUrlsSet);
      stats.urlsDiscovered += candidates.length;
      console.log(`[Pipeline] Found ${candidates.length} candidate URLs from ${source.name}`);

      for (const candidate of candidates) {
        const readResult = await readPage(candidate.url);
        if (!readResult) {
          await markSeenUrl(candidate.url, "discarded_too_short_or_unreachable");
          continue;
        }

        stats.urlsRead++;

        if (source.category === "opportunity") {
          const { opportunity, stats: llmStats } = await extractOpportunity(
            candidate.url,
            readResult.textContent
          );

          if (llmStats.tokensIn) stats.totalTokensIn += llmStats.tokensIn;
          if (llmStats.tokensOut) stats.totalTokensOut += llmStats.tokensOut;

          if (!opportunity) {
            await markSeenUrl(candidate.url, "extraction_failed");
            continue;
          }

          stats.extractedOpportunities++;

          // Filter
          const filterResult = filterOpportunity(opportunity);
          if (!filterResult.passed) {
            stats.filteredOut++;
            await markSeenUrl(candidate.url, `filtered_${filterResult.reason}`);
            console.log(`[Pipeline] Filtered out ${opportunity.title}: ${filterResult.detail}`);
            continue;
          }

          // Resolve Official Link
          const resolved = resolveOfficialUrl(
            candidate.url,
            opportunity.official_url,
            source.is_aggregator
          );

          // Dedupe
          const candidateHash = generateContentHash(
            opportunity.organisation,
            opportunity.title
          );

          const dedupe = findDuplicate(
            {
              official_url: resolved.officialUrl,
              organisation: opportunity.organisation,
              title: opportunity.title,
              content_hash: candidateHash,
            },
            existingOpportunities
          );

          if (dedupe.isDuplicate) {
            console.log(`[Pipeline] Duplicate detected (${dedupe.matchReason}) for: ${opportunity.title}`);
            await markSeenUrl(candidate.url, `merged_duplicate_${dedupe.matchedId}`);
            continue;
          }

          // Publish or Queue
          const pubResult = await publishOpportunity({
            item: opportunity,
            sourceId: source.id,
            officialUrl: resolved.officialUrl,
            needsReview: resolved.needsReview,
            reviewReason: resolved.reviewReason,
          });

          if (pubResult.status === "published") {
            stats.publishedOpportunities++;
            console.log(`[Pipeline] Published Opportunity: "${opportunity.title}" (${opportunity.organisation})`);
          } else {
            stats.pendingOpportunities++;
            console.log(`[Pipeline] Queued for Review: "${opportunity.title}" (${resolved.reviewReason || "low confidence"})`);
          }

          existingOpportunities.push({
            id: pubResult.id,
            official_url: resolved.officialUrl || "",
            organisation: opportunity.organisation,
            title: opportunity.title,
            content_hash: candidateHash,
          });

          await markSeenUrl(candidate.url, `saved_${pubResult.status}`);
        } else if (source.category === "news") {
          // News Item
          const { news, stats: llmStats } = await extractNewsItem(
            candidate.url,
            readResult.textContent
          );

          if (llmStats.tokensIn) stats.totalTokensIn += llmStats.tokensIn;
          if (llmStats.tokensOut) stats.totalTokensOut += llmStats.tokensOut;

          if (!news) {
            await markSeenUrl(candidate.url, "extraction_failed");
            continue;
          }

          stats.extractedNews++;

          const filterResult = filterNewsItem(news);
          if (!filterResult.passed) {
            stats.filteredOut++;
            await markSeenUrl(candidate.url, `filtered_${filterResult.reason}`);
            continue;
          }

          const pubResult = await publishNewsItem(news, candidate.url, source.id);
          stats.publishedNews++;
          console.log(`[Pipeline] Published News: "${news.title}"`);
          await markSeenUrl(candidate.url, `saved_${pubResult.status}`);
        }
      }
    } catch (err: any) {
      console.error(`[Pipeline] Error crawling source ${source.name}:`, err?.message || err);
      errors.push(`${source.name}: ${err?.message || err}`);
    }
  }

  // 4. Run Expiration Routine
  const expireResult = await runExpirationRoutine();

  // 5. Finalize Stats & Log Run
  stats.llmCalls = getLlmCallCount();
  const finishedAt = new Date().toISOString();

  try {
    await supabase.from("pipeline_runs").insert({
      kind: "full_pipeline",
      started_at: startedAt,
      finished_at: finishedAt,
      stats: {
        ...stats,
        expiredCount: expireResult.expiredCount,
        recheckedCount: expireResult.recheckedCount,
      } as any,
      errors: errors as any,
    });
  } catch (err: any) {
    console.warn(`[Pipeline] Notice recording pipeline_runs:`, err?.message);
  }

  console.log(`\n========================================`);
  console.log(`[Pipeline] Ingestion Run Finished at ${finishedAt}`);
  console.log(`Stats Summary:`, stats);
  console.log(`========================================\n`);

  return stats;
}

// Direct execution entrypoint
if (require.main === module || process.argv[1]?.includes("run.ts")) {
  runIngestionPipeline()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Pipeline] Fatal error during pipeline run:", err);
      process.exit(1);
    });
}
