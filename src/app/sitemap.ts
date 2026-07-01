import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/login`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl}/signup`, changeFrequency: "yearly", priority: 0.6 },
  ];
}
