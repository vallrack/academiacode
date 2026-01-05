
import type { ReactNode } from "react";
import Link from "next/link";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavItems } from "@/components/app/nav-items";
import { Logo } from "@/components/app/logo";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AuthState } from "@/components/app/auth-state";


export default function AppLayout({ children }: { children: ReactNode }) {

  return (
    <FirebaseClientProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="p-2">
              <Link href="/dashboard" className="flex items-center gap-2">
                  <Logo />
                  <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">AcademiaCode</span>
              </Link>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <NavItems />
            </SidebarMenu>
          </SidebarContent>
          {/* The SidebarFooter will be rendered by AuthState */}
          <div className="sidebar-footer-container mt-auto"></div>
        </Sidebar>
        <SidebarInset>
           <AuthState>
            <div className="flex h-full flex-col">
                <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
                    <div className="md:hidden">
                        <SidebarTrigger />
                    </div>
                    <div className="w-full flex-1">
                        {/* Future components like a global search can go here */}
                    </div>
                </header>
                <main className="flex-1 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
          </AuthState>
        </SidebarInset>
      </SidebarProvider>
    </FirebaseClientProvider>
  );
}
