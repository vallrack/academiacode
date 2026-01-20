
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Play, Pencil, Trash2, Filter } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, DocumentData, Query, onSnapshot } from "firebase/firestore";
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
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const dynamic = 'force-dynamic';

type ChallengeStatus = "draft" | "published" | "archived";

type Challenge = {
  id: string;
  title: string;
  language: string;
  category: string;
  status: ChallengeStatus;
  createdBy: string;
};

const statusMap: Record<ChallengeStatus, string> = {
    draft: 'Borrador',
    published: 'Publicado',
    archived: 'Archivado'
};

const languages = [
  "javascript", "python", "java", "sql", "mysql", "csharp", "cpp", 
  "typescript", "go", "rust", "swift", "kotlin", "php", "ruby"
];

export default function ChallengesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [users, setUsers] = useState<DocumentData[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    
    const [filterLanguage, setFilterLanguage] = useState<string>('');

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!firestore) {
            setLoading(false);
            setLoadingUsers(false);
            return;
        }

        setLoading(true);
        const challengesQuery = collection(firestore, "challenges") as Query<Challenge & DocumentData>;
        const unsubscribeChallenges = onSnapshot(challengesQuery, 
            (snapshot) => {
                const challengesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
                setChallenges(challengesData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching challenges:", error);
                setLoading(false);
                toast({
                    variant: "destructive",
                    title: "Error al Cargar",
                    description: "No se pudieron cargar los desafíos.",
                });
            }
        );
        
        setLoadingUsers(true);
        const usersQuery = collection(firestore, "users");
        const unsubscribeUsers = onSnapshot(usersQuery,
            (snapshot) => {
                setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoadingUsers(false);
            },
            (error) => {
                console.error("Error fetching users:", error);
                setLoadingUsers(false);
                toast({
                    variant: "destructive",
                    title: "Error al Cargar Usuarios",
                    description: "No se pudo cargar la información de los creadores.",
                });
            }
        );

        return () => {
            unsubscribeChallenges();
            unsubscribeUsers();
        };
    }, [firestore, toast]);
    
    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u.displayName])), [users]);

    const groupedChallenges = useMemo(() => {
        const challengesToGroup = filterLanguage
            ? challenges.filter(c => c.language.toLowerCase() === filterLanguage.toLowerCase())
            : challenges;

        return challengesToGroup.reduce((acc, challenge) => {
            const { language } = challenge;
            if (!acc[language]) {
                acc[language] = [];
            }
            acc[language].push(challenge);
            return acc;
        }, {} as Record<string, Challenge[]>);
    }, [challenges, filterLanguage]);

    const isLoadingData = loading || loadingUsers;
    const hasChallenges = !isLoadingData && Object.keys(groupedChallenges).length > 0;

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
        } catch (error) {
            console.error("Error deleting challenge: ", error);
            toast({
                variant: "destructive",
                title: "Error al Eliminar",
                description: "No se pudo eliminar el desafío.",
            });
        } finally {
            setIsAlertOpen(false);
            setIsDeleting(false);
            setChallengeToDelete(null);
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
            
            <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-muted-foreground"/>
                    <h3 className="text-lg font-semibold">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="filter-language">Filtrar por Lenguaje</Label>
                        <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                            <SelectTrigger id="filter-language">
                                <SelectValue placeholder="Todos los lenguajes" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map(lang => <SelectItem key={lang} value={lang} className="capitalize">{lang}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" onClick={() => setFilterLanguage('')} className="w-full">Limpiar Filtro</Button>
                    </div>
                </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Biblioteca de Desafíos</CardTitle>
                <CardDescription>Administra y crea desafíos de código aquí, organizados por lenguaje.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                     <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : hasChallenges ? (
                    <Accordion type="multiple" className="w-full space-y-2">
                        {Object.entries(groupedChallenges).sort(([langA], [langB]) => langA.localeCompare(langB)).map(([language, langChallenges]) => (
                            <AccordionItem value={language} key={language} className="border-b-0 rounded-lg border bg-background">
                                <AccordionTrigger className="px-6 py-4 hover:no-underline rounded-t-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="capitalize text-lg font-semibold">{language}</span>
                                        <Badge variant="secondary">{langChallenges.length} {langChallenges.length === 1 ? 'desafío' : 'desafíos'}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="border-t">
                                    <div className="overflow-x-auto p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Título</TableHead>
                                                    <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                                                    <TableHead className="hidden md:table-cell">Creado por</TableHead>
                                                    <TableHead className="hidden lg:table-cell">Estado</TableHead>
                                                    <TableHead className="text-right">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {langChallenges.map((challenge) => (
                                                    <TableRow key={challenge.id}>
                                                        <TableCell className="font-medium">{challenge.title}</TableCell>
                                                        <TableCell className="hidden sm:table-cell">{challenge.category}</TableCell>
                                                        <TableCell className="hidden md:table-cell text-muted-foreground">{usersMap.get(challenge.createdBy) || 'Desconocido'}</TableCell>
                                                        <TableCell className="hidden lg:table-cell">
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
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
                      <div className="flex flex-col items-center gap-1 text-center px-4">
                        <h3 className="text-2xl font-bold tracking-tight">
                          No se encontraron desafíos
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Intenta ajustar el filtro o crea un nuevo desafío.
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
