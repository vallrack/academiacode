
'use client';

import { useState, useEffect, useMemo } from "react";
import { useFirestore } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, DocumentData, Query, where, query, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, UserCog, PlusCircle, Pencil, AlertTriangle, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/contexts/user-profile-context";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export const dynamic = 'force-dynamic';

type UserRole = "STUDENT" | "TEACHER" | "SUPER_ADMIN";

type GroupSchedule = {
  days: string[];
  startTime: string;
  endTime: string;
};

type User = {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  groupId?: string;
  groupName?: string;
  groupSchedule?: string;
};

type Group = {
  id: string;
  name: string;
  schedule: GroupSchedule | string;
  [key: string]: any;
}

const roleMap: Record<UserRole, string> = {
  STUDENT: "Estudiante",
  TEACHER: "Profesor",
  SUPER_ADMIN: "Super Admin",
};

const formatSchedule = (schedule: GroupSchedule | string) => {
    if (typeof schedule === 'string') {
      return schedule;
    }
    if (typeof schedule === 'object' && schedule.days && schedule.startTime && schedule.endTime) {
      const days = schedule.days.join(', ');
      return `${days} (${schedule.startTime} - ${schedule.endTime})`;
    }
    return "Horario no definido";
};

export default function StudentsPage() {
  const { userProfile, loadingProfile } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [filterGroup, setFilterGroup] = useState('');

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';
  const isTeacher = userProfile?.role === 'TEACHER';
  const canManage = isSuperAdmin || isTeacher;

  useEffect(() => {
    if (loadingProfile || !firestore || !canManage) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    
    const groupsQuery = collection(firestore, 'groups');
    const unsubGroups = onSnapshot(groupsQuery, (groupSnapshot) => {
      const fetchedGroups = groupSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
      setGroups(fetchedGroups);
    }, (error) => {
      console.error("Error fetching groups:", error);
      toast({ variant: "destructive", title: "Error al cargar grupos", description: error.message });
    });

    return () => unsubGroups();
  }, [firestore, loadingProfile, canManage, toast]);

  useEffect(() => {
    if (loadingProfile || !firestore || !userProfile || !canManage) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    
    const studentsQuery = query(collection(firestore, 'users'), where("role", "==", "STUDENT"));

    const unsubStudents = onSnapshot(studentsQuery, (studentSnapshot) => {
        const groupsMap = new Map<string, { name: string; schedule: string }>();
        groups.forEach(group => {
            groupsMap.set(group.id, { name: group.name, schedule: formatSchedule(group.schedule) });
        });

        const allStudentsData = studentSnapshot.docs.map(doc => {
            const student = { id: doc.id, ...doc.data() } as User;
            if (student.groupId) {
                const groupInfo = groupsMap.get(student.groupId);
                student.groupName = groupInfo?.name || 'Grupo Desconocido';
                student.groupSchedule = groupInfo?.schedule || 'Horario no definido';
            }
            return student;
        });

        if (userProfile.role === 'TEACHER') {
          const managedIds = userProfile.managedGroupIds || [];
          const filteredStudents = allStudentsData.filter(s => s.groupId && managedIds.includes(s.groupId));
          setAllStudents(filteredStudents);
        } else { // SUPER_ADMIN
          setAllStudents(allStudentsData);
        }

        setLoadingData(false);
    }, (error) => {
        console.error("Error fetching students: ", error);
        toast({ variant: "destructive", title: "Error al cargar estudiantes", description: error.message });
        setLoadingData(false);
    });

    return () => unsubStudents();
  }, [firestore, loadingProfile, canManage, toast, groups, userProfile]);


  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No tienes los permisos necesarios para ver esta página.</p>
        </CardContent>
      </Card>
    );
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!firestore || !isSuperAdmin) {
      toast({ variant: 'destructive', title: 'Permiso Denegado' });
      return;
    }
    const userRef = doc(firestore, 'users', userId);
    try {
      await updateDoc(userRef, { role: newRole });
      toast({
        title: "Rol Actualizado",
        description: `El rol del usuario ha sido cambiado a ${roleMap[newRole]}.`,
      });
    } catch (error) {
      console.error("Error updating role: ", error);
      toast({
        variant: "destructive",
        title: "Error al Actualizar",
        description: "No se pudo cambiar el rol del usuario.",
      });
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete || !firestore || !isSuperAdmin) {
       toast({ variant: 'destructive', title: 'Permiso Denegado' });
       return;
    }
    setIsDeleting(true);
    const userRef = doc(firestore, 'users', userToDelete.id);

    try {
      await deleteDoc(userRef);
      toast({
        title: "Estudiante Eliminado",
        description: `El estudiante "${userToDelete.displayName}" ha sido eliminado.`,
      });
    } catch (error) {
      console.error("Error deleting user: ", error);
      toast({
        variant: "destructive",
        title: "Error al Eliminar",
        description: "No se pudo eliminar el estudiante.",
      });
    } finally {
      setIsAlertOpen(false);
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };
  
  const studentsToDisplay = filterGroup 
    ? allStudents.filter(s => s.groupId === filterGroup)
    : allStudents;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg font-semibold md:text-2xl">Estudiantes</h1>
            {isSuperAdmin && (
             <Button className="w-full sm:w-auto" asChild>
                <Link href="/users/new">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Añadir Estudiante
                </Link>
            </Button>
            )}
        </div>
        
        <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-muted-foreground"/>
                <h3 className="text-lg font-semibold">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="filter-group">Filtrar por Grupo</Label>
                    <Select value={filterGroup} onValueChange={setFilterGroup}>
                        <SelectTrigger id="filter-group">
                            <SelectValue placeholder="Todos los grupos" />
                        </SelectTrigger>
                        <SelectContent>
                            {groups?.map(group => <SelectItem key={group.id} value={group.id}>{group.name} - {formatSchedule(group.schedule)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={() => setFilterGroup('')} className="w-full">Limpiar Filtro</Button>
                </div>
            </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Estudiantes</CardTitle>
            <CardDescription>
              Administra a todos los estudiantes inscritos en la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : studentsToDisplay.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Grupo y Horario</TableHead>
                      {isSuperAdmin && <TableHead className="text-right">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsToDisplay.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.displayName}</TableCell>
                        <TableCell className="hidden sm:table-cell">{student.email}</TableCell>
                        <TableCell className="hidden md:table-cell">
                           <div className="flex flex-col">
                                <span className="font-medium">{student.groupName || 'Sin grupo'}</span>
                                <span className="text-xs text-muted-foreground">{student.groupSchedule || ''}</span>
                           </div>
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                 <DropdownMenuItem onSelect={() => router.push(`/users/edit/${student.id}`)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>Modificar</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <UserCog className="mr-2 h-4 w-4" />
                                    <span>Cambiar Rol</span>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup
                                      value={student.role}
                                      onValueChange={(role) => handleRoleChange(student.id, role as UserRole)}
                                    >
                                      <DropdownMenuRadioItem value="STUDENT">Estudiante</DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="TEACHER">Profesor</DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="SUPER_ADMIN">Super Admin</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onSelect={() => confirmDelete(student)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Eliminar</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
                <div className="flex flex-col items-center gap-2 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                  <h3 className="text-2xl font-bold tracking-tight">No hay estudiantes para mostrar</h3>
                  <p className="text-sm text-muted-foreground">
                    Ajusta los filtros, o si eres profesor, asegúrate de tener grupos asignados.
                  </p>
                   {isSuperAdmin && (
                    <Button className="mt-4" asChild>
                        <Link href="/users/new">Añadir Estudiante</Link>
                    </Button>
                   )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {isSuperAdmin && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente el documento del estudiante "{userToDelete?.displayName}" de Firestore. No eliminará la cuenta de autenticación del usuario.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Eliminando..." : "Sí, eliminar estudiante"}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
