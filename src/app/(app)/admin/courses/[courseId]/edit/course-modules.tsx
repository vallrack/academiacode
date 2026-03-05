
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
import { List, GripVertical, Pencil, Trash2, PlusCircle, AlertTriangle } from 'lucide-react';

const moduleSchema = z.object({
  title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
});

// CORRECTED: Field is 'orders' to match the database index
interface Module {
  id: string;
  title: string;
  orders: number;
}

export function CourseModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const params = useParams();
  const courseId = params.courseId as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof moduleSchema>>({
    resolver: zodResolver(moduleSchema),
    defaultValues: { title: '' },
  });

  useEffect(() => {
    if (!firestore || !courseId) return;
    setIsLoading(true);
    setQueryError(null);
    // CORRECTED: Query is ordering by 'orders' to match the database index
    const q = query(collection(firestore, 'modules'), where('courseId', '==', courseId), orderBy('orders'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const modulesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module));
        setModules(modulesData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error al cargar módulos: ", error);
        setQueryError("No se pudieron cargar los módulos. Es probable que falte un índice en la base de datos. Revisa la consola de depuración para ver el mensaje de error completo de Firestore.");
        setIsLoading(false);
        toast({
            title: "Error de base de datos",
            description: "Revisa la consola (F12) para encontrar un enlace para crear el índice necesario.",
            variant: "destructive",
            duration: 15000,
        })
      }
    );

    return () => unsubscribe();
  }, [firestore, courseId, toast]);

  const onSubmit = async (values: z.infer<typeof moduleSchema>) => {
    if (!firestore || !courseId) return;
    setIsSubmitting(true);
    try {
      // CORRECTED: New documents must also use 'orders'
      const newOrder = modules.length > 0 ? Math.max(...modules.map(m => m.orders)) + 1 : 0;
      await addDoc(collection(firestore, 'modules'), {
        courseId: courseId,
        title: values.title,
        orders: newOrder, 
        createdAt: serverTimestamp(),
      });
      toast({ title: '¡Módulo creado!' });
      form.reset();
    } catch (error) {
      toast({ title: "Error al crear el módulo.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (moduleId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'modules', moduleId));
      toast({ title: 'Módulo eliminado' });
    } catch (error) {
      toast({ title: "Error al eliminar el módulo.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><List /> Módulos del Curso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          {isLoading && <p>Cargando módulos...</p>}
          
          {queryError && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive rounded-md flex items-center gap-2">
              <AlertTriangle className="h-5 w-5"/>
              <p>{queryError}</p>
            </div>
          )}

          {!isLoading && !queryError && modules.map((module) => (
            <div key={module.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/50 justify-between">
                <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <p className="font-medium">{module.title}</p>
                </div>
                <div className='flex items-center gap-1'>
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/admin/modules/${module.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className='text-red-500 hover:text-red-600' onClick={() => handleDelete(module.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          ))}

          {!isLoading && !queryError && modules.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay módulos en este curso.</p>}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem className="flex-grow"><FormControl><Input placeholder="Ej: Introducción al curso" {...field} disabled={isSubmitting || !!queryError} /></FormControl><FormMessage /></FormItem>)} />
            <Button type="submit" disabled={isSubmitting || !!queryError}><PlusCircle className="mr-2 h-4 w-4" />{isSubmitting ? 'Añadiendo...' : 'Añadir'}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
