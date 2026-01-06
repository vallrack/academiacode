'use client';

import { DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { TeacherDashboard } from '@/components/app/teacher-dashboard';
import { StudentDashboard } from '@/components/app/student-dashboard';
import { SuperAdminDashboard } from '@/components/app/super-admin-dashboard';
import { useUserProfile } from '@/contexts/user-profile-context';

export default function DashboardPage() {
  const { userProfile, loadingProfile } = useUserProfile();

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

  const renderDashboardByRole = () => {
    switch (userProfile.role) {
      case 'SUPER_ADMIN':
        return <SuperAdminDashboard userProfile={userProfile} />;
      case 'TEACHER':
        return <TeacherDashboard userProfile={userProfile} />;
      case 'STUDENT':
        return <StudentDashboard userProfile={userProfile} />;
      default:
        return <p>Rol de usuario no reconocido.</p>;
    }
  };

  return renderDashboardByRole();
}
