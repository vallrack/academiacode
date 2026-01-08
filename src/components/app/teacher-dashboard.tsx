
'use client';

import Link from 'next/link';
import { ArrowUpRight, BookCopy, Users, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore } from '@/firebase';
import { collection, query, where, limit, orderBy, onSnapshot } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '../ui/badge';
import { useRouter } from 'next/navigation';
import { RealTimeUsers } from './real-time-users';
import { useState, useEffect } from 'react';

export function TeacherDashboard({ userProfile }: { userProfile: DocumentData }) {
  const firestore = useFirestore();
  const router = useRouter();

  const [stats, setStats] = useState({ challenges: 0, students: 0, assignments: 0 });
  const [loading, setLoading] = useState(true);
  const [recentAssignments, setRecentAssignments] = useState<DocumentData[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  useEffect(() => {
    if (!firestore) {
      setLoading(false);
      setLoadingAssignments(false);
      return;
    }

    const challengesQuery = collection(firestore, 'challenges');
    const studentsQuery = userProfile.managedGroupIds?.length > 0 
      ? query(collection(firestore, 'users'), where('role', '==', 'STUDENT'), where('groupId', 'in', userProfile.managedGroupIds))
      : null;
    const assignmentsQuery = query(collection(firestore, 'assignments'), orderBy('assignedAt', 'desc'), limit(5));

    const unsubChallenges = onSnapshot(challengesQuery, (snap) => setStats(s => ({ ...s, challenges: snap.size })), () => setLoading(false));
    const unsubStudents = studentsQuery ? onSnapshot(studentsQuery, (snap) => setStats(s => ({ ...s, students: snap.size })), () => setLoading(false)) : () => {};
    const unsubAssignments = onSnapshot(assignmentsQuery, (snap) => {
        setRecentAssignments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setStats(s => ({...s, assignments: snap.size}));
        setLoadingAssignments(false);
    }, () => setLoadingAssignments(false));

    // A simple way to turn off global loading state
    Promise.all([
        new Promise(res => onSnapshot(challengesQuery, res)),
        studentsQuery ? new Promise(res => onSnapshot(studentsQuery, res)) : Promise.resolve(),
    ]).then(() => setLoading(false));


    return () => {
        unsubChallenges();
        unsubStudents();
        unsubAssignments();
    };

  }, [firestore, userProfile.managedGroupIds]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Asignaciones Totales</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.assignments}</div>}
                <p className="text-xs text-muted-foreground">Total de asignaciones creadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Desafíos Totales</CardTitle>
                <BookCopy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.challenges}</div>}
                <p className="text-xs text-muted-foreground">Desafíos en la biblioteca</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mis Estudiantes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.students}</div>}
                <p className="text-xs text-muted-foreground">Estudiantes en los grupos que gestionas</p>
              </CardContent>
            </Card>
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
                 {loadingAssignments ? (
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
      <div className="xl:col-span-1">
        <RealTimeUsers />
      </div>
    </div>
  );
}
