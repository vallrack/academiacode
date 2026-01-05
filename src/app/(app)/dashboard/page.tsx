
'use client';

import Link from 'next/link';
import { ArrowUpRight, BookCopy, Users, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import type { DocumentData, Query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const firestore = useFirestore();

  const challengesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'challenges');
  }, [firestore]);
  const { data: challenges, loading: loadingChallenges } = useCollection(challengesQuery);

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', '==', 'STUDENT'));
  }, [firestore]);
  const { data: students, loading: loadingStudents } = useCollection(studentsQuery);
  
  // For now, we will query all attempts and filter for "in-progress" on the client
  // This can be optimized later if needed
  const attemptsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // This query is broad. In a real-world scenario with many users, 
    // you would likely use a collection group query and proper indexing.
    // For now, we'll assume a single user's attempts or a small dataset.
    // A more scalable approach would be querying a top-level 'challengeAttempts' collection.
    // Given the current structure in backend.json, this is complex.
    // Let's assume we get all users and then their attempts. For now, we'll mock this.
    return query(collection(firestore, 'challengeAttempts'), where('status', '==', 'in-progress'));
  }, [firestore]);
  // Due to Firestore query limitations on nested collections, we will simulate this for now.
  // In a real app, you would structure data differently or use collection group queries.
  const { data: liveSessionsData, loading: loadingSessions } = useCollection(null); // No real query for now.
  const liveSessions = []; // Hardcoded empty for now.
  const recentGrades = []; // Hardcoded empty for now.


  const loading = loadingChallenges || loadingStudents || loadingSessions;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones Activas</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{liveSessionsData?.length ?? 0}</div>}
            <p className="text-xs text-muted-foreground">Estudiantes resolviendo desafíos ahora</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desafíos Totales</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{challenges?.length ?? 0}</div>}
            <p className="text-xs text-muted-foreground">Desafíos en la biblioteca</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes Inscritos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{students?.length ?? 0}</div>}
            <p className="text-xs text-muted-foreground">Total de estudiantes en la plataforma</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sesiones de Estudiantes en Vivo</CardTitle>
            <CardDescription>Monitorea el progreso de los estudiantes en tiempo real.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : liveSessions.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Estudiante</TableHead>
                          <TableHead className="hidden sm:table-cell">Desafío</TableHead>
                          <TableHead className="hidden md:table-cell text-center">Progreso</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Live sessions would be mapped here */}
                      </TableBody>
                    </Table>
                </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center p-8 border-2 border-dashed rounded-lg">
                <Video className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-muted-foreground">No hay sesiones activas</h3>
                <p className="text-sm text-muted-foreground">Cuando un estudiante comience un desafío, aparecerá aquí.</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="grid gap-2">
                <CardTitle>Calificaciones Recientes</CardTitle>
                <CardDescription>Envíos de estudiantes calificados recientemente.</CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1 w-full sm:w-auto">
                <Link href="/results">
                  Ver Todo
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : recentGrades.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Estudiante</TableHead>
                              <TableHead>Desafío</TableHead>
                              <TableHead className="text-right">Calificación</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Recent grades would be mapped here */}
                      </TableBody>
                    </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center p-8 border-2 border-dashed rounded-lg">
                  <Users className="h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-muted-foreground">No hay calificaciones recientes</h3>
                  <p className="text-sm text-muted-foreground">Las calificaciones aparecerán aquí una vez que se evalúen los desafíos.</p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
