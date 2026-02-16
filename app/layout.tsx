
import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "LABCARE - Système de Gestion Laboratoire",
  description: "LIMS professionnel - LABCARE",
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
    <html lang="fr">
      <body className="flex h-screen overflow-hidden bg-[var(--background)]">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}