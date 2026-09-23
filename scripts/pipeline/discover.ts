import Parser from "rss-parser";
import * as cheerio from "cheerio";
import robotsParser from "robots-parser";
import type { SeedSource } from "@/lib/data/sources";
import { USER_AGENT, REQUEST_TIMEOUT_MS } from "./read";

const rssParser = new Parser({
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "User-Agent": USER_AGENT,
  },
});

export interface DiscoveredUrl {
  url: string;
  sourceId: string;
  title?: string;
  publishedAt?: string;
}

// In-memory cache for robots.txt instances per origin
const robotsCache = new Map<string, any>();
// Per-domain crawl rate limiting: timestamp of last fetch
const domainLastRequest = new Map<string, number>();

/**
 * Ensures polite rate limiting: 1 request per second per domain
 */
export async function waitPoliteDelay(hostname: string): Promise<void> {
  const lastTime = domainLastRequest.get(hostname) || 0;
  const now = Date.now();
  const elapsed = now - lastTime;

  if (elapsed < 1000) {
    const delay = 1000 - elapsed;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  domainLastRequest.set(hostname, Date.now());
}

/**
 * Checks whether robots.txt allows crawling the given URL
 */
export async function isAllowedByRobots(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const origin = parsed.origin;

    let robot = robotsCache.get(origin);
    if (!robot) {
      await waitPoliteDelay(parsed.hostname);
      const robotsUrl = `${origin}/robots.txt`;

      try {
        const res = await fetch(robotsUrl, {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(5000),
        });

        if (res.ok) {
          const text = await res.text();
          robot = robotsParser(robotsUrl, text);
        } else {
          // If 404 or not found, crawling is permitted
          robot = robotsParser(robotsUrl, "");
        }
      } catch {
        robot = robotsParser(robotsUrl, "");
      }
      robotsCache.set(origin, robot);
    }

    const allowed = robot.isAllowed(url, USER_AGENT);
    return allowed !== false;
  } catch {
    return true;
  }
}

/**
 * Discovers candidate URLs from a source (RSS feed or HTML listing)
 */
export async function discoverUrls(
  source: SeedSource,
  seenUrlsSet: Set<string>
): Promise<DiscoveredUrl[]> {
  const results: DiscoveredUrl[] = [];

  try {
    if (source.kind === "rss" && source.crawl_hint.feed_url) {
      const feedUrl = source.crawl_hint.feed_url;
      const parsedFeed = new URL(feedUrl);

      const allowed = await isAllowedByRobots(feedUrl);
      if (!allowed) {
        console.warn(`[Discover] Robots.txt disallows crawling feed: ${feedUrl}`);
        return [];
      }

      await waitPoliteDelay(parsedFeed.hostname);
      const feed = await rssParser.parseURL(feedUrl);

      for (const item of feed.items) {
        if (!item.link) continue;
        const candidateUrl = item.link.trim();

        // Check if URL matches pattern if specified
        if (source.crawl_hint.url_pattern) {
          const regex = new RegExp(source.crawl_hint.url_pattern, "i");
          if (!regex.test(candidateUrl) && !regex.test(item.title || "")) {
            continue;
          }
        }

        // Dedupe against seen URLs
        if (!seenUrlsSet.has(candidateUrl)) {
          results.push({
            url: candidateUrl,
            sourceId: source.id,
            title: item.title,
            publishedAt: item.isoDate || item.pubDate,
          });
        }
      }
    } else {
      // HTML listing crawl
      const listingUrl = source.crawl_hint.listing_url || source.url;
      const parsedListing = new URL(listingUrl);

      const allowed = await isAllowedByRobots(listingUrl);
      if (!allowed) {
        console.warn(`[Discover] Robots.txt disallows listing: ${listingUrl}`);
        return [];
      }

      await waitPoliteDelay(parsedListing.hostname);
      const res = await fetch(listingUrl, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) {
        console.warn(`[Discover] Failed to fetch listing ${listingUrl}: HTTP ${res.status}`);
        return [];
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      const selector = source.crawl_hint.item_selector || "a";
      const attr = source.crawl_hint.link_attr || "href";
      const patternRegex = source.crawl_hint.url_pattern
        ? new RegExp(source.crawl_hint.url_pattern, "i")
        : null;

      const discoveredLinks = new Set<string>();

      $(selector).each((_, element) => {
        const href = $(element).attr(attr);
        if (!href) return;

        try {
          const absoluteUrl = new URL(href, listingUrl).toString();

          // Basic validation
          if (
            !absoluteUrl.startsWith("http://") &&
            !absoluteUrl.startsWith("https://")
          ) {
            return;
          }

          // Exclude anchor jumps and same-page links
          if (absoluteUrl.split("#")[0] === listingUrl.split("#")[0]) {
            return;
          }

          const linkText = $(element).text().trim();

          // If pattern given, verify URL or anchor text
          if (patternRegex) {
            if (!patternRegex.test(absoluteUrl) && !patternRegex.test(linkText)) {
              return;
            }
          }

          if (!seenUrlsSet.has(absoluteUrl) && !discoveredLinks.has(absoluteUrl)) {
            discoveredLinks.add(absoluteUrl);
            results.push({
              url: absoluteUrl,
              sourceId: source.id,
              title: linkText || undefined,
            });
          }
        } catch {
          // ignore malformed URLs
        }
      });
    }
  } catch (error: any) {
    console.error(`[Discover] Error discovering from ${source.name}:`, error?.message || error);
  }

  return results;
}
