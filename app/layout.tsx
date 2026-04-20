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

import { ThemeProvider } from "@/components/ThemeProvider";
import { Providers } from "@/components/Providers";
import { auth } from "@/lib/auth";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-[var(--color-page)] font-sans antialiased text-[var(--color-text-secondary)]">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="nexlab-theme" disableTransitionOnChange>
          <Providers session={session}>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
