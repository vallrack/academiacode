
'use client';

import { type ReactNode, useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { FirebaseProvider } from '@/firebase/provider';
import { firebaseConfig } from '@/firebase/config';
import { Toaster } from '@/components/ui/toaster';

/**
 * Este componente centraliza todos los proveedores que dependen del cliente.
 * Utiliza un estado 'mounted' para garantizar que estos proveedores y sus hijos
 * solo se rendericen en el navegador, evitando así los errores de hidratación.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Este efecto solo se ejecuta en el cliente.
  useEffect(() => {
    setMounted(true);
  }, []);

  // En el servidor (y durante la carga inicial del cliente), 'mounted' es falso.
  // Devolvemos 'null' para asegurarnos de que el HTML del servidor esté vacío
  // y no pueda haber un desajuste. La UI aparecerá en cuanto el cliente se monte.
  if (!mounted) {
    return null;
  }

  // Una vez montado en el cliente, renderizamos todos los proveedores que necesita la app.
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <FirebaseProvider config={firebaseConfig}>
        {children}
        <Toaster />
      </FirebaseProvider>
    </ThemeProvider>
  );
}
