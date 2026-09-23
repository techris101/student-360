/**
 * In-memory sliding window rate limiter for cohort chat messages.
 * Rule: 10 messages per minute per user (PRODUCT F3).
 */

const userMessageTimestamps = new Map<string, number[]>();

export interface CohortRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

export function checkCohortRateLimit(
  userId: string,
  maxPerMinute: number = 10,
  nowMs: number = Date.now()
): CohortRateLimitResult {
  const windowMs = 60 * 1000;
  const cutoff = nowMs - windowMs;

  const timestamps = (userMessageTimestamps.get(userId) || []).filter(
    (t) => t > cutoff
  );
  userMessageTimestamps.set(userId, timestamps);

  if (timestamps.length >= maxPerMinute) {
    const oldest = timestamps[0];
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  return {
    allowed: true,
    remaining: maxPerMinute - timestamps.length,
    resetInSeconds: 0,
  };
}

export function recordCohortMessageSent(
  userId: string,
  nowMs: number = Date.now()
): void {
  const timestamps = userMessageTimestamps.get(userId) || [];
  timestamps.push(nowMs);
  userMessageTimestamps.set(userId, timestamps);
}

export function _resetCohortRateLimitForTesting(): void {
  userMessageTimestamps.clear();
}
