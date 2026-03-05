
'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useFirestore } from "@/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; // Importar el componente Switch
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseModules } from "./course-modules";

// 1. Añadir isPublished al esquema de validación
const courseFormSchema = z.object({
  title: z.string().min(5, { message: "El título debe tener al menos 5 caracteres." }),
  description: z.string().min(20, { message: "La descripción debe tener al menos 20 caracteres." }),
  teacherId: z.string({ required_error: "Debes seleccionar un docente." }),
  thumbnailUrl: z.string().url({ message: "Por favor, introduce una URL válida." }),
  isPublished: z.boolean().default(false), // Añadido
});

type Teacher = { id: string; name: string; };

export default function EditCoursePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof courseFormSchema>>({
    resolver: zodResolver(courseFormSchema),
    // 2. Añadir valor por defecto para isPublished
    defaultValues: { title: "", description: "", teacherId: "", thumbnailUrl: "", isPublished: false },
  });

  useEffect(() => {
    if (!firestore || !courseId) return;
    const fetchData = async () => {
      try {
        const [courseSnap, teachersSnap] = await Promise.all([
          getDoc(doc(firestore, "courses", courseId)),
          getDocs(query(collection(firestore, "users"), where("role", "in", ["TEACHER", "SUPER_ADMIN"])))
        ]);

        const teachersData = teachersSnap.docs.map(doc => ({ id: doc.id, name: doc.data().displayName as string }));
        setTeachers(teachersData);

        if (courseSnap.exists()) {
          // El form.reset cargará el valor de isPublished desde la base de datos
          form.reset(courseSnap.data());
        } else {
          toast({ title: "Error", description: "El curso no existe.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error al cargar los datos: ", error);
        toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [firestore, courseId, form, toast]);

  // La función onSubmit ya funciona, porque `values` incluirá `isPublished`
  async function onSubmit(values: z.infer<typeof courseFormSchema>) {
    if (!firestore || !courseId) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(firestore, "courses", courseId);
      await updateDoc(docRef, values);
      toast({ 
        title: "¡Curso actualizado!",
        description: "Los detalles del curso se han guardado.",
      });
      router.push('/admin/courses');
    } catch (error) {
      console.error("Error al actualizar: ", error);
      toast({ title: "Error", description: "Hubo un problema al guardar.", variant: "destructive"});
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
      // ... (El código de esqueleto de carga no cambia) ...
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Editar Detalles del Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="teacherId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Docente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un docente" /></SelectTrigger></FormControl>
                      <SelectContent>{teachers.map(teacher => (<SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>))}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>)}
                />
                <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (<FormItem><FormLabel>URL de Miniatura</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                
                {/* 3. Añadir el nuevo campo Switch para el estado de publicación */}
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Publicación
                        </FormLabel>
                        <FormDescription>
                          Si está activo, el curso será visible para todos los estudiantes.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar Cambios"}</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <CourseModules />
      </div>
    </div>
  );
}
