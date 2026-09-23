/**
 * Moderation helpers for Cohort chat (PRODUCT F3).
 * Rules:
 * - 3 reports on a message hide it pending admin review.
 * - Blocked user's messages disappear for the blocker.
 * - Suspended users cannot post.
 */

export const AUTO_HIDE_REPORT_THRESHOLD = 3;

export function shouldAutoHideMessage(reportCount: number): boolean {
  return reportCount >= AUTO_HIDE_REPORT_THRESHOLD;
}

export interface ModeratableMessage {
  id: string;
  user_id: string;
  body: string;
  hidden?: boolean;
}

/**
 * Filters out hidden messages and messages sent by blocked users.
 */
export function filterVisibleMessages<T extends ModeratableMessage>(
  messages: T[],
  blockedUserIds: Set<string>
): T[] {
  return messages.filter((msg) => {
    if (msg.hidden) return false;
    if (blockedUserIds.has(msg.user_id)) return false;
    return true;
  });
}
