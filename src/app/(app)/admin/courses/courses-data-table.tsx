
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, deleteDoc, doc, where, getDocs } from 'firebase/firestore'; // Added getDocs
import { useFirestore } from '@/firebase';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

// 1. Definiendo la nueva estructura del curso para la tabla
export type Course = {
  id: string;
  title: string;
  teacherId: string;
  teacherName?: string; // Nuevo campo opcional para el nombre del docente
  isPublished: boolean;
};

// Componente de la celda de acciones (sin cambios)
const ActionsCell = ({ row }: { row: any }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const course = row.original as Course;
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, "courses", course.id));
      toast({ title: "¡Curso eliminado!" });
    } catch (error) {
      toast({ title: "Error", description: "Hubo un problema al eliminar el curso.", variant: "destructive" });
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Abrir menú</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/admin/courses/${course.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el curso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// 2. Definiendo las columnas de la tabla (actualizado para mostrar el nombre)
export const columns: ColumnDef<Course>[] = [
  {
    accessorKey: 'title',
    header: 'Título',
  },
  {
    accessorKey: 'teacherName', // Apuntamos al nuevo campo 'teacherName'
    header: 'Docente',
    cell: ({ row }) => row.original.teacherName || <span className="text-muted-foreground">No asignado</span>,
  },
  {
    accessorKey: 'isPublished',
    header: 'Estado',
    cell: ({ row }) => {
      const isPublished = row.getValue('isPublished');
      return <Badge variant={isPublished ? 'default' : 'secondary'}>{isPublished ? 'Publicado' : 'Borrador'}</Badge>;
    },
  },
  {
    id: 'actions',
    cell: ActionsCell,
  },
];

// 3. Componente principal de la tabla (con lógica de enriquecimiento de datos)
export function CoursesDataTable() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    setIsLoading(true);

    const fetchData = async () => {
        try {
            // 1. Obtener todos los docentes y crear un mapa de ID a nombre
            const teachersQuery = query(collection(firestore, "users"), where("role", "in", ["TEACHER", "SUPER_ADMIN"]));
            const teachersSnap = await getDocs(teachersQuery);
            const teachersMap = new Map<string, string>();
            teachersSnap.forEach(doc => {
                teachersMap.set(doc.id, doc.data().displayName as string);
            });

            // 2. Suscribirse a los cambios en los cursos
            const coursesQuery = query(collection(firestore, 'courses'));
            const unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
                const coursesData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title,
                        teacherId: data.teacherId,
                        isPublished: data.isPublished,
                        // 3. Enriquecer el curso con el nombre del docente
                        teacherName: teachersMap.get(data.teacherId),
                    } as Course;
                });
                setCourses(coursesData);
                setIsLoading(false);
            });

            // Devolver la función de limpieza para onSnapshot
            return unsubscribe;
        } catch (error) {
            console.error("Error al cargar los datos de la tabla: ", error);
            setIsLoading(false);
        }
    };

    const unsubscribePromise = fetchData();

    // Limpieza al desmontar el componente
    return () => {
        unsubscribePromise.then(unsubscribe => {
            if (unsubscribe) {
                unsubscribe();
            }
        });
    };
  }, [firestore]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full mt-4" />;
  }
  
  return <DataTable columns={columns} data={courses} />;
}
