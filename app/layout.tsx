import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    <html lang="fr">
      <body className="bg-[var(--color-page)] font-sans antialiased text-[var(--color-text-secondary)]">
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
