
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useUser, useFirestore } from '@/firebase/provider';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CourseHeaderProps {
  courseId: string;
  title: string;
  description: string;
  teacherName: string;
  imageUrl: string;
}

export function CourseHeader({ courseId, title, description, teacherName, imageUrl }: CourseHeaderProps) {
  const user = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!user || !firestore) {
      // Si el usuario no está logueado, redirigir a la página de login
      router.push('/auth/login');
      return;
    }

    setIsEnrolling(true);
    const enrollmentRef = doc(firestore, `users/${user.uid}/enrollments`, courseId);

    try {
      // Verificar si ya está matriculado para evitar sobreescribir
      const docSnap = await getDoc(enrollmentRef);
      if (docSnap.exists()) {
          toast({ title: "Ya estás matriculado", description: "Puedes encontrar este curso en tu sección de \'Mis Cursos\'." });
          return;
      }

      // Si no está matriculado, crear la matrícula
      await setDoc(enrollmentRef, {
        courseId: courseId,
        enrolledAt: serverTimestamp(),
        progress: 0, // Progreso inicial
      });

      toast({ 
        title: '¡Matriculación completada!', 
        description: `Te has inscrito correctamente en ${title}.`,
      });

      // Redirigir a la primera lección o al contenido del curso
      router.push(`/courses/${courseId}/content`);

    } catch (error) {
      console.error("Error al matricularse: ", error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo completar la matriculación.',
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
      
      {/* Columna de Imagen */}
      <div className="md:col-span-1">
        <div className="aspect-video relative rounded-lg overflow-hidden border">
          <Image 
            src={imageUrl || '/placeholder.svg'} 
            alt={`Portada del curso ${title}`} 
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Columna de Información y Acción */}
      <div className="md:col-span-2 space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">{title}</h1>
        <p className="text-lg text-muted-foreground">{description}</p>
        <p className="text-sm font-medium">Impartido por: <span className="font-semibold">{teacherName}</span></p>
        
        {/* Botón de Matrícula/Acción */}
        <Button size="lg" className="w-full md:w-auto" onClick={handleEnroll} disabled={isEnrolling}>
          {isEnrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {user ? 'Matricularme ahora' : 'Inicia sesión para matricularte'}
        </Button>
      </div>

    </div>
  );
}
