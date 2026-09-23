import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getClientEnv, getServerEnv } from "./env";

describe("env validation", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("validates client env defaults", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const client = getClientEnv();
    expect(client.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("parses admin emails into lowercased array", () => {
    process.env.ADMIN_EMAILS = "TechRis101@gmail.com, Admin@Student360.rw ";
    const server = getServerEnv();
    expect(server.ADMIN_EMAILS).toEqual(["techris101@gmail.com", "admin@student360.rw"]);
  });

  it("parses daily message cap as a number", () => {
    process.env.AI_DAILY_MESSAGE_CAP = "50";
    const server = getServerEnv();
    expect(server.AI_DAILY_MESSAGE_CAP).toBe(50);
  });
});
