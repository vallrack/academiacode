'use client';

import type { ReactNode } from "react";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { useState, useEffect } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Si no es el cliente, renderizamos un cascarón vacío o un cargando
  // Esto evita que el HTML del servidor sea diferente al del cliente
  if (!isClient) {
    return <div className="min-h-screen bg-background" />; 
  }

  return (
    <FirebaseClientProvider>
      <div className="flex min-h-screen items-center justify-center bg-background">
        {children}
      </div>
    </FirebaseClientProvider>
  );
}
