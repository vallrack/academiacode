
"use client";

import { useUser } from "@/firebase/auth/use-user";
import { useFirestore, useAuth } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc, DocumentData } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { SidebarFooter } from "../ui/sidebar";

type UserProfile = {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
};

export function AuthState({ children }: { children: React.ReactNode }) {
    const { user, loading: loadingUser } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();

    const userProfileQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid)
    }, [firestore, user]);

    const { data: userProfile, loading: loadingProfile } = useDoc<UserProfile & DocumentData>(userProfileQuery);

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            router.push('/login');
        }
    };
    
    if (loadingUser || (user && loadingProfile)) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        )
    }

    if (!user) {
        // useUser hook handles redirection, so this should ideally not be seen
        return null;
    }
    
    const displayName = userProfile?.displayName || user.email;
    const email = userProfile?.email || user.email;
    const photoURL = userProfile?.photoURL || user.photoURL;

    return (
        <>
            {/* Inject user info into the sidebar footer */}
            <style jsx global>{`
                .sidebar-footer-container {
                    display: contents;
                }
            `}</style>
            <div className="sidebar-footer-container">
                <SidebarFooter>
                     <DropdownMenu>
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                <div className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-sidebar-accent">
                                    <Avatar className="h-9 w-9">
                                    {photoURL && <AvatarImage src={photoURL} alt={displayName || 'User'} />}
                                    <AvatarFallback>{displayName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
                                    <p className="truncate font-semibold">{displayName}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {email}
                                    </p>
                                    </div>
                                </div>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="right" align="center">
                                {displayName}
                            </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <DropdownMenuContent side="right" align="end" className="w-56">
                            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Configuración</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Cerrar Sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarFooter>
            </div>
            {children}
        </>
    );
}

