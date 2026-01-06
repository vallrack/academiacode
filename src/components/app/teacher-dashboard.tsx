'use client';

import Link from 'next/link';
import { ArrowUpRight, BookCopy, Users, Video, Layers, UserCog, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, or, limit, orderBy } from 'firebase/firestore';
import type { DocumentData, Query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '../ui/badge';
import { useRouter } from 'next/navigation';

export function TeacherDashboard({ userProfile }: { userProfile: DocumentData }) {
  const firestore = useFirestore();
  const router = useRouter();

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
  
  const groupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'groups');
  }, [firestore]);
  const { data: groups, loading: loadingGroups } = useCollection(groupsQuery);
  
  const staffQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'users'), 
        or(
            where('role', '==', 'TEACHER'),
            where('role', '==', 'SUPER_ADMIN')
        )
    );
  }, [firestore]);
  const { data: staff, loading: loadingStaff } = useCollection(staffQuery);

  const recentAssignmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'assignments'), orderBy('assignedAt', 'desc'), limit(5));
  }, [firestore]);
  const { data: recentAssignments, loading: loadingAssignments } = useCollection(recentAssignmentsQuery);


  const loading = loadingChallenges || loadingStudents || loadingGroups || loadingStaff || loadingAssignments;
  const isSuperAdmin = userProfile.role === 'SUPER_ADMIN';

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignaciones Totales</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{recentAssignments?.length ?? 0}</div>}
            <p className="text-xs text-muted-foreground">Total de asignaciones creadas</p>
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
         {isSuperAdmin && (
            <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Grupos Creados</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{groups?.length ?? 0}</div>}
                    <p className="text-xs text-muted-foreground">Total de grupos en la plataforma</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Profesores y Admins</CardTitle>
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{staff?.length ?? 0}</div>}
                    <p className="text-xs text-muted-foreground">Total de personal administrativo</p>
                  </CardContent>
                </Card>
            </>
        )}
      </div>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="grid gap-2">
                <CardTitle>Asignaciones Recientes</CardTitle>
                <CardDescription>Las últimas 5 asignaciones creadas en la plataforma.</CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1 w-full sm:w-auto">
                <Link href="/assignments">
                  Ver Todas
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
              ) : recentAssignments && recentAssignments.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>ID de Asignación</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>ID del Objetivo</TableHead>
                              <TableHead className="text-right">Acción</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentAssignments.map((assignment: DocumentData) => (
                           <TableRow key={assignment.id}>
                             <TableCell className="font-mono text-xs">{assignment.id}</TableCell>
                             <TableCell>
                                <Badge variant={assignment.targetType === 'group' ? 'default' : 'secondary'}>
                                    {assignment.targetType === 'group' ? 'Grupo' : 'Estudiante'}
                                </Badge>
                             </TableCell>
                             <TableCell className="font-mono text-xs">{assignment.targetId}</TableCell>
                             <TableCell className="text-right">
                               <Button variant="outline" size="sm" onClick={() => router.push(`/session/${assignment.challengeId}`)}>
                                 Ver Desafío
                               </Button>
                             </TableCell>
                           </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center p-8 border-2 border-dashed rounded-lg">
                  <ClipboardList className="h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-muted-foreground">No hay asignaciones recientes</h3>
                  <p className="text-sm text-muted-foreground">Las nuevas asignaciones aparecerán aquí.</p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
