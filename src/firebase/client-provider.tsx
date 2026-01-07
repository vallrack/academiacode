'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

// Este componente ahora es un simple passthrough al FirebaseProvider,
// ya que la inicialización se maneja de forma centralizada.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
