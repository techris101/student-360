import type { MetadataRoute } from "next";
import { SEED_OPPORTUNITIES } from "@/lib/data/opportunities";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://student-360.vercel.app";
  const now = new Date();

  // Core static pages
  const staticRoutes = [
    "",
    "/opportunities",
    "/news",
    "/about",
    "/privacy",
    "/terms",
    "/community-rules",
    "/contact",
    "/sign-in",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: (route === "" || route === "/opportunities" || route === "/news"
      ? "daily"
      : "monthly") as "daily" | "monthly",
    priority: route === "" ? 1.0 : route === "/opportunities" ? 0.9 : 0.6,
  }));

  // Public opportunity detail pages
  const opportunityRoutes = SEED_OPPORTUNITIES.map((opp) => ({
    url: `${baseUrl}/opportunities/${opp.id}`,
    lastModified: new Date(opp.last_checked_at || now.toISOString()),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...opportunityRoutes];
}
