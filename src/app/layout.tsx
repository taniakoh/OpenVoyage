import type { Metadata } from "next";

import { Providers } from "@/components/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "OpenVoyage",
  description: "Cinematic travel intelligence interface powered by Next.js and TinyFish."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
