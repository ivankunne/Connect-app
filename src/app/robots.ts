import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

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
