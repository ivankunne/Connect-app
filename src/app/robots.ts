import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The app itself is private, authenticated space — keep it out of the index.
      disallow: ["/app", "/onboarding", "/auth"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
