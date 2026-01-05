import type { ReactNode } from "react";
import Link from "next/link";
import {
  LogOut,
  Settings,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NavItems } from "@/components/app/nav-items";
import { Logo } from "@/components/app/logo";
import { PlaceHolderImages } from "@/lib/placeholder-images";


export default function AppLayout({ children }: { children: ReactNode }) {
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

  return (
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
        <SidebarFooter>
          <DropdownMenu>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <div className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-sidebar-accent">
                      <Avatar className="h-9 w-9">
                        {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="Dr. Evans" data-ai-hint={userAvatar.imageHint} />}
                        <AvatarFallback>DE</AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
                        <p className="truncate font-semibold">Dr. Evans</p>
                        <p className="truncate text-xs text-muted-foreground">
                          admin@school.edu
                        </p>
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  Dr. Evans
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent side="right" align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-col">
            <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
                <div className="md:hidden">
                    <SidebarTrigger />
                </div>
                <div className="w-full flex-1">
                    {/* Future components like a global search can go here */}
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 lg:gap-6 lg:p-6">
                {children}
            </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
