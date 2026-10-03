import type { Metadata } from "next";
import "@fontsource-variable/anybody";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
import "./globals.css";
import "./shop.css";
import "./premium-shop.css";
import { getSiteUrl } from "@/lib/site-url";
import { ClarityConsent } from "@/components/shop/clarity-consent";


export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "NFC Solutions & Custom NFC Stands in India | NFC.HIY",
    template: "%s | NFC.HIY",
  },
  description: "Custom NFC solutions in India: waterproof NFC stands, smart editable QR codes, NFC cards, review stands and scan analytics for restaurants, professionals and businesses.",
  applicationName: "NFC.HIY",
  authors: [{ name: "Abhigyan Pandey", url: "https://hiy.agency" }],
  creator: "Abhigyan Pandey",
  publisher: "NFC.HIY",
  category: "NFC solutions",
  keywords: ["NFC solutions India", "NFC stands India", "custom NFC stand", "NFC review stand", "NFC cards India", "smart QR codes", "editable QR code", "QR code tracking", "Google review NFC stand", "restaurant NFC menu", "NFC business card", "waterproof QR stand"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    title: "Custom NFC Solutions & NFC Stands in India | NFC.HIY",
    description: "Waterproof NFC stands, editable smart QR codes, NFC cards and scan analytics—custom designed for Indian businesses.",
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "NFC.HIY",
    images: [{ url: "/media/workshop-poster.jpg", width: 1400, height: 788, alt: "Custom NFC and smart QR products by NFC.HIY" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom NFC Solutions in India | NFC.HIY",
    description: "Custom NFC stands, editable smart QR codes and tracked NFC experiences for Indian businesses.",
    images: ["/media/workshop-poster.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" style={{ "--font-display": "'Anybody Variable'", "--font-body": "'IBM Plex Sans'" } as React.CSSProperties}>
      <body>{children}<ClarityConsent projectId={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "yohyb3at4h"}/></body>
    </html>
  );
}
