'use client';

import AssignmentsPage from '@/components/app/assignments-page';
import type { DocumentData } from 'firebase/firestore';

interface PageProps {
  userProfile?: DocumentData;
  loadingProfile?: boolean;
}

export default function Page({ userProfile, loadingProfile }: PageProps) {
  // Este componente actúa como un contenedor, pasando las props recibidas
  // desde el layout al componente de página real.
  return <AssignmentsPage userProfile={userProfile} loadingProfile={loadingProfile} />;
}
