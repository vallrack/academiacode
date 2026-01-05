
'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

import { useAuth } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';

const AUTH_PAGES = ['/login', '/register'];

export function useUser() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false);
      if (user) {
        setUser(user);
        // If user is on an auth page, redirect to dashboard
        if (AUTH_PAGES.includes(pathname)) {
          router.replace('/dashboard');
        }
      } else {
        setUser(null);
        // If user is not on an auth page, redirect to login
        if (!AUTH_PAGES.includes(pathname)) {
          router.replace('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [auth, router, pathname]);

  return { user, loading };
}
