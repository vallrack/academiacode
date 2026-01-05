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
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                tooltip={item.label}
                isActive={isActive}
              >
                <item.icon />
                {item.label}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}
