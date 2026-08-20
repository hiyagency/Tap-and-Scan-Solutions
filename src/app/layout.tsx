import type { Metadata } from "next";
import { Anybody, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/site-url";

const anybody = Anybody({ variable: "--font-display", subsets: ["latin"], display: "swap" });
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "NFC Solutions & Custom NFC Stands in India | NFC BY ABHIGYAN",
    template: "%s | NFC BY ABHIGYAN",
  },
  description: "Custom NFC solutions in India: waterproof NFC stands, smart editable QR codes, NFC cards, review stands and scan analytics for restaurants, professionals and businesses.",
  applicationName: "NFC BY ABHIGYAN",
  authors: [{ name: "Abhigyan Pandey", url: "https://hiy.agency" }],
  creator: "Abhigyan Pandey",
  publisher: "NFC BY ABHIGYAN",
  category: "NFC solutions",
  keywords: ["NFC solutions India", "NFC stands India", "custom NFC stand", "NFC review stand", "NFC cards India", "smart QR codes", "editable QR code", "QR code tracking", "Google review NFC stand", "restaurant NFC menu", "NFC business card", "waterproof QR stand"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    title: "Custom NFC Solutions & NFC Stands in India | NFC BY ABHIGYAN",
    description: "Waterproof NFC stands, editable smart QR codes, NFC cards and scan analytics—custom designed for Indian businesses.",
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "NFC BY ABHIGYAN",
    images: [{ url: "/media/workshop-poster.jpg", width: 1400, height: 788, alt: "Custom NFC and smart QR products by NFC BY ABHIGYAN" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom NFC Solutions in India | NFC BY ABHIGYAN",
    description: "Custom NFC stands, editable smart QR codes and tracked NFC experiences for Indian businesses.",
    images: ["/media/workshop-poster.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${anybody.variable} ${ibmPlexSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
