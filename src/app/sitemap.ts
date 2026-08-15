import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return [{ url: base, changeFrequency: "monthly", priority: 1 }, { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 }];
}
