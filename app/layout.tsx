import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
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

import { ThemeProvider } from "@/components/ThemeProvider";
import { Providers } from "@/components/Providers";
import { auth } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SessionManager } from "@/components/SessionManager";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${jetbrains.variable} bg-[var(--color-page)] font-sans antialiased text-[var(--color-text-secondary)]`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="nexlab-theme" disableTransitionOnChange>
          <ErrorBoundary>
            <Providers session={session}>
              <SessionManager>
                {children}
              </SessionManager>
            </Providers>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
