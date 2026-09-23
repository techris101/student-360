import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://student-360.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/opportunities",
          "/opportunities/*",
          "/news",
          "/about",
          "/privacy",
          "/terms",
          "/community-rules",
          "/contact",
          "/sign-in",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/settings",
          "/profile",
          "/progress",
          "/cohorts/*",
          "/advisor",
          "/dev/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
