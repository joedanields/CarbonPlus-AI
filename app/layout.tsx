import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import SkipNav from "../components/SkipNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "CarbonPulse | Personal Carbon Tracker",
  description:
    "Understand, track, and reduce your carbon footprint through simple daily actions and personalized insights. Local-first, no account required.",
  keywords: ["carbon tracker", "carbon footprint", "sustainability", "emissions", "climate"],
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
