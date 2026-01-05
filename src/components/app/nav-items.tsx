"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Book, ClipboardCheck, LayoutDashboard, Users } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/challenges", icon: Book, label: "Challenges" },
  { href: "/students", icon: Users, label: "Students" },
  { href: "/results", icon: ClipboardCheck, label: "Results" },
];

export function NavItems() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              tooltip={item.label}
              isActive={isActive}
            >
              <Link href={item.href}>
                <item.icon />
                {item.label}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}
