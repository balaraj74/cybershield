import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "CyberShield AI | Threat Detection Platform",
    template: "%s | CyberShield AI",
  },
  description:
    "Enterprise-grade AI-powered cybersecurity platform for real-time threat detection, phishing analysis, and privacy-first security monitoring.",
  keywords: [
    "cybersecurity",
    "AI",
    "threat detection",
    "phishing",
    "malware",
    "security",
    "privacy",
  ],
  authors: [{ name: "CyberShield AI Team" }],
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "CyberShield AI | Threat Detection Platform",
    description:
      "Enterprise-grade AI-powered cybersecurity platform for real-time threat detection.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-100`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
