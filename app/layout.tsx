import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ['400', '500', '600', '700'],
});

const mono   = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ['400', '500'],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${mono.variable}`}>
      <body className="bg-[var(--color-page)] font-sans antialiased text-[var(--color-text-secondary)]">
        {children}
      </body>
    </html>
  );
}