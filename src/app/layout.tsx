import type { Metadata } from "next";
import { JetBrains_Mono, Newsreader, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { StatusBar } from "@/components/layout/status-bar";
import { TopNav } from "@/components/layout/top-nav";
import { ThinkingTrace } from "@/components/thinking-trace";

import "./globals.css";

const headline = Newsreader({
  adjustFontFallback: false,
  subsets: ["latin"],
  variable: "--font-headline"
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "OpenVoyage",
  description: "Cinematic travel intelligence interface powered by Next.js and TinyFish."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${headline.variable} ${body.variable} ${mono.variable}`} lang="en">
      <body>
        <Providers>
          <TopNav />
          <ThinkingTrace />
          {children}
          <StatusBar />
        </Providers>
      </body>
    </html>
  );
}
