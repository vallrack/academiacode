
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, UserCheck } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

// Definiendo la estructura de un usuario
export type User = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
};

// Componente de la celda de acciones
const ActionsCell = ({ row }: { row: any }) => {
  const user = row.original as User;
  const firestore = useFirestore();
  const { toast } = useToast();

  const setRole = async (role: 'student' | 'teacher' | 'admin') => {
    if (!firestore) return;
    const userRef = doc(firestore, "users", user.id);
    try {
      await updateDoc(userRef, { role });
      toast({ 
        title: "¡Rol actualizado!", 
        description: `El usuario ${user.name} ahora es ${role}.`
      });
    } catch (error) {
      console.error("Error al actualizar el rol: ", error);
      toast({ 
        title: "Error", 
        description: "Hubo un problema al cambiar el rol.",
        variant: "destructive"
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>Abrir menú</span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Cambiar Rol</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setRole('student')}>
          <UserCheck className="mr-2 h-4 w-4" />
          Hacer Estudiante
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setRole('teacher')}>
          <UserCheck className="mr-2 h-4 w-4" />
          Hacer Docente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setRole('admin')}>
          <UserCheck className="mr-2 h-4 w-4" />
          Hacer Administrador
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Definiendo las columnas de la tabla
export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Rol',
    cell: ({ row }) => {
      const role = row.getValue('role') as string;
      let variant: "default" | "secondary" | "destructive" = 'secondary';
      if (role === 'admin') variant = 'destructive';
      if (role === 'teacher') variant = 'default';
      
      return <Badge variant={variant}>{role}</Badge>;
    },
  },
  {
    id: 'actions',
    cell: ActionsCell,
  },
];

export function UsersDataTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    const q = query(collection(firestore, 'users'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      setIsLoading(false);
    }, (error) => {
        console.error("Error al obtener los usuarios: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full mt-4" />;
  }
  
  return <DataTable columns={columns} data={users} />;
}
