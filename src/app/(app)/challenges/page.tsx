
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Play } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore } from "@/firebase";
import { collection, DocumentData, Query } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Challenge = {
  id: string;
  title: string;
  language: string;
  status: "draft" | "published" | "archived";
};

export default function ChallengesPage() {
    const firestore = useFirestore();
    
    const challengesQuery = useMemo(() => {
        if (!firestore) return null;
        return collection(firestore, "challenges") as Query<Challenge & DocumentData>;
    }, [firestore]);

    const { data: challenges, loading } = useCollection(challengesQuery);

    const hasChallenges = !loading && challenges && challenges.length > 0;

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Desafíos</h1>
            <Button className="ml-auto" asChild>
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Lenguaje</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {challenges.map((challenge) => (
                            <TableRow key={challenge.id}>
                                <TableCell className="font-medium">{challenge.title}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{challenge.language}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={challenge.status === 'published' ? 'secondary' : 'outline'}>
                                        {challenge.status === 'draft' ? 'Borrador' : challenge.status === 'published' ? 'Publicado' : 'Archivado'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" asChild>
                                        <Link href={`/session/${challenge.id}`}>
                                            <Play className="mr-2 h-4 w-4" />
                                            Comenzar
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
                  <div className="flex flex-col items-center gap-1 text-center">
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

