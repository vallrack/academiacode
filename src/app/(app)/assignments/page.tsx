
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore } from "@/firebase";
import { collection, query, where, onSnapshot, type DocumentData, type Query } from "firebase/firestore";
import { Calendar, BookOpen, Users, Clock, User, PlusCircle, AlertCircle, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import AssignChallengeModal from '@/components/app/assign-challenge-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useToast } from '@/hooks/use-toast';

export const dynamic = 'force-dynamic';

type GroupSchedule = {
  days: string[];
  startTime: string;
  endTime: string;
};

type Group = { 
  id: string; 
  name: string;
  schedule: GroupSchedule | string;
};
type Student = { id: string; displayName: string; groupId: string };

type Assignment = DocumentData & { id: string };

export default function AssignmentsPageContent() {
  const { userProfile, loadingProfile } = useUserProfile();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [filterStudent, setFilterStudent] = useState<string>('');
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [groups, setGroups] = useState<DocumentData[]>([]);
  const [students, setStudents] = useState<DocumentData[]>([]);
  const [challenges, setChallenges] = useState<DocumentData[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isTeacher = userProfile?.role === 'TEACHER';
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';
  const canCreate = isTeacher || isSuperAdmin;
  
  // Fetch challenges for their titles
  useEffect(() => {
    if (!firestore) return;
    const unsubChallenges = onSnapshot(collection(firestore, 'challenges'), (snapshot) => {
      setChallenges(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Error fetching challenges for titles:", err));

    return () => {
      if (unsubChallenges) unsubChallenges();
    };
  }, [firestore]);
  
  const challengesMap = useMemo(() => {
    return new Map(challenges.map(c => [c.id, c.title]));
  }, [challenges]);

  // Fetch filter data (groups and students for privileged users)
  useEffect(() => {
    if (!firestore || !canCreate) return;

    let unsubGroups: (() => void) | null = null;
    let unsubStudents: (() => void) | null = null;
    
    try {
        unsubGroups = onSnapshot(collection(firestore, 'groups'), (snapshot) => {
          setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => console.error("Error fetching groups:", err));
    
        unsubStudents = onSnapshot(query(collection(firestore, 'users'), where('role', '==', 'STUDENT')), (snapshot) => {
          setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => console.error("Error fetching students:", err));
    } catch(e) {
        console.error('Error setting up filter listeners:', e)
    }

    return () => {
      if (unsubGroups) try { unsubGroups(); } catch (e) { console.warn('Error during groups unsubscribe:', e); }
      if (unsubStudents) try { unsubStudents(); } catch (e) { console.warn('Error during students unsubscribe:', e); }
    };
  }, [firestore, canCreate]);

  // Main assignments query effect
  useEffect(() => {
    if (loadingProfile || !firestore || !userProfile) {
      if (!loadingProfile) {
        setAssignments([]);
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    let unsubscribe: (() => void) | null = null;
    
    try {
        const assignmentsQuery = query(collection(firestore, 'assignments'));

        unsubscribe = onSnapshot(assignmentsQuery, (snapshot) => {
            let allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
            // Client-side filtering logic
            let filteredResults = allDocs;
            
            if (userProfile.role === 'STUDENT') {
                filteredResults = allDocs.filter(a => 
                    (a.targetType === 'group' && a.targetId === userProfile.groupId) ||
                    (a.targetType === 'student' && a.targetId === userProfile.uid)
                );
            } else if (canCreate) { // Apply admin/teacher filters
                const teacherManagedGroups = userProfile.managedGroupIds || [];
                const studentIdsInManagedGroups = new Set(students.filter(s => teacherManagedGroups.includes(s.groupId)).map(s => s.id));

                if (isTeacher) {
                    // Teacher sees only assignments for their groups or individual students in their groups
                    filteredResults = allDocs.filter(a => 
                        (a.targetType === 'group' && teacherManagedGroups.includes(a.targetId)) ||
                        (a.targetType === 'student' && studentIdsInManagedGroups.has(a.targetId))
                    );
                }

                if (filterGroup) {
                    filteredResults = filteredResults.filter(a => a.targetType === 'group' && a.targetId === filterGroup);
                }
                if (filterStudent) {
                    filteredResults = filteredResults.filter(a => a.targetType === 'student' && a.targetId === filterStudent);
                }
            }
            
            filteredResults.sort((a, b) => (b.assignedAt?.toMillis() || 0) - (a.assignedAt?.toMillis() || 0));
            
            setAssignments(filteredResults);
            setError(null);
            setIsLoading(false);
        }, (err: any) => {
            if (err.message.includes('INTERNAL ASSERTION')) {
              console.warn('Firestore internal assertion failure ignored in assignments listener.');
            } else {
              console.error("Error fetching assignments: ", err);
              setError(err.message);
              setIsLoading(false);
              toast({ variant: 'destructive', title: 'Error de Permisos', description: 'No se pudieron cargar las asignaciones.' });
            }
        });
    } catch(e: any) {
        console.error('Error setting up assignments listener:', e);
        setError(e.message);
        setIsLoading(false);
    }
    
    return () => {
        if (unsubscribe) {
            try { unsubscribe(); } catch (e) { console.warn('Error during assignments unsubscribe:', e); }
        }
    };
  }, [firestore, userProfile, loadingProfile, filterGroup, filterStudent, canCreate, isTeacher, students, toast]);


  const handleClearFilters = () => {
    setFilterGroup('');
    setFilterStudent('');
  };
  
  const formatSchedule = (schedule: GroupSchedule | string) => {
    if (typeof schedule === 'string') {
      return schedule;
    }
    if (typeof schedule === 'object' && schedule.days && schedule.startTime && schedule.endTime) {
      const days = schedule.days.join(', ');
      return `${days} (${schedule.startTime} - ${schedule.endTime})`;
    }
    return "Horario no definido";
  };

  if (isLoading || loadingProfile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/3" />
          {canCreate && <Skeleton className="h-10 w-40" />}
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error al Cargar Asignaciones</AlertTitle>
        <AlertDescription>No se pudieron cargar las asignaciones. Esto puede ser un problema de permisos. Intenta recargar la página. <br /><span className="text-xs mt-2 block">{error}</span></AlertDescription>
      </Alert>
    );
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha no disponible';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isOverdue = (dueDate: any) => {
    if (!dueDate) return false;
    const date = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
    return date < new Date();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-2xl font-bold">{userProfile?.role === 'STUDENT' ? 'Mis Asignaciones' : 'Gestión de Asignaciones'}</h1>
          <p className="text-muted-foreground">{userProfile?.role === 'STUDENT' ? 'Completa tus desafíos antes de la fecha límite.' : 'Gestiona las asignaciones de tus estudiantes.'}</p>
        </div>
        {canCreate && (
          <Button className="w-full sm:w-auto" onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Nueva Asignación
          </Button>
        )}
      </div>
      
      {canCreate && (
        <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-muted-foreground"/>
                <h3 className="text-lg font-semibold">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="filter-group">Filtrar por Grupo</Label>
                    <Select value={filterGroup} onValueChange={(value) => { setFilterGroup(value); setFilterStudent(''); }}>
                        <SelectTrigger id="filter-group"><SelectValue placeholder="Todos los grupos" /></SelectTrigger>
                        <SelectContent>
                            {groups?.map(group => <SelectItem key={group.id} value={group.id}>{(group as Group).name} - {formatSchedule((group as Group).schedule)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="filter-student">Filtrar por Estudiante</Label>
                    <Select value={filterStudent} onValueChange={(value) => { setFilterStudent(value); setFilterGroup(''); }}>
                        <SelectTrigger id="filter-student"><SelectValue placeholder="Todos los estudiantes" /></SelectTrigger>
                        <SelectContent>
                            {students?.map(student => <SelectItem key={student.id} value={student.id}>{(student as Student).displayName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={handleClearFilters} className="w-full">Limpiar Filtros</Button>
                </div>
            </div>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16 mt-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-2xl font-bold tracking-tight">No hay asignaciones para mostrar</h3>
            <p className="text-sm text-muted-foreground">
              {canCreate 
                ? 'Crea una nueva asignación o ajusta los filtros para verla aquí.' 
                : 'Cuando un profesor te asigne un desafío, aparecerá aquí.'
              }
            </p>
            {canCreate && <Button className="mt-4" onClick={() => setIsFormOpen(true)}>Nueva Asignación</Button>}
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => {
            const overdue = assignment.dueDate && isOverdue(assignment.dueDate);
            const challengeTitle = challengesMap.get(assignment.challengeId) || assignment.challengeTitle;
            return (
              <div key={assignment.id} className={`bg-card rounded-lg border p-6 transition-shadow hover:shadow-md ${overdue ? 'border-destructive' : 'border-border'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      {assignment.targetType === 'group' ? (
                        <div className="flex items-center gap-1.5 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium dark:bg-blue-900/50 dark:text-blue-300">
                          <Users className="w-4 h-4" />
                          <span>Asignación Grupal</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium dark:bg-purple-900/50 dark:text-purple-300">
                          <User className="w-4 h-4" />
                          <span>Asignación Individual</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{challengeTitle || 'Desafío Asignado'}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mt-3">
                      {assignment.dueDate && (
                        <div className={`flex items-center gap-1.5 ${overdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                          <Calendar className="w-4 h-4" />
                          <span>Entrega: {formatDate(assignment.dueDate)}{overdue && <span className="ml-1">(Vencida)</span>}</span>
                        </div>
                      )}
                      {assignment.assignedAt && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Asignada: {formatDate(assignment.assignedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button onClick={() => router.push(`/session/${assignment.challengeId}`)} variant={overdue ? 'destructive' : 'default'} className="w-full mt-4 sm:w-auto sm:mt-0">
                    {userProfile?.role === 'STUDENT' ? 'Comenzar Desafío' : 'Ver Detalles'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {isFormOpen && canCreate && (
        <AssignChallengeModal
          challengeId={''} // This needs to be handled differently now, maybe open from a challenge
          challengeTitle={''}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
