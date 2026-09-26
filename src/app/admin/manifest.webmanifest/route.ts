import type { MetadataRoute } from "next";
export function GET() {
  const manifest: MetadataRoute.Manifest = { id: "/admin", name: "NFCS Orders", short_name: "Orders", description: "NFC.HIY private order console", start_url: "/admin", scope: "/admin", display: "standalone", orientation: "portrait", theme_color: "#f3f4f1", background_color: "#f3f4f1", icons: [
    { src: "/admin/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/admin/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/admin/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ] };
  return Response.json(manifest, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public,max-age=3600" } });
}
