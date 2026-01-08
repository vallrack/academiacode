
'use client';

import React from 'react';
import AssignmentsPageContent from '@/components/app/assignments-page';
import { UserProfileProvider } from '@/contexts/user-profile-context';

export const dynamic = 'force-dynamic';

// This is a wrapper component to pass the props from the layout to the actual page component.
export default function AssignmentsPage() {
  return <AssignmentsPageContent />;
}
