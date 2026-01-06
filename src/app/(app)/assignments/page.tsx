'use client';

import React from 'react';
import { DocumentData } from 'firebase/firestore';
import AssignmentsPageContent from '@/components/app/assignments-page';

// This is a wrapper component to pass the props from the layout to the actual page component.
export default function AssignmentsPage({ userProfile, loadingProfile }: { userProfile?: DocumentData, loadingProfile?: boolean }) {
  return <AssignmentsPageContent userProfile={userProfile} loadingProfile={loadingProfile} />;
}
