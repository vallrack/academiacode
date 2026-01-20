'use client';

import Link from 'next/link';
import { ArrowUpRight, BookCopy, Users, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore } from '@/firebase';
import { collection, query, where, limit, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '../ui/badge';
import { useRouter } from 'next/navigation';
import { RealTimeUsers } from './real-time-users';
import { useState, useEffect, useMemo } from 'react';

export function TeacherDashboard({ userProfile }: { userProfile: DocumentData }) {
  const firestore = useFirestore();
  const router = useRouter();

  const [stats, setStats] = useState({ challenges: 0, students: 0, assignments: 0 });
  const [loading, setLoading] = useState(true);
  
  const [recentGroupAssignments, setRecentGroupAssignments] = useState<DocumentData[]>([]);
  const [recentStudentAssignments, setRecentStudentAssignments] = useState<DocumentData[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  
  const managedGroupIds = useMemo(() => userProfile?.managedGroupIds || [], [userProfile?.managedGroupIds]);

  useEffect(() => {
    if (!firestore) {
      setLoading(false);
      return;
    }
    
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const challengesQuery = collection(firestore, 'challenges');
        const challengesSnap = await getDocs(challengesQuery);
        
        let studentCount = 0;
        let assignmentCount = 0;
        let studentIds: string[] = [];
        
        if (managedGroupIds.length > 0) {
            const studentsQuery = query(collection(firestore, 'users'), where('role', '==', 'STUDENT'), where('groupId', 'in', managedGroupIds));
            const studentsSnap = await getDocs(studentsQuery);
            studentCount = studentsSnap.size;
            studentIds = studentsSnap.docs.map(d => d.id);

            const groupAssignmentsQuery = query(collection(firestore, 'assignments'), where('targetType', '==', 'group'), where('targetId', 'in', managedGroupIds));
            const groupAssignmentsSnap = await getDocs(groupAssignmentsQuery);
            assignmentCount += groupAssignmentsSnap.size;
        }
        
        if (studentIds.length > 0) {
            const studentAssignmentsQuery = query(collection(firestore, 'assignments'), where('targetType', '==', 'student'), where('targetId', 'in', studentIds));
            const studentAssignmentsSnap = await getDocs(studentAssignmentsQuery);
            assignmentCount += studentAssignmentsSnap.size;
        }

        if (isMounted) {
            setStats({
                challenges: challengesSnap.size,
                students: studentCount,
                assignments: assignmentCount
            });
            setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();

    return () => { isMounted = false; };
  }, [firestore, managedGroupIds]);


  useEffect(() => {
    if (!firestore) {
      setLoadingAssignments(false);
      return;
    }

    const unsubscribes: (()=>void)[] = [];
    let isMounted = true;

    if (managedGroupIds.length > 0) {
        const recentGroupQuery = query(collection(firestore, 'assignments'), where('targetType', '==', 'group'), where('targetId', 'in', managedGroupIds), orderBy('assignedAt', 'desc'), limit(5));
        unsubscribes.push(onSnapshot(recentGroupQuery, (snap) => {
            if (isMounted) setRecentGroupAssignments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }));
    } else {
        if (isMounted) setRecentGroupAssignments([]);
    }

    const setupStudentListener = async () => {
        if (managedGroupIds.length > 0) {
            const studentsQuery = query(collection(firestore, 'users'), where('role', '==', 'STUDENT'), where('groupId', 'in', managedGroupIds));
            const studentsSnap = await getDocs(studentsQuery);
            const studentIds = studentsSnap.docs.map(d => d.id);

            if (studentIds.length > 0) {
                const recentStudentQuery = query(collection(firestore, 'assignments'), where('targetType', '==', 'student'), where('targetId', 'in', studentIds), orderBy('assignedAt', 'desc'), limit(5));
                unsubscribes.push(onSnapshot(recentStudentQuery, (snap) => {
                    if (isMounted) setRecentStudentAssignments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }));
            } else {
                if (isMounted) setRecentStudentAssignments([]);
            }
        } else {
            if (isMounted) setRecentStudentAssignments([]);
        }
        if (isMounted) setLoadingAssignments(false);
    };

    setupStudentListener();
    
    return () => {
        isMounted = false;
        unsubscribes.forEach(unsub => unsub());
    };
  }, [firestore, managedGroupIds]);

    const recentAssignments = useMemo(() => {
        const all = [...recentGroupAssignments, ...recentStudentAssignments];
        const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
        return unique.sort((a, b) => (b.assignedAt?.toMillis() || 0) - (a.assignedAt?.toMillis() || 0)).slice(0, 5);
    }, [recentGroupAssignments, recentStudentAssignments]);


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
                                  <TableHead>Desafío</TableHead>
                                  <TableHead>Tipo</TableHead>
                                  <TableHead>ID del Objetivo</TableHead>
                                  <TableHead className="text-right">Acción</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentAssignments.map((assignment: DocumentData) => (
                               <TableRow key={assignment.id}>
                                 <TableCell className="font-medium">{assignment.challengeTitle}</TableCell>
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
