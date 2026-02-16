'use client';

import { MobileMenuProvider } from "@/contexts/MobileMenuContext";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileMenuProvider>
      <Navigation />
      <div className="flex-1 flex flex-col ml-0 lg:ml-72">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </MobileMenuProvider>
  );
}
