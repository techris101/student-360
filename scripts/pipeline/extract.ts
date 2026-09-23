import { generateObject } from "ai";
import { modelFast } from "@/lib/ai/client";
import {
  ExtractedOpportunitySchema,
  ExtractedNewsSchema,
  type ExtractedOpportunity,
  type ExtractedNews,
} from "@/lib/validation/schemas";
import {
  OPPORTUNITY_EXTRACTION_PROMPT,
  NEWS_EXTRACTION_PROMPT,
} from "@/lib/ai/prompts";

export const MAX_LLM_CALLS_DEFAULT = 200;
let currentLlmCallCount = 0;

export function getLlmCallCount(): number {
  return currentLlmCallCount;
}

export function resetLlmCallCount(): void {
  currentLlmCallCount = 0;
}

export interface ExtractionStats {
  tokensIn?: number;
  tokensOut?: number;
}

/**
 * Extracts structured opportunity data from web page text using AI_MODEL_FAST
 * Validated by Zod, retries once on parse error, honors MAX_LLM_CALLS cap.
 */
export async function extractOpportunity(
  url: string,
  pageText: string,
  maxCalls: number = MAX_LLM_CALLS_DEFAULT
): Promise<{ opportunity: ExtractedOpportunity | null; stats: ExtractionStats }> {
  if (currentLlmCallCount >= maxCalls) {
    console.warn(`[Extract] Reached hard cap of ${maxCalls} LLM calls. Skipping ${url}`);
    return { opportunity: null, stats: {} };
  }

  const prompt = OPPORTUNITY_EXTRACTION_PROMPT
    .replace("{{url}}", url)
    .replace("{{page_text}}", pageText);

  // Attempt 1
  try {
    currentLlmCallCount++;
    const result = await generateObject({
      model: modelFast,
      schema: ExtractedOpportunitySchema,
      prompt,
      maxOutputTokens: 1200,
    });

    return {
      opportunity: result.object,
      stats: {
        tokensIn: result.usage?.inputTokens,
        tokensOut: result.usage?.outputTokens,
      },
    };
  } catch (err1: any) {
    console.warn(`[Extract] Attempt 1 failed for ${url}: ${err1?.message || err1}. Retrying once...`);

    // Retry 1
    if (currentLlmCallCount >= maxCalls) {
      return { opportunity: null, stats: {} };
    }

    try {
      currentLlmCallCount++;
      const result = await generateObject({
        model: modelFast,
        schema: ExtractedOpportunitySchema,
        prompt: `${prompt}\n\nPlease respond strictly with valid JSON conforming to the requested schema.`,
        maxOutputTokens: 1200,
      });

      return {
        opportunity: result.object,
        stats: {
          tokensIn: result.usage?.inputTokens,
          tokensOut: result.usage?.outputTokens,
        },
      };
    } catch (err2: any) {
      console.error(`[Extract] Extraction failed after retry for ${url}:`, err2?.message || err2);
      return { opportunity: null, stats: {} };
    }
  }
}

/**
 * Extracts structured news item data from web page text using AI_MODEL_FAST
 */
export async function extractNewsItem(
  url: string,
  pageText: string,
  maxCalls: number = MAX_LLM_CALLS_DEFAULT
): Promise<{ news: ExtractedNews | null; stats: ExtractionStats }> {
  if (currentLlmCallCount >= maxCalls) {
    console.warn(`[Extract] Reached hard cap of ${maxCalls} LLM calls. Skipping news ${url}`);
    return { news: null, stats: {} };
  }

  const prompt = NEWS_EXTRACTION_PROMPT
    .replace("{{url}}", url)
    .replace("{{page_text}}", pageText);

  // Attempt 1
  try {
    currentLlmCallCount++;
    const result = await generateObject({
      model: modelFast,
      schema: ExtractedNewsSchema,
      prompt,
      maxOutputTokens: 500,
    });

    return {
      news: result.object,
      stats: {
        tokensIn: result.usage?.inputTokens,
        tokensOut: result.usage?.outputTokens,
      },
    };
  } catch (err1: any) {
    console.warn(`[Extract] Attempt 1 failed for news ${url}: ${err1?.message || err1}. Retrying once...`);

    if (currentLlmCallCount >= maxCalls) {
      return { news: null, stats: {} };
    }

    try {
      currentLlmCallCount++;
      const result = await generateObject({
        model: modelFast,
        schema: ExtractedNewsSchema,
        prompt: `${prompt}\n\nPlease respond strictly with valid JSON.`,
        maxOutputTokens: 500,
      });

      return {
        news: result.object,
        stats: {
          tokensIn: result.usage?.inputTokens,
          tokensOut: result.usage?.outputTokens,
        },
      };
    } catch (err2: any) {
      console.error(`[Extract] News extraction failed after retry for ${url}:`, err2?.message || err2);
      return { news: null, stats: {} };
    }
  }
}
