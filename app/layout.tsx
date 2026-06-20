import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import SkipNav from "../components/SkipNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "CarbonPulse AI | Individual Carbon Tracking, Understanding & Reduction",
  description:
    "CarbonPulse AI helps individuals track, understand, and reduce their personal carbon footprint through actionable, gamified insights. AI-coached carbon reduction with eco-points, missions, and behavioral nudges.",
  keywords: [
    "individual carbon tracking",
    "carbon footprint reduction",
    "actionable carbon insights",
    "gamified sustainability",
    "carbon understanding",
    "personal emissions tracker",
    "AI carbon coach",
    "carbon reduction tool",
  ],
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07100e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SkipNav />
        {children}
      </body>
    </html>
  );
}
