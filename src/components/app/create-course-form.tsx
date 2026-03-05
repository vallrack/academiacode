
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { addDoc, collection } from 'firebase/firestore';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';
import { User, Group } from '@/lib/types';

interface CreateCourseFormProps {
  teachers: User[];
  groups: Group[];
}

export const courseFormSchema = z.object({
  title: z.string().min(5, { message: 'El título debe tener al menos 5 caracteres.' }),
  description: z.string().min(20, { message: 'La descripción debe tener al menos 20 caracteres.' }),
  teacherId: z.string({ required_error: 'Debes seleccionar un docente.' }),
  groupId: z.string().optional(),
  thumbnailUrl: z.string().url({ message: 'Por favor, introduce una URL válida.' }),
});

export function CreateCourseForm({ teachers, groups }: CreateCourseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof courseFormSchema>>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      description: '',
      teacherId: '',
      groupId: '',
      thumbnailUrl: '',
    },
  });

  async function onSubmit(values: z.infer<typeof courseFormSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(firestore, 'courses'), {
        ...values,
        isPublished: false,
      });

      toast({ 
        title: '¡Curso creado!',
        description: 'El nuevo curso ha sido guardado como borrador.',
      });

      router.push('/admin/courses');
      router.refresh(); // Refresca la página para mostrar el nuevo curso en la lista

    } catch (error) {
      console.error('Error al crear el curso: ', error);
      toast({ 
        title: 'Error',
        description: 'Hubo un problema al crear el curso.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título del Curso</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Curso de Next.js desde Cero" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el contenido del curso..."
                  className="resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teacherId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Docente del Curso</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un docente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id!}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Asigna el docente que estará a cargo de este curso.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="groupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grupo Asignado (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un grupo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id!}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Asigna este curso a un grupo específico de estudiantes.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="thumbnailUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de la Miniatura</FormLabel>
              <FormControl>
                <Input placeholder="https://ejemplo.com/imagen.png" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear Curso'}
        </Button>
      </form>
    </Form>
  );
}
