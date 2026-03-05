
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import Link from 'next/link';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Lock, PlayCircle, CheckCircle } from "lucide-react";

// Tipos de datos que recibe el componente
interface Lesson {
  id: string;
  title: string;
  order: number;
  isFree: boolean;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CourseContentProps {
  courseId: string;
  modules: Module[];
}

// --- Componente de la Lección ---
const LessonItem = ({ courseId, lesson, isEnrolled, isCompleted }: { courseId: string, lesson: Lesson, isEnrolled: boolean, isCompleted: boolean }) => {
  const canAccess = lesson.isFree || isEnrolled;
  const icon = isCompleted ? <CheckCircle className="text-green-500"/> : (canAccess ? <PlayCircle /> : <Lock className="text-muted-foreground" />);
  const lessonPath = `/courses/${courseId}/lessons/${lesson.id}`;

  return (
    <div className={`flex items-center justify-between p-3 rounded-md transition-colors ${canAccess ? 'hover:bg-muted/50' : 'opacity-70'}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className={`font-medium ${!canAccess ? 'text-muted-foreground' : ''}`}>{lesson.title}</span>
      </div>
      {canAccess ? (
        <Button asChild variant="secondary" size="sm">
          <Link href={lessonPath}>Iniciar</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>Bloqueado</Button>
      )}
    </div>
  );
};


// --- Componente Principal del Contenido del Curso ---
export function CourseContent({ courseId, modules }: CourseContentProps) {
  const user = useUser();
  const firestore = useFirestore();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // TODO: Faltaría implementar el estado de lecciones completadas

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }
    const checkEnrollment = async () => {
      const enrollmentRef = doc(firestore, `users/${user.uid}/enrollments`, courseId);
      const docSnap = await getDoc(enrollmentRef);
      setIsEnrolled(docSnap.exists());
      setIsLoading(false);
    };
    checkEnrollment();
  }, [user, firestore, courseId]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Contenido del Curso</h2>
      {isLoading ? (
        <p>Verificando tu matrícula...</p>
      ) : (
        <Accordion type="multiple" defaultValue={modules.map(m => m.id)} className="w-full space-y-4">
          {modules.map((module) => (
            <AccordionItem key={module.id} value={module.id} className="border-2 rounded-lg">
              <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline">
                {module.title}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 space-y-2">
                {module.lessons.map(lesson => (
                   <LessonItem 
                      key={lesson.id} 
                      courseId={courseId}
                      lesson={lesson} 
                      isEnrolled={isEnrolled} 
                      isCompleted={false} // Placeholder
                    />
                ))}
                 {!module.lessons.length && <p className='text-sm text-muted-foreground p-3'>Aún no hay lecciones en este módulo.</p>}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
