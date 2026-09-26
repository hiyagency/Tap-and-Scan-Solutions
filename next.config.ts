import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/admin/sw.js", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "Content-Type", value: "application/javascript; charset=utf-8" }, { key: "Service-Worker-Allowed", value: "/admin/" }] }];
  },
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [{ protocol: "https", hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, pathname: "/storage/v1/object/public/shipments/**" }]
      : [],
  },
};

export default nextConfig;
