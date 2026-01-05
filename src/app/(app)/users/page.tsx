
"use client";

import { useState } from "react";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, doc, updateDoc, deleteDoc, DocumentData, Query } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, UserCog } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

type UserRole = "STUDENT" | "TEACHER" | "SUPER_ADMIN";

type User = {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
};

const roleMap: Record<UserRole, string> = {
  STUDENT: "Estudiante",
  TEACHER: "Profesor",
  SUPER_ADMIN: "Super Admin",
};

export default function UsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "users") as Query<User & DocumentData>;
  }, [firestore]);

  const { data: users, loading } = useCollection(usersQuery);

  const hasUsers = !loading && users && users.length > 0;

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!firestore) return;
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
    if (!userToDelete || !firestore) return;
    setIsDeleting(true);
    const userRef = doc(firestore, 'users', userToDelete.id);

    try {
      await deleteDoc(userRef);
      toast({
        title: "Usuario Eliminado",
        description: `El usuario "${userToDelete.displayName}" ha sido eliminado.`,
      });
      setIsAlertOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user: ", error);
      toast({
        variant: "destructive",
        title: "Error al Eliminar",
        description: "No se pudo eliminar el usuario. (Esto no elimina la cuenta de autenticación).",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
    const getRoleBadgeVariant = (role: UserRole) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'destructive';
            case 'TEACHER': return 'secondary';
            case 'STUDENT':
            default: return 'outline';
        }
    }


  return (
    <>
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold md:text-2xl">Gestión de Usuarios</h1>
        <Card>
          <CardHeader>
            <CardTitle>Todos los Usuarios</CardTitle>
            <CardDescription>
              Administra los roles y el acceso de todos los usuarios en la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : hasUsers ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Rol</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.displayName}</TableCell>
                        <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {roleMap[user.role] || "Desconocido"}
                          </Badge>
                        </TableCell>
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
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <UserCog className="mr-2 h-4 w-4" />
                                  <span>Cambiar Rol</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuRadioGroup
                                    value={user.role}
                                    onValueChange={(role) => handleRoleChange(user.id, role as UserRole)}
                                  >
                                    <DropdownMenuRadioItem value="STUDENT">Estudiante</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="TEACHER">Profesor</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="SUPER_ADMIN">Super Admin</DropdownMenuRadioItem>
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onSelect={() => confirmDelete(user)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Eliminar</span>
                              </DropdownMenuItem>
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
                <div className="flex flex-col items-center gap-1 text-center">
                  <h3 className="text-2xl font-bold tracking-tight">No hay usuarios registrados</h3>
                  <p className="text-sm text-muted-foreground">
                    Los nuevos usuarios aparecerán aquí.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el documento del usuario "{userToDelete?.displayName}" de Firestore. No eliminará la cuenta de autenticación del usuario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Sí, eliminar usuario"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    