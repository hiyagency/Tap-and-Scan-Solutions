import type { Metadata } from "next";
import { Anybody, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const anybody = Anybody({ variable: "--font-display", subsets: ["latin"], display: "swap" });
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "TAP AND SCAN SOLUTIONS | QR & NFC Experiences",
    template: "%s | TAP AND SCAN SOLUTIONS",
  },
  description: "U2L.AI-generated tracked QR codes, premium NFC tags, engraved acrylic stands and monthly scan analytics for Indian businesses.",
  openGraph: {
    title: "Turn one tap into the next customer action.",
    description: "U2L.AI-generated tracked QR and NFC experiences designed, built and supported by TAP AND SCAN SOLUTIONS.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "TAP AND SCAN SOLUTIONS",
    description: "U2L.AI-generated QR, active tracking and NFC experiences built for real businesses.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${anybody.variable} ${ibmPlexSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
