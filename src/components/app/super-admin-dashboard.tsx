'use client';

import Link from 'next/link';
import { ArrowUpRight, BookCopy, Users, Layers, UserCog, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore } from '@/firebase';
import { collection, query, where, or, limit, orderBy, onSnapshot } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '../ui/badge';
import { useRouter } from 'next/navigation';
import { RealTimeUsers } from './real-time-users';
import { useState, useEffect } from 'react';

export function SuperAdminDashboard({ userProfile }: { userProfile: DocumentData }) {
  const firestore = useFirestore();
  const router = useRouter();
  
  const [stats, setStats] = useState({ challenges: 0, students: 0, groups: 0, staff: 0, assignments: 0 });
  const [loading, setLoading] = useState(true);
  const [recentAssignments, setRecentAssignments] = useState<DocumentData[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  useEffect(() => {
    if (!firestore) {
        setLoading(false);
        setLoadingAssignments(false);
        return;
    }

    const queries = {
      challenges: collection(firestore, 'challenges'),
      students: query(collection(firestore, 'users'), where('role', '==', 'STUDENT')),
      groups: collection(firestore, 'groups'),
      staff: query(collection(firestore, 'users'), or(where('role', '==', 'TEACHER'), where('role', '==', 'SUPER_ADMIN'))),
      assignments: query(collection(firestore, 'assignments'), orderBy('assignedAt', 'desc'), limit(5)),
    };

    const unsubscribes = Object.entries(queries).map(([key, q]) => {
      return onSnapshot(q, (snapshot) => {
        if (key === 'assignments') {
          setRecentAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoadingAssignments(false);
        } else {
            setStats(prev => ({ ...prev, [key]: snapshot.size }));
        }
        setLoading(false); // Consider loading finished when first data comes in
      }, (error) => {
        console.error(`Error fetching ${key}:`, error);
        setLoading(false);
        setLoadingAssignments(false);
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());

  }, [firestore]);


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
                <CardTitle className="text-sm font-medium">Estudiantes Inscritos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.students}</div>}
                <p className="text-xs text-muted-foreground">Total de estudiantes en la plataforma</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Grupos Creados</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.groups}</div>}
                <p className="text-xs text-muted-foreground">Total de grupos en la plataforma</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profesores y Admins</CardTitle>
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.staff}</div>}
                <p className="text-xs text-muted-foreground">Total de personal administrativo</p>
              </CardContent>
            </Card>
        </div>
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
                                <TableCell className="font-medium">{assignment.challengeTitle || assignment.challengeId}</TableCell>
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
       <div className="xl:col-span-1">
        <RealTimeUsers />
      </div>
    </div>
  );
}
