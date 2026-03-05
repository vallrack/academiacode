
import { getDocs, collection, query, where } from 'firebase/firestore';
import { Course, Group, User } from '@/lib/types';
import { adminDb as firestore } from '@/lib/firebase-admin'; // Corrected import
import { CreateCourseForm } from '@/components/app/create-course-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function getTeachersAndGroups() {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }
  const teachersQuery = query(collection(firestore, 'users'), where('role', '==', 'teacher'));
  const groupsQuery = collection(firestore, 'groups');

  const [teachersSnapshot, groupsSnapshot] = await Promise.all([
    getDocs(teachersQuery),
    getDocs(groupsQuery),
  ]);

  const teachers = teachersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[];
  const groups = groupsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Group[];

  return { teachers, groups };
}

export default async function CreateCoursePage() {
  const { teachers, groups } = await getTeachersAndGroups();

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear un Nuevo Curso</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCourseForm teachers={teachers} groups={groups} />
        </CardContent>
      </Card>
    </div>
  );
}
