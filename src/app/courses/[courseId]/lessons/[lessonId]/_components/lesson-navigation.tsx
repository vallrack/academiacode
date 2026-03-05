
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, BookOpenCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LessonLink {
  id: string;
  title: string;
}

interface LessonNavigationProps {
  courseId: string;
  currentLessonId: string;
}

export function LessonNavigation({ courseId, currentLessonId }: LessonNavigationProps) {
  const [prevLesson, setPrevLesson] = useState<LessonLink | null>(null);
  const [nextLesson, setNextLesson] = useState<LessonLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchCourseLessons = async () => {
      if (!firestore) return;
      setIsLoading(true);

      // 1. Obtener todos los módulos ordenados del curso
      const modulesQuery = query(collection(firestore, 'modules'), where('courseId', '==', courseId), orderBy('order'));
      const modulesSnapshot = await getDocs(modulesQuery);

      let allLessons: LessonLink[] = [];

      // 2. Por cada módulo, obtener sus lecciones ordenadas
      for (const moduleDoc of modulesSnapshot.docs) {
        const lessonsQuery = query(collection(firestore, 'lessons'), where('moduleId', '==', moduleDoc.id), orderBy('order'));
        const lessonsSnapshot = await getDocs(lessonsQuery);
        const lessons = lessonsSnapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title }));
        allLessons = [...allLessons, ...lessons];
      }

      // 3. Encontrar la lección actual y determinar la anterior y la siguiente
      const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLessonId);
      
      if (currentIndex !== -1) {
        setPrevLesson(currentIndex > 0 ? allLessons[currentIndex - 1] : null);
        setNextLesson(currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null);
      }

      setIsLoading(false);
    };

    fetchCourseLessons();
  }, [firestore, courseId, currentLessonId]);

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookOpenCheck size={20}/> Navegación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          {prevLesson ? (
            <Button asChild variant="outline">
              <Link href={`/courses/${courseId}/lessons/${prevLesson.id}`} className="w-full justify-between">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="truncate">{prevLesson.title}</span>
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled className="w-full justify-between">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Lección Anterior
            </Button>
          )}

          {nextLesson ? (
            <Button asChild>
              <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`} className="w-full justify-between">
                <span className="truncate">{nextLesson.title}</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button disabled className="w-full justify-between">
              Siguiente Lección
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
