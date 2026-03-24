import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const mono   = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ['400', '500', '700', '800'],
});

export const metadata: Metadata = {
  title: "NEXLAB - Système de Gestion Laboratoire",
  description: "LIMS professionnel - NEXLAB",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

import { Providers } from "@/components/Providers";
import { auth } from "@/lib/auth";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  return (
    <html lang="fr" className={`${geistSans.variable} ${mono.variable}`}>
      <body className="bg-[var(--color-page)] font-sans antialiased text-[var(--color-text-secondary)]">
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}