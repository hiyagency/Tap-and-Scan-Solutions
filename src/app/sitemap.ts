import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { getCatalogue } from "@/lib/shop/catalogue-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const {products}=await getCatalogue();
  return [{url:base,changeFrequency:"weekly",priority:1},{url:base+"/about",changeFrequency:"monthly",priority:.7},{url:base+"/privacy",changeFrequency:"yearly",priority:.2},...products.filter(p=>p.active).map(p=>({url:base+"/products/"+p.slug,changeFrequency:"weekly" as const,priority:.8}))];
}
