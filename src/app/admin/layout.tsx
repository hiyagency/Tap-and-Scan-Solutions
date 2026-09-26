import type { Metadata, Viewport } from "next";
import "./orders.css";
export const metadata: Metadata = {
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "NFCS Orders", statusBarStyle: "default" },
  icons: { apple: "/admin/icons/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f3f4f1" };
export default function AdminLayout({ children }: { children: React.ReactNode }) { return children; }
