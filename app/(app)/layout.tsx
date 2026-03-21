import ClientLayout from "@/components/layout/ClientLayout";
           import { SessionProvider } from "next-auth/react";
           import { auth } from "@/lib/auth";

           export default async function AppLayout({
             children,
           }: {
             children: React.ReactNode;
           }) {
             const session = await auth();
             return (
               <SessionProvider session={session}>
                 <ClientLayout>
                   {children}
                 </ClientLayout>
               </SessionProvider>
             );
           }
