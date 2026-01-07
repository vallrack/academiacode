
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Layers, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, deleteDoc, DocumentData, Query, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/contexts/user-profile-context";

type GroupSchedule = {
  days: string[];
  startTime: string;
  endTime: string;
};

type Group = {
  id: string;
  name: string;
  schedule: GroupSchedule | string; // Support old and new format
};

export default function GroupsPage() {
  const { userProfile } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile) return null;
    
    // Super admin sees all groups
    if (isSuperAdmin) {
        return collection(firestore, "groups") as Query<Group & DocumentData>;
    }

    // Teacher sees only managed groups
    if (userProfile.role === 'TEACHER' && userProfile.managedGroupIds && userProfile.managedGroupIds.length > 0) {
        return query(collection(firestore, "groups"), where('__name__', 'in', userProfile.managedGroupIds));
    }

    // Students or teachers with no groups see nothing (or you can return a query that yields no results)
    return null;

  }, [firestore, userProfile, isSuperAdmin]);

  const { data: groups, loading } = useCollection(groupsQuery);

  const hasGroups = !loading && groups && groups.length > 0;

  const confirmDelete = (group: Group) => {
    setGroupToDelete(group);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!groupToDelete || !firestore || !isSuperAdmin) return;

    setIsDeleting(true);
    const groupRef = doc(firestore, "groups", groupToDelete.id);

    try {
      await deleteDoc(groupRef);
      toast({
        title: "Grupo Eliminado",
        description: `El grupo "${groupToDelete.name}" ha sido eliminado.`,
      });
      setIsAlertOpen(false);
      setGroupToDelete(null);
    } catch (error) {
      console.error("Error deleting group: ", error);
      toast({
        variant: "destructive",
        title: "Error al Eliminar",
        description: "No se pudo eliminar el grupo.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatSchedule = (schedule: GroupSchedule | string) => {
    if (typeof schedule === 'string') {
      return schedule; // For backward compatibility
    }
    if (typeof schedule === 'object' && schedule.days && schedule.startTime && schedule.endTime) {
      const days = schedule.days.join(', ');
      return `${days} (${schedule.startTime} - ${schedule.endTime})`;
    }
    return "Horario no definido";
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-lg font-semibold md:text-2xl">Grupos</h1>
          {isSuperAdmin && (
            <Button className="w-full sm:w-auto" asChild>
              <Link href="/groups/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Grupo
              </Link>
            </Button>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Grupos</CardTitle>
            <CardDescription>
              {isSuperAdmin 
                ? "Administra los grupos y jornadas de los estudiantes."
                : "Estos son los grupos que tienes asignados para gestionar."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : hasGroups ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre del Grupo</TableHead>
                      <TableHead>Jornada</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <Link href={`/groups/edit/${group.id}`} className="hover:underline">
                            {group.name}
                          </Link>
                        </TableCell>
                        <TableCell>{formatSchedule(group.schedule)}</TableCell>
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
                                  <DropdownMenuItem onSelect={() => router.push(`/groups/edit/${group.id}`)}>
                                      Modificar y ver Estudiantes
                                  </DropdownMenuItem>
                                  {isSuperAdmin && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onSelect={() => confirmDelete(group)}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Eliminar
                                      </DropdownMenuItem>
                                    </>
                                  )}
                              </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
                <div className="flex flex-col items-center gap-1 text-center px-4">
                  <Layers className="h-12 w-12 text-muted-foreground" />
                  <h3 className="text-2xl font-bold tracking-tight">
                    {isSuperAdmin ? "Aún no se han creado grupos" : "No tienes grupos asignados"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isSuperAdmin 
                      ? "Comienza creando un nuevo grupo para organizar a tus estudiantes."
                      : "Contacta a un administrador para que te asigne grupos."
                    }
                  </p>
                  {isSuperAdmin && (
                    <Button className="mt-4" asChild>
                      <Link href="/groups/new">Nuevo Grupo</Link>
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
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente
                  el grupo "{groupToDelete?.name}" y desvinculará a los estudiantes
                  asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setGroupToDelete(null)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Eliminando..." : "Sí, eliminar grupo"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      )}
    </>
  );
}
