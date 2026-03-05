
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BookText, Video, Eye } from 'lucide-react';

// Esquema de validación para el formulario de la lección
const lessonFormSchema = z.object({
  title: z.string().min(3, { message: 'El título es obligatorio.' }),
  videoUrl: z.string().url({ message: 'Introduce una URL de vídeo válida.' }).optional().or(z.literal('')),
  description: z.string().optional(),
  isFree: z.boolean().default(false),
});

// Tipos de datos
interface LessonData {
  id: string;
  title: string;
  moduleId: string;
  videoUrl?: string;
  description?: string;
  isFree: boolean;
}

export default function EditLessonPage() {
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof lessonFormSchema>>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: { title: '', videoUrl: '', description: '', isFree: false },
  });

  // Cargar los datos de la lección
  useEffect(() => {
    if (!firestore || !lessonId) return;
    const fetchLesson = async () => {
      setIsLoading(true);
      const lessonRef = doc(firestore, 'lessons', lessonId);
      const lessonSnap = await getDoc(lessonRef);

      if (lessonSnap.exists()) {
        const lessonData = { id: lessonSnap.id, ...lessonSnap.data() } as LessonData;
        setLesson(lessonData);
        form.reset(lessonData); // Cargar datos en el formulario
      } else {
        toast({ title: 'Error', description: 'Lección no encontrada.', variant: 'destructive' });
        router.back();
      }
      setIsLoading(false);
    };
    fetchLesson();
  }, [firestore, lessonId, form, router, toast]);

  // Guardar los cambios
  const onSubmit = async (values: z.infer<typeof lessonFormSchema>) => {
    if (!firestore || !lessonId) return;
    setIsSubmitting(true);
    try {
      const lessonRef = doc(firestore, 'lessons', lessonId);
      await updateDoc(lessonRef, values);
      toast({ title: '¡Lección guardada!', description: 'El contenido de la lección ha sido actualizado.' });
    } catch (error) {
      console.error('Error al actualizar la lección:', error);
      toast({ title: 'Error', description: 'No se pudo guardar la lección.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <EditLessonPageSkeleton />;
  }

  if (!lesson) {
    return <p className="p-6">La lección no se ha encontrado.</p>;
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/modules/${lesson.moduleId}/edit`} passHref>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">Volver al módulo</p>
          <h1 className="text-2xl font-bold">Editando Lección: {lesson.title}</h1>
        </div>
      </div>

      {/* Formulario */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Columna Izquierda: Campos principales */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle className='flex items-center gap-2'><BookText/> Contenido Principal</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título de la lección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="videoUrl" render={({ field }) => (<FormItem><FormLabel>URL del Vídeo</FormLabel><FormControl><Input placeholder='https://youtube.com/watch?v=...' {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción / Contenido</FormLabel><FormControl><Textarea {...field} rows={12} /></FormControl><FormMessage /></FormMessage>)} />
                </CardContent>
              </Card>
            </div>

            {/* Columna Derecha: Opciones adicionales */}
            <div className="space-y-6">
               <Card>
                <CardHeader><CardTitle className='flex items-center gap-2'><Eye/> Visibilidad</CardTitle></CardHeader>
                <CardContent>
                   <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Lección Gratuita</FormLabel>
                          <FormDescription>Si está activo, cualquiera podrá ver esta lección.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

          </div>
          
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
        </form>
      </Form>
    </div>
  );
}

function EditLessonPageSkeleton() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-64" />
                </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        </div>
    );
}
