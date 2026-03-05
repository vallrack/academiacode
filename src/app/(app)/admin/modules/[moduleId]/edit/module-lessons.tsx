
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { BookOpen, GripVertical, Pencil, Trash2, PlusCircle } from 'lucide-react';

const lessonSchema = z.object({
  title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
});

interface Lesson {
  id: string;
  title: string;
  order: number;
}

interface ModuleLessonsProps {
  moduleId: string;
  courseId: string;
}

export function ModuleLessons({ moduleId, courseId }: ModuleLessonsProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof lessonSchema>>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { title: '' },
  });

  useEffect(() => {
    if (!firestore || !moduleId) return;
    setIsLoading(true);
    const q = query(collection(firestore, 'lessons'), where('moduleId', '==', moduleId), orderBy('order'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lessonsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
      setLessons(lessonsData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [firestore, moduleId]);

  const onSubmit = async (values: z.infer<typeof lessonSchema>) => {
    if (!firestore || !moduleId) return;
    setIsSubmitting(true);
    try {
      // --- CORRECCIÓN: Cálculo de orden robusto ---
      const validOrders = lessons
        .map(l => l.order)
        .filter(o => typeof o === 'number' && isFinite(o));
      
      const maxOrder = validOrders.length > 0 ? Math.max(...validOrders) : -1;
      const newOrder = maxOrder + 1;
      // --- FIN DE LA CORRECCIÓN ---

      await addDoc(collection(firestore, 'lessons'), {
        courseId: courseId,
        moduleId: moduleId,
        title: values.title,
        order: newOrder, // Usamos el nuevo orden seguro
        isFree: false, 
        createdAt: serverTimestamp(),
      });
      toast({ title: '¡Lección creada!' });
      form.reset();
    } catch (error) {
      console.error("Error al crear la lección: ", error);
      toast({ title: "Error al crear la lección.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'lessons', lessonId));
      toast({ title: 'Lección eliminada' });
    } catch (error) {
      toast({ title: "Error al eliminar la lección.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookOpen /> Lecciones del Módulo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          {isLoading ? <p>Cargando lecciones...</p> : lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/50 justify-between">
                <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <p className="font-medium">{lesson.title}</p>
                </div>
                <div className='flex items-center gap-1'>
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/admin/lessons/${lesson.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className='text-red-500 hover:text-red-600' onClick={() => handleDelete(lesson.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          ))}
          {!isLoading && lessons.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay lecciones en este módulo.</p>}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder="Ej: ¿Qué es React?" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Añadiendo...' : 'Añadir'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
