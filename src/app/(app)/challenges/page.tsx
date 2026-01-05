
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Play } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { collection, DocumentData, Query } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type Challenge = {
  id: string;
  title: string;
  language: string;
  status: "draft" | "published" | "archived";
};

export default function ChallengesPage() {
    const firestore = useFirestore();
    
    const challengesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, "challenges") as Query<Challenge & DocumentData>;
    }, [firestore]);

    const { data: challenges, loading } = useCollection(challengesQuery);

    const hasChallenges = !loading && challenges && challenges.length > 0;

  return (
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
                                <TableHead className="hidden sm:table-cell">Lenguaje</TableHead>
                                <TableHead className="hidden md:table-cell">Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {challenges.map((challenge) => (
                                <TableRow key={challenge.id}>
                                    <TableCell className="font-medium">{challenge.title}</TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Badge variant="outline">{challenge.language}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <Badge variant={challenge.status === 'published' ? 'secondary' : 'outline'}>
                                            {challenge.status === 'draft' ? 'Borrador' : challenge.status === 'published' ? 'Publicado' : 'Archivado'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" asChild>
                                            <Link href={`/session/${challenge.id}`}>
                                                <Play className="mr-0 sm:mr-2 h-4 w-4" />
                                                <span className="hidden sm:inline">Comenzar</span>
                                            </Link>
                                        </Button>
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
  );
}
