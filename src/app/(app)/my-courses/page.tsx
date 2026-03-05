
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useAuth } from '@/components/providers/auth-provider';

import { CourseCard, CourseCardSkeleton } from '../courses/course-card';
import { type Course } from '../admin/courses/courses-data-table';

export default function MyCoursesPage() {
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();
  const { user } = useAuth();

  useEffect(() => {
    if (!firestore || !user) {
      setIsLoading(false);
      return;
    }

    const fetchMyCourses = async () => {
      setIsLoading(true);
      try {
        // 1. Obtener las matrículas del usuario actual
        const enrollmentsQuery = query(collection(firestore, 'enrollments'), where('userId', '==', user.uid));
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        const courseIds = enrollmentsSnap.docs.map(doc => doc.data().courseId as string);

        if (courseIds.length === 0) {
          setEnrolledCourses([]);
          setIsLoading(false);
          return;
        }

        // 2. Obtener los datos de cada curso matriculado
        const coursePromises = courseIds.map(id => getDoc(doc(firestore, 'courses', id)));
        const courseSnaps = await Promise.all(coursePromises);
        
        const coursesData = courseSnaps
          .filter(snap => snap.exists())
          .map(snap => ({ id: snap.id, ...snap.data() } as Course));
        
        // Obtener los IDs de los docentes de los cursos cargados
        const teacherIds = [...new Set(coursesData.map(c => c.teacherId).filter(Boolean))];
        
        // 3. Obtener los datos de los docentes
        if (teacherIds.length > 0) {
          const teachersQuery = query(collection(firestore, "users"), where("__name__", "in", teacherIds));
          const teachersSnap = await getDocs(teachersQuery);
          const newTeachers = new Map<string, string>();
          teachersSnap.forEach(doc => {
            newTeachers.set(doc.id, doc.data().name as string);
          });
          setTeachers(newTeachers);
        }

        setEnrolledCourses(coursesData);

      } catch (error) {
        console.error("Error al obtener mis cursos: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyCourses();
  }, [firestore, user]);

  // 4. Combinar los datos para enriquecer los cursos con el nombre del docente
  const enrichedCourses = useMemo(() => {
    return enrolledCourses.map(course => ({
      ...course,
      teacherName: teachers.get(course.teacherId) || 'Docente no disponible',
    }));
  }, [enrolledCourses, teachers]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Mis Cursos</h1>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <CourseCardSkeleton key={i} />)}
        </div>
      ) : enrichedCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {enrichedCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))
        </div>
      ) : (
        <div className="text-center text-muted-foreground mt-12">
          <p>Aún no te has matriculado en ningún curso.</p>
          <Button variant="link" asChild>
             <a href="/courses">¡Explora nuestros cursos y empieza a aprender!</a>
          </Button>
        </div>
      )}
    </div>
  );
}
