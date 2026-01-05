
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, Users, BarChart3, Menu, X, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, type DocumentData } from 'firebase/firestore';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Logo } from './logo';
import { cn } from '@/lib/utils';

const menuItems = [
    { icon: Home, label: 'Panel', href: '/dashboard' },
    { icon: BookOpen, label: 'Desafíos', href: '/challenges' },
    { icon: Users, label: 'Estudiantes', href: '/students' },
    { icon: BarChart3, label: 'Resultados', href: '/results' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();

  const userProfileQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<DocumentData>(userProfileQuery);
  
  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
        router.push('/login');
    }
  };

  const displayName = userProfile?.displayName || user?.email?.split('@')[0] || 'User';
  const email = userProfile?.email || user?.email || '';
  const photoURL = userProfile?.photoURL || user?.photoURL || '';
  const fallback = displayName?.slice(0, 2).toUpperCase() || 'U';


  const sidebarContent = (isMobile = false) => (
    <>
      {/* Header */}
       <div className="flex items-center justify-between p-4 border-b border-gray-200 h-16">
        {isOpen || isMobile ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-2" onClick={() => isMobile && setIsMobileMenuOpen(false)}>
              <Logo />
              <span className="font-semibold text-lg">AcademiaCode</span>
            </Link>
            {!isMobile && (
                 <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
            )}
          </>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full flex justify-center p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                isOpen ? "" : "justify-center",
                isActive ? "bg-gray-100" : "hover:bg-gray-100"
              )}
              title={!isOpen && !isMobile ? item.label : undefined}
              onClick={() => isMobile && setIsMobileMenuOpen(false)}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive ? "text-blue-600" : "text-gray-600 group-hover:text-blue-600"
              )} />
              {(isOpen || isMobile) && (
                <span className={cn(
                    "text-sm font-medium",
                    isActive ? "text-blue-600" : "text-gray-700 group-hover:text-blue-600"
                )}>
                  {item.label}
                </span>
              )}
            </Link>
        )})}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-2 border-t border-gray-200">
        {(isOpen || isMobile) ? (
          <div className="flex items-center gap-3 p-2">
            <Avatar className="h-10 w-10">
              {photoURL && <AvatarImage src={photoURL} alt={displayName} />}
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{email}</p>
            </div>
             <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center p-2">
            <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside
        className={cn(
            "hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
            isOpen ? 'w-64' : 'w-20'
        )}
      >
        {sidebarContent()}
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-white z-50 flex flex-col">
            {sidebarContent(true)}
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 md:hidden flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4">
            {/* Header for mobile, e.g. search bar, can be placed here */}
        </header>
        <main className="flex-1 p-4 lg:gap-6 lg:p-6">
            {children}
        </main>
      </div>
    </div>
  );
}
