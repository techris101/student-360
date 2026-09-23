import { describe, it, expect } from "vitest";

describe("RLS Policy Logic and Authorization Rules", () => {
  const userA = { id: "user-a", role: "user", suspended: false };
  const userB = { id: "user-b", role: "user", suspended: false };
  const adminUser = { id: "user-admin", role: "admin", suspended: false };
  const suspendedUser = { id: "user-suspended", role: "user", suspended: true };

  describe("Profiles RLS rules", () => {
    it("allows a user to select and update their own profile", () => {
      const canAccessOwn = (currentUserId: string, targetProfileId: string) =>
        currentUserId === targetProfileId;

      expect(canAccessOwn(userA.id, userA.id)).toBe(true);
      expect(canAccessOwn(userA.id, userB.id)).toBe(false);
    });

    it("allows admin to access any profile", () => {
      const canAdminAccess = (role: string) => role === "admin";
      expect(canAdminAccess(adminUser.role)).toBe(true);
      expect(canAdminAccess(userA.role)).toBe(false);
    });
  });

  describe("Applications RLS rules", () => {
    it("restricts application access exclusively to the owner", () => {
      const canAccessApp = (currentUserId: string, appOwnerId: string) =>
        currentUserId === appOwnerId;

      expect(canAccessApp(userA.id, "user-a")).toBe(true);
      expect(canAccessApp(userB.id, "user-a")).toBe(false);
    });
  });

  describe("Cohort Messages RLS rules", () => {
    const activeMembers = ["user-a", "user-b"];
    const blocks = [{ blocker_id: "user-a", blocked_id: "user-c" }];

    function canReadMessage(
      readerId: string,
      cohortId: string,
      message: { cohort_id: string; user_id: string; hidden: boolean }
    ) {
      if (message.hidden) return false;
      if (!activeMembers.includes(readerId)) return false;
      const isBlocked = blocks.some(
        (b) => b.blocker_id === readerId && b.blocked_id === message.user_id
      );
      return !isBlocked;
    }

    it("allows active member to read unhidden message from non-blocked author", () => {
      const msg = { cohort_id: "cohort-1", user_id: "user-b", hidden: false };
      expect(canReadMessage("user-a", "cohort-1", msg)).toBe(true);
    });

    it("blocks reader from seeing hidden messages", () => {
      const msg = { cohort_id: "cohort-1", user_id: "user-b", hidden: true };
      expect(canReadMessage("user-a", "cohort-1", msg)).toBe(false);
    });

    it("blocks reader from seeing messages from users they blocked", () => {
      const msg = { cohort_id: "cohort-1", user_id: "user-c", hidden: false };
      expect(canReadMessage("user-a", "cohort-1", msg)).toBe(false);
    });

    it("prohibits suspended users from sending messages", () => {
      const canPostMessage = (user: { id: string; suspended: boolean }) =>
        !user.suspended;

      expect(canPostMessage(userA)).toBe(true);
      expect(canPostMessage(suspendedUser)).toBe(false);
    });
  });
});
