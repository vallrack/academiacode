
import type { ReactNode } from "react";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AppShell } from "@/components/app/app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
        <AppShell>
            {children}
        </AppShell>
    </FirebaseClientProvider>
  );
}
