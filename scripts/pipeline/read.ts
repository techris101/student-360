import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";

export const USER_AGENT = "Student360Bot/1.0 (+https://student360.rw/bot)";
export const REQUEST_TIMEOUT_MS = 15000;
export const MIN_TEXT_LENGTH = 300;
export const MAX_TEXT_LENGTH = 12000;

export interface ReadResult {
  title?: string;
  textContent: string;
  length: number;
}

/**
 * Fetches and parses a web page into clean, readable text
 * Uses linkedom and Mozilla Readability
 */
export async function readPage(url: string): Promise<ReadResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Read] Failed HTTP ${response.status} for ${url}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml") &&
      !contentType.includes("text/plain")
    ) {
      console.warn(`[Read] Skipping non-HTML content type: ${contentType} for ${url}`);
      return null;
    }

    const html = await response.text();
    if (!html || html.trim().length === 0) {
      return null;
    }

    // Parse HTML with linkedom
    const { document } = parseHTML(html);

    // Remove script, style, nav, footer tags
    const toRemove = document.querySelectorAll(
      "script, style, noscript, nav, footer, header, svg, iframe, form"
    );
    for (const el of toRemove) {
      el.remove();
    }

    // Use Readability to extract main content
    const reader = new Readability(document as any);
    const parsed = reader.parse();

    let text = "";
    let pageTitle = "";

    if (parsed && parsed.textContent) {
      text = parsed.textContent;
      pageTitle = parsed.title || "";
    } else {
      // Fallback: document body text
      text = document.body?.textContent || "";
      pageTitle = document.title || "";
    }

    // Clean up excessive whitespace
    const cleanText = text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n\n")
      .trim();

    // Discard pages under 300 characters
    if (cleanText.length < MIN_TEXT_LENGTH) {
      return null;
    }

    // Truncate to 12,000 characters per AI_ADVISOR.md
    const truncatedText = cleanText.slice(0, MAX_TEXT_LENGTH);

    return {
      title: pageTitle.trim(),
      textContent: truncatedText,
      length: truncatedText.length,
    };
  } catch (error: any) {
    console.error(`[Read] Error reading ${url}:`, error?.message || error);
    return null;
  }
}
