
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Play, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, DocumentData, Query } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


type ChallengeStatus = "draft" | "published" | "archived";

type Challenge = {
  id: string;
  title: string;
  language: string;
  category: string;
  status: ChallengeStatus;
};

const statusMap: Record<ChallengeStatus, string> = {
    draft: 'Borrador',
    published: 'Publicado',
    archived: 'Archivado'
};

export default function ChallengesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const challengesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, "challenges") as Query<Challenge & DocumentData>;
    }, [firestore]);

    const { data: challenges, loading } = useCollection(challengesQuery);

    const hasChallenges = !loading && challenges && challenges.length > 0;

    const handleStatusChange = async (challengeId: string, newStatus: ChallengeStatus) => {
        if (!firestore) return;
        const challengeRef = doc(firestore, 'challenges', challengeId);
        try {
            await updateDoc(challengeRef, { status: newStatus });
            toast({
                title: "Estado Actualizado",
                description: `El desafío ha sido marcado como ${statusMap[newStatus]}.`,
            });
        } catch (error) {
            console.error("Error updating status: ", error);
            toast({
                variant: "destructive",
                title: "Error al Actualizar",
                description: "No se pudo cambiar el estado del desafío.",
            });
        }
    };

    const confirmDelete = (challenge: Challenge) => {
        setChallengeToDelete(challenge);
        setIsAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!challengeToDelete || !firestore) return;
        
        setIsDeleting(true);
        const challengeRef = doc(firestore, 'challenges', challengeToDelete.id);
        
        try {
            await deleteDoc(challengeRef);
            toast({
                title: "Desafío Eliminado",
                description: `El desafío "${challengeToDelete.title}" ha sido eliminado.`,
            });
            setIsAlertOpen(false);
            setChallengeToDelete(null);
        } catch (error) {
            console.error("Error deleting challenge: ", error);
            toast({
                variant: "destructive",
                title: "Error al Eliminar",
                description: "No se pudo eliminar el desafío.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusBadgeVariant = (status: ChallengeStatus) => {
        switch (status) {
            case 'published': return 'secondary';
            case 'archived': return 'destructive';
            case 'draft':
            default: return 'outline';
        }
    }


  return (
    <>
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Desafíos</h1>
                <Button className="w-full sm:w-auto" asChild>
                    <Link href="/challenges/new">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Nuevo Desafío
                    </Link>
                </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Biblioteca de Desafíos</CardTitle>
                <CardDescription>Administra y crea desafíos de código aquí.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : hasChallenges ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                                    <TableHead className="hidden sm:table-cell">Lenguaje</TableHead>
                                    <TableHead className="hidden md:table-cell">Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {challenges.map((challenge) => (
                                    <TableRow key={challenge.id}>
                                        <TableCell className="font-medium">{challenge.title}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{challenge.category}</TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Badge variant="outline">{challenge.language}</Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant={getStatusBadgeVariant(challenge.status)}>
                                                {statusMap[challenge.status] || 'Borrador'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="outline" size="icon" onClick={() => router.push(`/session/${challenge.id}`)}>
                                                    <Play className="h-4 w-4" />
                                                    <span className="sr-only">Comenzar Sesión</span>
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => router.push(`/challenges/edit/${challenge.id}`)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Modificar y Asignar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger>
                                                                <span>Cambiar Estado</span>
                                                            </DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent>
                                                                <DropdownMenuRadioGroup 
                                                                    value={challenge.status} 
                                                                    onValueChange={(status) => handleStatusChange(challenge.id, status as ChallengeStatus)}
                                                                >
                                                                    <DropdownMenuRadioItem value="published">Publicado</DropdownMenuRadioItem>
                                                                    <DropdownMenuRadioItem value="draft">Borrador</DropdownMenuRadioItem>
                                                                    <DropdownMenuRadioItem value="archived">Archivado</DropdownMenuRadioItem>
                                                                </DropdownMenuRadioGroup>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onSelect={() => confirmDelete(challenge)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
                      <div className="flex flex-col items-center gap-1 text-center px-4">
                        <h3 className="text-2xl font-bold tracking-tight">
                          Aún no se han creado desafíos
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Comienza creando un nuevo desafío.
                        </p>
                        <Button className="mt-4" asChild>
                            <Link href="/challenges/new">Nuevo Desafío</Link>
                        </Button>
                      </div>
                    </div>
                )}
              </CardContent>
            </Card>
        </div>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás absolutely seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el desafío
                        "{challengeToDelete?.title}" de nuestros servidores.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setChallengeToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? "Eliminando..." : "Sí, eliminar desafío"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

