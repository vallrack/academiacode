
import type { ReactNode } from "react";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <div className="flex min-h-screen items-center justify-center bg-background">
        {children}
      </div>
    </FirebaseClientProvider>
  );
}
