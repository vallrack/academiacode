'use client';

import { DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { TeacherDashboard } from '@/components/app/teacher-dashboard';
import { StudentDashboard } from '@/components/app/student-dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage({ userProfile, loadingProfile }: { userProfile: DocumentData | null, loadingProfile: boolean }) {

  if (loadingProfile || !userProfile) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isTeacherOrAdmin = userProfile.role === 'TEACHER' || userProfile.role === 'SUPER_ADMIN';

  return isTeacherOrAdmin ? <TeacherDashboard userProfile={userProfile} /> : <StudentDashboard userProfile={userProfile} />;
}
