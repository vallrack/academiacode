
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, Users, BarChart3, Menu, X, ChevronLeft, ChevronRight, LogOut, Layers, UserCog, ClipboardList, Moon, Sun, Library } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { type DocumentData } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

const allMenuItems = [
  { icon: Home, label: 'Panel', href: '/dashboard', roles: ['STUDENT', 'TEACHER', 'SUPER_ADMIN'] },
  { icon: ClipboardList, label: 'Asignaciones', href: '/assignments', roles: ['STUDENT', 'TEACHER', 'SUPER_ADMIN'] },
  { icon: BookOpen, label: 'Desafíos', href: '/challenges', roles: ['TEACHER', 'SUPER_ADMIN'] },
  { icon: Library, label: 'Cursos', href: '/admin/courses', roles: ['TEACHER', 'SUPER_ADMIN'] },
  { icon: Layers, label: 'Grupos', href: '/groups', roles: ['TEACHER', 'SUPER_ADMIN'] },
  { icon: Users, label: 'Estudiantes', href: '/students', roles: ['TEACHER', 'SUPER_ADMIN'] },
  { icon: UserCog, label: 'Usuarios', href: '/users', roles: ['SUPER_ADMIN'] },
  { icon: BarChart3, label: 'Resultados', href: '/results', roles: ['STUDENT', 'TEACHER', 'SUPER_ADMIN'] },
];

function ThemeToggle() {
    const { setTheme, theme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function AppShell({ 
  children,
  userProfile,
  isLoading
}: { 
  children: React.ReactNode,
  userProfile: DocumentData | null,
  isLoading: boolean 
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!firestore || !userProfile?.uid) return;

    const userStatusRef = doc(firestore, 'users', userProfile.uid);

    updateDoc(userStatusRef, { status: 'online', lastSeen: serverTimestamp() }).catch(err => {
      console.error('Error updating user status to online:', err);
    });

    const handleBeforeUnload = () => {
      if (navigator.sendBeacon) {
          const data = JSON.stringify({
              status: 'offline',
              lastSeen: new Date().toISOString(),
          });
          const url = `/api/updateStatus?userId=${userProfile.uid}`;
          navigator.sendBeacon(url, data);
      } else {
          updateDoc(userStatusRef, { status: 'offline', lastSeen: serverTimestamp() });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateDoc(userStatusRef, { status: 'offline', lastSeen: serverTimestamp() }).catch(() => {});
    };
  }, [firestore, userProfile?.uid]);


  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      // Redirection is handled by the useUser hook
    }
  };

  const userRole = userProfile?.role;
  const menuItems = allMenuItems.filter(item => userRole && item.roles.includes(userRole));

  const sidebarContent = (isMobile = false) => (
    <>
      <div className="flex items-center justify-between p-4 border-b h-16">
        {isOpen || isMobile ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-2" onClick={() => isMobile && setIsMobileMenuOpen(false)}>
              <Logo />
              <span className="font-semibold text-lg">AcademiaCode</span>
            </Link>
            {!isMobile && (
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded-md transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </>
        ) : (
          <button onClick={() => setIsOpen(true)} className="w-full flex justify-center p-2 hover:bg-muted rounded-md transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                href={item.href}
                key={item.href}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                  isOpen ? "" : "justify-center",
                  isActive ? "bg-primary/10 text-primary" : "hover:bg-accent hover:text-accent-foreground"
                )}
                title={!isOpen ? item.label : undefined}
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
              >
                <item.icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                   isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )} />
                {(isOpen || isMobile) && (
                  <span className={cn(
                    "text-sm font-medium",
                     isActive ? "text-primary" : "group-hover:text-primary"
                  )}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </nav>

      <div className="p-2 border-t">
        {(isOpen || isMobile) ? (
          <div className="flex items-center gap-3 p-2">
            {isLoading ? (
              <>
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                </div>
              </>
            ) : (
              <>
                <Avatar className="h-10 w-10">
                  {userProfile?.photoURL && <AvatarImage src={userProfile.photoURL} alt={userProfile.displayName} />}
                  <AvatarFallback>{userProfile?.displayName?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{userProfile?.displayName || 'Usuario'}</p>
                  <p className="text-xs text-muted-foreground truncate">{userProfile?.email || ''}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex justify-center p-2">
            <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={cn(
          "hidden md:flex flex-col bg-card border-r transition-all duration-300",
          isOpen ? 'w-64' : 'w-20'
        )}
      >
        {sidebarContent()}
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 h-16 shrink-0 items-center justify-between gap-4 border-b bg-card px-4 z-30 flex md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
              <Logo />
              <span className="font-semibold text-lg">AcademiaCode</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
            >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

         <header className="sticky top-0 h-16 shrink-0 items-center justify-end gap-4 border-b bg-card px-4 z-30 hidden md:flex">
             <ThemeToggle />
         </header>

        {isMobileMenuOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <aside className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-card z-50 flex flex-col">
              {sidebarContent(true)}
            </aside>
          </>
        )}

        <main className="flex-1 p-4 lg:gap-6 lg:p-6 overflow-y-auto bg-muted/40">
          {isLoading ? <Skeleton className="h-full w-full" /> : children}
        </main>
      </div>
    </div>
  );
}
