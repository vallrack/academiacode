'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useMemoFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, type DocumentData } from "firebase/firestore";
import { Calendar, BookOpen, Users, Clock, User, PlusCircle, AlertCircle, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import CreateAssignmentForm from '@/components/app/create-assignment-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUserProfile } from '@/contexts/user-profile-context';

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
type Student = { id: string; displayName: string };

export default function AssignmentsPageContent() {
  const { userProfile, loadingProfile } = useUserProfile();
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const router = useRouter();
  
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [filterStudent, setFilterStudent] = useState<string>('');

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile) return null;

    const assignmentsRef = collection(firestore, 'assignments');
    const isTeacherOrAdmin = userProfile.role === 'TEACHER' || userProfile.role === 'SUPER_ADMIN';

    if (isTeacherOrAdmin) {
      if (filterGroup) {
        return query(assignmentsRef, where('targetId', '==', filterGroup), where('targetType', '==', 'group'));
      }
      if (filterStudent) {
         return query(assignmentsRef, where('targetId', '==', filterStudent), where('targetType', '==', 'student'));
      }
      return query(assignmentsRef);
    }
    
    if (userProfile.groupId) {
      return query(assignmentsRef, where('targetId', 'in', [userProfile.groupId, userProfile.uid]));
    }

    return query(assignmentsRef, where('targetId', '==', userProfile.uid));
  }, [firestore, userProfile, filterGroup, filterStudent]);
  
  const { data: assignmentsRaw, isLoading: loadingAssignments, error } = useCollection<DocumentData>(assignmentsQuery);
  
  const groupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'groups');
  }, [firestore]);
  const { data: groups, isLoading: loadingGroups } = useCollection<DocumentData>(groupsQuery);
  
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', '==', 'STUDENT'));
  }, [firestore]);
  const { data: students, isLoading: loadingStudents } = useCollection<DocumentData>(studentsQuery);

  const assignments = useMemo(() => {
    if (!assignmentsRaw || !userProfile) return [];
    
    if (userProfile.role === 'STUDENT') {
      return assignmentsRaw.filter(a => 
        (a.targetType === 'group' && a.targetId === userProfile.groupId) ||
        (a.targetType === 'student' && a.targetId === userProfile.uid)
      ).sort((a, b) => (b.assignedAt?.toMillis() || 0) - (a.assignedAt?.toMillis() || 0));
    }
    
    return [...assignmentsRaw].sort((a, b) => (b.assignedAt?.toMillis() || 0) - (a.assignedAt?.toMillis() || 0));
  }, [assignmentsRaw, userProfile]);

  const isLoading = loadingProfile || loadingAssignments;
  const canCreate = userProfile?.role === 'TEACHER' || userProfile?.role === 'SUPER_ADMIN';
  
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


  if (isLoading) {
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

  if (!userProfile) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error de Perfil de Usuario</AlertTitle>
        <AlertDescription>No se pudo cargar el perfil del usuario. Por favor, recarga la página.</AlertDescription>
      </Alert>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error al Cargar Asignaciones</AlertTitle>
        <AlertDescription>No se pudieron cargar las asignaciones. Esto puede ser un problema de permisos. Intenta recargar la página. <br /><span className="text-xs mt-2 block">{error.message}</span></AlertDescription>
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
          <h1 className="text-2xl font-bold">{userProfile.role === 'STUDENT' ? 'Mis Asignaciones' : 'Gestión de Asignaciones'}</h1>
          <p className="text-muted-foreground">{userProfile.role === 'STUDENT' ? 'Completa tus desafíos antes de la fecha límite.' : 'Gestiona las asignaciones de tus estudiantes.'}</p>
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
                    {loadingGroups ? <Skeleton className="h-10 w-full" /> : (
                      <Select value={filterGroup} onValueChange={(value) => { setFilterGroup(value); setFilterStudent(''); }}>
                          <SelectTrigger id="filter-group"><SelectValue placeholder="Todos los grupos" /></SelectTrigger>
                          <SelectContent>
                              {groups?.map(group => <SelectItem key={group.id} value={group.id}>{(group as Group).name} - {formatSchedule((group as Group).schedule)}</SelectItem>)}
                          </SelectContent>
                      </Select>
                    )}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="filter-student">Filtrar por Estudiante</Label>
                    {loadingStudents ? <Skeleton className="h-10 w-full" /> : (
                      <Select value={filterStudent} onValueChange={(value) => { setFilterStudent(value); setFilterGroup(''); }}>
                          <SelectTrigger id="filter-student"><SelectValue placeholder="Todos los estudiantes" /></SelectTrigger>
                          <SelectContent>
                              {students?.map(student => <SelectItem key={student.id} value={student.id}>{(student as Student).displayName}</SelectItem>)}
                          </SelectContent>
                      </Select>
                    )}
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
            return (
              <div key={assignment.id} className={`bg-card rounded-lg border p-6 transition-shadow hover:shadow-md ${overdue ? 'border-destructive' : 'border-border'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      {assignment.targetType === 'group' ? (
                        <div className="flex items-center gap-1.5 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                          <Users className="w-4 h-4" />
                          <span>Asignación Grupal</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                          <User className="w-4 h-4" />
                          <span>Asignación Individual</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Desafío Asignado</h3>
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
                    {userProfile.role === 'STUDENT' ? 'Comenzar Desafío' : 'Ver Detalles'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFormOpen && canCreate && (
        <CreateAssignmentForm onClose={() => setIsFormOpen(false)} onSuccess={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}
